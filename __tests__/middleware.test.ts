// Functions
const store = { dispatch: jest.fn(), getState: jest.fn() };
const next = jest.fn();
const resolve = jest.fn();

// Dependencies
jest.doMock('../src/promise-resolver', () => ({
  createPromiseResolver: jest.fn(() => resolve),
}));
jest.doMock('../src/action-status.enum', () => ({
  ActionStatus: {
    BUSY: 'busy', SUCCESS: 'success', FAILURE: 'failure',
  },
}));

import { ActionStatus } from '../src/action-status.enum';
import { middleware as createMiddleware } from '../src/middleware';

// Middleware initialization
const middleware = createMiddleware(store)(next);

// Tests
afterEach(() => {
  resolve.mockClear();
  next.mockClear();
  store.dispatch.mockClear();
  store.getState.mockClear();
});

it('ignores error actions or actions without promise and transform props', () => {
  const action1 = { type: 'SOME_ACTION_TYPE', payload: 'some payload' };
  const action2 = {
    type: 'SOME_ACTION_TYPE',
    promise: Promise.resolve(),
    error: true
  };

  middleware(action1);
  expect(next.mock.calls[0][0]).toEqual(action1);
  expect(store.dispatch).not.toHaveBeenCalled();
  expect(resolve).not.toHaveBeenCalled();

  middleware(action2);
  expect(next.mock.calls[1][0]).toEqual(action2);
  expect(store.dispatch).not.toHaveBeenCalled();
  expect(resolve).not.toHaveBeenCalled();
});

it('calls promiseResolver correctly', () => {
  const actionOne = {
    type: 'SOME_ACTION_TYPE',
    promise: Promise.resolve(),
  };
  const extraProps = { a: 1, b: 2, c: 3 };
  const actionTwo = {
    type: ['START_TYPE', 'SUCCESS_TYPE', 'FAILURE_TYPE'],
    promise: Promise.resolve(),
    chain: () => [],
    dispatchOnError: () => ({ type: 'ERROR_TYPE' }),
    ...extraProps,
  }

  middleware(actionOne);
  expect(resolve).toHaveBeenCalled();
  middleware(actionTwo);
  expect(resolve).toHaveBeenCalledTimes(2);

  const [actionOneResolverArgs, actionTwoResolverArgs] = resolve.mock.calls;

  expect(actionOneResolverArgs[0]).toEqual(next);  
  expect(actionOneResolverArgs[1]).toEqual(actionOne.promise);
  expect(actionOneResolverArgs[2]).toEqual(actionOne);
  expect(actionOneResolverArgs[3]).toEqual(actionOne.type);

  expect(actionTwoResolverArgs[0]).toEqual(next);
  expect(actionTwoResolverArgs[1]).toEqual(actionTwo.promise);
  expect(actionTwoResolverArgs[2]).toEqual(actionTwo);
  expect(actionTwoResolverArgs[3]).toEqual(actionTwo.type[1]);
  expect(actionTwoResolverArgs[4]).toEqual(actionTwo.type[2]);
  expect(actionTwoResolverArgs[5]).toEqual(actionTwo.chain);
  expect(actionTwoResolverArgs[6]).toEqual(actionTwo.dispatchOnError);
  expect(actionTwoResolverArgs[7]).toEqual(extraProps);
});

it('sends start action when necessary', () => {
  const actionOne = {
    type: 'SOME_TYPE',
    promise: Promise.resolve(),
    payload: {},
    meta: {},
    otherProp: 'value',
    chain: () => [],
  };
  const actionTwo = {
    type: ['START_TYPE', 'SUCCESS_TYPE', 'FAILURE_TYPE'],
    promise: Promise.resolve(),
    payload: {},
    statusSelector: null,
    dispatchOnError: null,
    chain: () => [],
    meta: {},
    otherProp: 'value',
  }

  middleware(actionOne);
  expect(next).not.toHaveBeenCalled();

  middleware(actionTwo);
  expect(next).toHaveBeenCalled();
  expect(next.mock.calls[0][0]).toHaveProperty('type', actionTwo.type[0]);
  expect(next.mock.calls[0][0]).toHaveProperty('payload', actionTwo.payload);
  expect(next.mock.calls[0][0]).toHaveProperty('meta', actionTwo.meta);
  expect(next.mock.calls[0][0]).toHaveProperty('otherProp', actionTwo.otherProp);
  expect(next.mock.calls[0][0]).not.toHaveProperty('promise');
  expect(next.mock.calls[0][0]).not.toHaveProperty('statusSelector');
  expect(next.mock.calls[0][0]).not.toHaveProperty('dispatchOnError');
  expect(next.mock.calls[0][0]).not.toHaveProperty('chain');
});

