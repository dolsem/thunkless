import type { MiddlewareAPI, Dispatch, AnyAction } from 'redux';

import type { ThunklessAction } from './thunkless-action.interface';
import { ActionStatus } from './action-status.enum';
import { createPromiseResolver } from './promise-resolver';

const HOP = Object.prototype.hasOwnProperty;

const createMiddleware = (
  store: MiddlewareAPI,
  next: Dispatch<AnyAction>,
  resolve: ReturnType<typeof createPromiseResolver>
) => (action: ThunklessAction<any>) => {
  if (!HOP.call(action, 'promise')) {
    if (typeof action.transform !== 'function') return next(action);
    return next(action.transform(action, store.getState()));
  }

  const {
    type,
    error,
    payload,
    promise,
    statusSelector,
    chain,
    dispatchOnError,
    transform,
    ...extra
  } = action;

  if (action.error === true) return next(action);

  if (statusSelector) { // Blocking  action
    if (!(type instanceof Array)) {
      throw new Error('`type` must be Array if `statusSelector` is defined');
    }

    const state = store.getState();
    if (!(statusSelector instanceof Array)) { // Single status selector
      const currentStatus = statusSelector(state);
      if (currentStatus === ActionStatus.BUSY || currentStatus === false) {
        return null;
      }
    } else { // Block action if any status selector returns BUSY
      for (let i = 0; i < statusSelector.length; i++) {
        const currentStatus = statusSelector[i](state);
        if (currentStatus === ActionStatus.BUSY || currentStatus === false) {
          return null;
        }
      }
    }
  }

  // If action.transform function is set, apply it before passing action to next.
  const _next = typeof transform === 'function'
    ? ((action: ThunklessAction<any>) => next(transform(action, store.getState()))) as Dispatch<AnyAction>
    : next;

  let successType: string;
  let failureType: string;

  if (type instanceof Array) {
    _next({ type: type[0], payload, ...extra }); // Dispatch start action
    successType = type[1];
    failureType = type[2];
  } else {
    successType = failureType = type;
  }

  // At this point, start action has been reduced and status has been updated if necessary
  const _promise = typeof promise === 'function' ? promise() : promise;

  return resolve(_next, _promise, action, successType, failureType, chain, dispatchOnError, extra);
}

export const middleware = (store: MiddlewareAPI) => (next: Dispatch<AnyAction>) =>
  createMiddleware(store, next, createPromiseResolver(store));
