![thunkless](https://user-images.githubusercontent.com/14323955/54049183-d62c0b80-41a9-11e9-911b-340de0bad6a5.png)
=============

Simple [Redux middleware](https://redux.js.org/advanced/middleware) for async actions without [thunks](https://github.com/reduxjs/redux-thunk).

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coverage-image]][coverage-url]
[![License: MIT][license-image]][license-url]

```bash
$ npm install thunkless
```

## What is it
<b><s>thunk</s>less</b> is a lightweight Redux middleware library for writing async actions with a simple declarative API. It is targeted at Redux apps that use the standard async action flow: dispatch start action to signal beginning of an event, wait till the promise is resolved or rejected, optionally dispatch more actions, i.e. side effects, finally dispatch a success or a failure action. <b><s>thunk</s>less</b> supports blocking actions - preventing an action from being dispatched until another action is completed.

## Motivation (aka What's wrong with Thunk)
[Redux Thunk](https://github.com/reduxjs/redux-thunk) provides a [dead simple](https://github.com/reduxjs/redux-thunk/blob/master/src/index.js) approach to asynchronous actions. Its simplicity (11 lines of code) makes it a very nice solution for small-sized apps. Its 100% imperative API, however, results in a fair amount of custom logic inside of thunks, and that becomes a pain point for bigger-sized apps (>10-15 async actions). To ensure bug-free behavior, all of these actions need to be tested for every scenario, and debugging them can be tedious when logic becomes more complex. The key insight about this is that in most cases these actions follow a similar pattern: dispatch a start action -> resolve a promise -> dispatch side effects -> dispatch a success action, or catch an error and dispatch actions for failure scenarios. This results in a lot of logic duplication. <b><s>thunk</s>less</b> abstracts this logic away and provides a simple declarative API for this common asynchronous pattern.

## Usage
The simplest (not the most useful) usage example:
```js
// Action
const confirmIdentity = name => ({
  promise: Promise.resolve('Valar dohaeris'),
  type: CONFIRM_IDENTITY,
  payload: 'Valar morghulis',
  meta: { name },
});

// Reducer
const reducer = (state, action) => {
  if (action.type !== CONFIRM_IDENTITY) return state;

  const { payload, meta: { name } } = action;
  if (payload === 'Valar morghulis') {
    return {
      ...state,
      [name]: { status: `Confirming ${name}'s identity...` },
    };
  } else if (payload === 'Valar dohaeris') {
    return {
      ...state,
      [name]: { status: `${name}'s identity has been confirmed.` },
    };
  } else {
    return {
      ...state,
      [name]: { status: `${name} is an impostor.` },
    };
  }
}
```
<b><s>thunk</s>less</b> will first send `CONFIRM_IDENTITY` action with payload `'Valar morghulis'`, wait until the promise resolves and send another `CONFIRM_IDENTITY` action with the result of the promise (`'Valar dohaeris'`). Note that the actions will be sent down the middleware chain via `next()` function call instead of getting dispatched, so any middleware placed before <b><s>thunk</s>less</b> WILL NOT process the action.

A more real-world example - authentication flow:
```js
// Action
const login = (email, password) => ({
  /**
   * If the value of promise is an async function (or a function that returns a promise)
   * and statusSelector is supplied, the promise will only be created if statusSelector
   * does not return false or thunkless.ActionStatus.BUSY. Otherwise, the action will be blocked.
   */
  promise: () => sendLoginRequest(email, password),
  type: [ // Separate action type for start, success, and failure, is a good common practice.
    START_AUTH,
    AUTH_SUCCESS,
    AUTH_FAILURE,
  ],
  // statusSelector is required if a duplicate action should be blocked.
  statusSelector: state => state.auth.loginStatus,
  /**
   * Actions in chain will be dispatched if the promise is successfully resolved.
   * If one of them results in error, AUTH_FAILURE will be sent. Otherwise,
   * thunkless will send AUTH_SUCCESS after dispatching chain actions.
   */
  chain: ({ userData, isReturningUser }) => [
    { type: INIT_USER, payload: userData },
    isReturningUser && { type: SHOW_MESSAGE, payload: 'Welcome back!' },
  ],
  /**
   * Action with type SHOW_ERROR will be dispatched on error with error object and
   * this login action instance in its payload.
   */
  dispatchOnError: SHOW_ERROR,
  meta: { email },
});