it('supports blocking actions', () => {
  const actionOne = {
    type: ['START_TYPE', 'SUCCESS_TYPE', 'FAILURE_TYPE'],
    promise: Promise.resolve(),
    statusSelector: state => state.substate.status,
  };
  const actionTwo = {
    type: ['OTHER_START_TYPE', 'OTHER_SUCCESS_TYPE', 'OTHER_FAILURE_TYPE'],
    promise: Promise.resolve(),
    statusSelector: ({ substate: { status } }) => (status !== ActionStatus.BUSY && status !== ActionStatus.FAILURE),
  }
  const actionThree = {
    type: ['DIFFERENT_START_TYPE', 'DIFFERENT_SUCCESS_TYPE', 'DIFFERENT_FAILURE_TYPE'],
    promise: Promise.resolve(),
    statusSelector: [state => state.status, state => state.otherStatus],
  }

  store.getState.mockReturnValueOnce({ substate: {} });
  middleware(actionOne);
  expect(store.getState).toBeCalled();
  expect(resolve).toBeCalled();

  store.getState.mockReturnValueOnce({ substate: { status: ActionStatus.SUCCESS } });
  middleware(actionOne);
  expect(store.getState).toBeCalledTimes(2);
  expect(resolve).toBeCalledTimes(2);

  store.getState.mockReturnValueOnce({ substate: { status: ActionStatus.FAILURE } });
  middleware(actionOne);
  expect(store.getState).toBeCalledTimes(3);
  expect(resolve).toBeCalledTimes(3);

  store.getState.mockReturnValueOnce({ substate: { status: ActionStatus.BUSY } });
  middleware(actionOne);
  expect(store.getState).toBeCalledTimes(4);
  expect(resolve).toBeCalledTimes(3);

  store.getState.mockReturnValueOnce({ substate: { status: ActionStatus.FAILURE } });
  middleware(actionTwo);
  expect(store.getState).toBeCalledTimes(5);
  expect(resolve).toBeCalledTimes(3);

  store.getState.mockReturnValueOnce({ status: ActionStatus.SUCCESS });
  middleware(actionThree);
  expect(store.getState).toBeCalledTimes(6);
  expect(resolve).toBeCalledTimes(4);

  store.getState.mockReturnValueOnce({ status: ActionStatus.SUCCESS, otherStatus: ActionStatus.BUSY });
  middleware(actionThree);
  expect(store.getState).toBeCalledTimes(7);
  expect(resolve).toBeCalledTimes(4);
});

it('supports async functions in promise prop', () => {
  const promiseInstance = Promise.resolve();
  const action = {
    type: 'SOME_TYPE',
    promise: jest.fn(() => promiseInstance),
  };

  middleware(action);
  expect(action.promise).toHaveBeenCalled();
  expect(resolve.mock.calls[0][1]).toEqual(promiseInstance);
});

it('throws an error if statusSelector is present and type is not an array', () => {
  const action = {
    type: 'SOME_TYPE',
    promise: Promise.resolve(),
    statusSelector: () => null,
  }

  expect(() => middleware(action)).toThrowError();
});

it('supports transform prop', () => {
  const types = {
    START: 'PREPARE_DEPARTURE',
    SUCCESS: 'LEFT_HOME',
    FAILURE: 'OVERSLEPT... OH NO',
  };

  const leaveForWork = {
    type: [types.START, types.SUCCESS, types.FAILURE],
    promise: Promise.resolve(),
    transform: (action, state) => {
      switch (action.type) {
        case types.START:
          return { ...action, meta: { takeUmbrella: state.weather === 'rain' } }
        case types.SUCCESS:
          return { ...action, meta: { useDifferentRoute: !!state.congestion } }
        default:
          return action;
      }
    },
  };

  store.getState.mockReturnValueOnce({ weather: 'rain' });
  store.getState.mockReturnValueOnce({ congestion: true });

  middleware(leaveForWork);
  expect(next).toHaveBeenCalledTimes(1);
  expect(next.mock.calls[0][0]).toHaveProperty('type', types.START);
  expect(next.mock.calls[0][0]).toHaveProperty('meta.takeUmbrella', true);
  expect(resolve.mock.calls[0][0]).toBeInstanceOf(Function);

  resolve.mock.calls[0][0]({ type: types.SUCCESS });
  expect(next).toHaveBeenCalledTimes(2);
  expect(next.mock.calls[1][0]).toHaveProperty('type', types.SUCCESS);
  expect(next.mock.calls[1][0]).toHaveProperty('meta.useDifferentRoute', true);
});

it('handles actions with transform prop but without promise', () => {
  const action = {
    type: 'TAKE_ITEMS',
    payload: ['Backpack'],
    transform: (action, state) => (state.isSunny
      ? { ...action, payload: action.payload.concat('Sunglasses') }
      : action
    ),
  }

  store.getState.mockReturnValueOnce({ isSunny: true });
  middleware(action);
  expect(next).toHaveBeenCalledTimes(1);
  expect(resolve).not.toHaveBeenCalled();
  expect(next.mock.calls[0][0]).toHaveProperty('payload.1', 'Sunglasses');

  store.getState.mockReturnValueOnce({ isSunny: false });
  middleware(action);
  expect(next).toHaveBeenCalledTimes(2);
  expect(resolve).not.toHaveBeenCalled();
  expect(next.mock.calls[1][0]).not.toHaveProperty('payload.1');
});
