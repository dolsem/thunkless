import type { Dispatch, AnyAction } from 'redux';
import type { ThunklessAction } from '../src/thunkless-action.type';
import { createPromiseResolver } from '../src/promise-resolver';

const store = { dispatch: jest.fn(), getState: jest.fn() };
const mockValue = Symbol();
const next = jest.fn((action: ThunklessAction<any>) => mockValue);

const resolve = createPromiseResolver(store);

afterEach(() => {
  store.dispatch.mockClear();
  store.getState.mockClear();
  next.mockClear();
});

it('resolves promises', async () => {
  const payload = Symbol();
  const successType = 'SUCCESS_TYPE';

  const promise = resolve(next as Dispatch<AnyAction>, Promise.resolve(payload), null, successType, null, null, null, null);
  await expect(promise).resolves.toBe(mockValue);
  expect(next).toHaveBeenCalled();
  expect(next.mock.calls[0][0]).toHaveProperty('payload', payload);
  expect(next.mock.calls[0][0]).toHaveProperty('type', successType);
});

describe('chain actions', () => {
  it('dispatches single action', async () => {
    const chain = { type: 'TYPE_ONE' };
  
    await resolve(next as Dispatch<AnyAction>, Promise.resolve(), null, null, null, chain, null, null);
    expect(store.dispatch).toHaveBeenCalled();
    expect(store.dispatch.mock.calls[0][0]).toEqual(chain);
  });

  it('dispatches multiple actions', async () => {
    const chain = [{ type: 'TYPE_ONE' }, { type: 'TYPE_TWO' }];

    await resolve(next as Dispatch<AnyAction>, Promise.resolve(), null, null, null, chain.concat(null), null, null);
    expect(store.dispatch).toHaveBeenCalledTimes(2);
    store.dispatch.mock.calls.forEach(([action], index) => {
      expect(action).toEqual(chain[index]);
    });
  });

  it('supports promises', async () => {
    const chain = [{ type: 'TYPE_ONE' }, { type: 'TYPE_TWO' }];

    await resolve(next as Dispatch<AnyAction>, Promise.resolve(), null, null, null, Promise.resolve(chain), null, null);
    expect(store.dispatch).toHaveBeenCalledTimes(2);
    store.dispatch.mock.calls.forEach(([action], index) => {
      expect(action).toEqual(chain[index]);
    });
  });

  it('supports functions', async () => {
    const actionTypes = ['TYPE_ONE', 'TYPE_TWO'];
    const chain = payload => actionTypes.map(type => ({ type, payload }));
    const payload = Symbol();

    await resolve(next as Dispatch<AnyAction>, Promise.resolve(payload), null, null, null, chain, null, null);
    expect(store.dispatch).toHaveBeenCalledTimes(2);
    store.dispatch.mock.calls.forEach(([action], index) => {
      expect(action).toHaveProperty('type', actionTypes[index]);
      expect(action).toHaveProperty('payload', payload);      
    });
  });

  it('supports async functions', async () => {
    const actionTypes = ['TYPE_ONE', 'TYPE_TWO'];
    const chain = async (payload) => actionTypes.map(type => ({ type, payload }));
    const payload = Symbol();

    await resolve(next as Dispatch<AnyAction>, Promise.resolve(payload), null, null, null, chain, null, null);
    expect(store.dispatch).toHaveBeenCalledTimes(2);
    store.dispatch.mock.calls.forEach(([action], index) => {
      expect(action).toHaveProperty('type', actionTypes[index]);
      expect(action).toHaveProperty('payload', payload);      
    });
  });
});

it('supports actions with extra props', async () => {
  const extraFields = { meta: Symbol(), otherProp: Symbol() };
  const successType = 'SUCCESS_TYPE';

  await resolve(next as Dispatch<AnyAction>, Promise.resolve(), null, successType, null, null, null, extraFields);
  const [[errorAction]] = next.mock.calls;
  expect(errorAction).toHaveProperty('type', successType);
  expect(errorAction).toHaveProperty('meta', extraFields.meta);
  expect(errorAction).toHaveProperty('otherProp', extraFields.otherProp);
});

it('handles errors', async () => {
  const promise = new Promise(() => { Object.assign(null, null); });
  const chainOne = { type: 'CHAINED_ACTION' };
  const chainTwo = payload => { payload.method(); }
  const action = { type: 'ACTION_TYPE' };
  const extra = { prop: Symbol() };
  const failureType = 'FAILURE_TYPE';

  await resolve(next as Dispatch<AnyAction>, promise, action, null, failureType, chainOne, null, extra);
  expect(next).toHaveBeenCalledTimes(1);
  
  const [[failureAction]] = next.mock.calls;
  expect(failureAction).toHaveProperty('error', true);
  expect(failureAction).toHaveProperty('type', failureType);
  expect(failureAction).toHaveProperty('payload.origin', action);
  expect(failureAction).toHaveProperty('prop', extra.prop);
  expect(failureAction.payload.error).toBeInstanceOf(TypeError);

  await resolve(next as Dispatch<AnyAction>, Promise.resolve(), action, null, failureType, chainTwo, null, null);
  expect(next).toHaveBeenCalledTimes(2);
  expect(next.mock.calls[1][0].payload.error).toBeInstanceOf(TypeError);  
});

it('supports dispatchOnError', async () => {
  const failureType = 'FAILURE_TYPE';
  const errorActionType = 'ERROR_ACTION_TYPE';
  const action = { type: 'ACTION_TYPE' };

  const promise = new Promise(() => { Object.assign(null, null); });
  const dispatchOnErrorString = errorActionType;
  const dispatchOnErrorFunc = payload => ({ type: errorActionType, error: true, payload });

  await resolve(next as Dispatch<AnyAction>, promise, action, null, failureType, null, dispatchOnErrorString, null);
  expect(next).toHaveBeenCalledTimes(1);
  expect(store.dispatch).toHaveBeenCalledTimes(1);

  await resolve(next as Dispatch<AnyAction>, promise, action, null, failureType, null, dispatchOnErrorFunc, null);
  expect(next).toHaveBeenCalledTimes(2);
  expect(store.dispatch).toHaveBeenCalledTimes(2);

  const [[errorActionOne], [errorActionTwo]] = store.dispatch.mock.calls;

  expect(errorActionOne).toHaveProperty('error', true);
  expect(errorActionOne).toHaveProperty('type', errorActionType);
  expect(errorActionOne).toHaveProperty('payload.origin', action);
  expect(errorActionOne.payload.error).toBeInstanceOf(TypeError);

  expect(errorActionTwo).toHaveProperty('error', true);
  expect(errorActionTwo).toHaveProperty('type', errorActionType);
  expect(errorActionTwo).toHaveProperty('payload.origin', action);
  expect(errorActionTwo.payload.error).toBeInstanceOf(TypeError);

  await resolve(next as Dispatch<AnyAction>, promise, action, null, failureType, null, () => null, null);
  expect(next).toHaveBeenCalledTimes(3);
  expect(store.dispatch).toHaveBeenCalledTimes(2);
});