// Reducers
import { ActionStatus } from 'thunkless';

const { BUSY, SUCCESS, FAILURE } = ActionStatus;

const authReducer = (state, action) => {
  switch (action.type) {
    case START_AUTH: return {
      ...state,
      loginStatus: BUSY
    }

    case AUTH_SUCCESS: return {
      ...state,
      loginStatus: SUCCESS,
      username: action.payload.userData.username,
    }

    case AUTH_FAILURE: return {
      ...state,
      loginStatus: FAILURE,
    }

    default: return state;
  }
}

const userReducer = (state, action) => {
  if (action.type !== INIT_USER) return state;

  const { payload: { userData } } = action;
  return {
    ...state,
    [userData.username]: userData,
  };
}

const errorReducer = (state, action) => {
  if (action.type !== SHOW_ERROR) return state;

  const { payload: { error, origin } } = action;

  if (error.message === 'Email Not Found') {
    const { meta: { email } } = origin;
    return {
      ...state,
      message: `User with email ${email} does not exist.`,
    }
  }

  return {
    ...state,
    message: error.message
  };
}
```

## When to choose thunkless
<b><s>thunk</s>less</b> is useful for medium- and big-sized apps that have many asynchronous actions that follow the same common pattern.

<b><s>thunk</s>less</b> allows to block an action from being dispatched when another action is in progress. It does not, however, restore the state after an action has failed (e.g. an asynchronous action in the chain of another action). A library like [`redux-optimistic-ui`](https://github.com/mattkrick/redux-optimistic-ui) can be used together with <b><s>thunk</s>less</b> to enable that functionality.

<b><s>thunk</s>less</b> is not a suitable solution for apps that need advanced action queueing capabilities or complex side effect patterns (yet even big-sized apps don't typically need them). If those are a must, [`Redux-Saga`](https://github.com/redux-saga/redux-saga) is an excellent choice.

## Installation

```
npm install thunkless
```

Use [`applyMiddleware()`](https://redux.js.org/api-reference/applymiddleware) to enable:

```js
import { createStore, applyMiddleware } from 'redux';
import { middleware } from 'thunkless';
import rootReducer from './reducers/index';

const store = createStore(
  rootReducer,
  applyMiddleware(middleware)
);
```

## TypeScript
`createThunklessAction` is just an identity function that helps to strongly type action objects in TypeScript.
```ts
import { createThunklessAction } from 'thunkless';

const login = (email, password) => createThunklessAction({
  promise: sendLoginRequest(email, password),
  type: [
    LOGIN_REQUEST,
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
  ] as const,
  /**
   * Chain function parameter type will be inferred
   * from the promise result type.
   */
  chain: ({ userData, isReturningUser }) => [
    { type: INIT_USER, payload: userData },
    isReturningUser && { type: SHOW_MESSAGE, payload: 'Welcome back!' },
  ],
});
```

`ReducibleThunklessAction` type helper can be used to resolve action type properly in the reducer. Example usage:
```ts
import type { ReducibleThunklessAction } from 'thunkless';
import type { login, signup } from '../actions/auth';

const authReducer = (state, action: ReducibleThunklessAction<typeof login>|ReducibleThunklessAction<typeof signup>) => {
  switch (action.type) {
    case AUTH_SUCCESS: return {
      ...state,
      // username type will be inferred correctly
      username: action.payload.userData.username,
    }
  }
}
```

## License

MIT

[npm-image]: https://img.shields.io/npm/v/thunkless.svg
[npm-url]: https://npmjs.org/package/thunkless
[downloads-image]: https://img.shields.io/npm/dm/thunkless.svg
[downloads-url]: https://npmjs.org/package/thunkless
[travis-image]: https://travis-ci.org/dolsem/thunkless.svg?branch=master
[travis-url]: https://travis-ci.org/dolsem/thunkless
[coverage-image]: https://coveralls.io/repos/github/dolsem/thunkless/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/dolsem/thunkless?branch=master
[license-image]: https://img.shields.io/badge/License-MIT-blue.svg
[license-url]: https://opensource.org/licenses/MIT
