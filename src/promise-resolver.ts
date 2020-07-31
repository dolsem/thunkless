import type { MiddlewareAPI, Dispatch, AnyAction } from 'redux';
import type { ThunklessAction } from './thunkless-action.interface';

export type ChainedValue = AnyAction|AnyAction[]|void;
export type ThunklessChain<T = any> =
  |ChainedValue
  |Promise<ChainedValue>
  |((payload: T) => ChainedValue)
  |((payload: T) => Promise<ChainedValue>)

export type ErrorPayload = { error: Error, origin: ThunklessAction<any> }

const prepareChain = (chain: ThunklessChain) => typeof chain === 'function'
  ? async (payload: any): Promise<[any, ChainedValue]> => [payload, await chain(payload)]
  : async (payload: any): Promise<[any, ChainedValue]> => [payload, await chain];

const createDispatcher = (
  store: MiddlewareAPI,
  next: Dispatch<AnyAction>,
  extra: Record<string, any>,
  type: string,
) => ([payload, chain]: [any, ChainedValue]) => {
  if (chain) {
    if (chain instanceof Array) {
      for (let i = 0; i < chain.length; i++) {
        if (chain[i]) store.dispatch(chain[i]);
      }
    } else {
      store.dispatch(chain);
    }
  }

  return next({ ...extra, payload, type });
}

const createErrorHandler = (
  store: MiddlewareAPI,
  next: Dispatch<AnyAction>,
  failureType: string,
  dispatchOnError: ThunklessAction<any>['dispatchOnError'],
  action: ThunklessAction<any>,
  extra: Record<string, any>
) => (error: Error) => {
  const payload: ErrorPayload = {
    error,
    origin: action,
  };

  const nextval = next({ ...extra, type: failureType, error: true, payload });

  if (dispatchOnError) {
    if (typeof dispatchOnError === 'string') {
      store.dispatch({
        type: dispatchOnError,
        error: true,
        payload,
      });
    } else {
      const errorAction = dispatchOnError(payload);
      if (errorAction) store.dispatch(errorAction);
    }
  }

  return nextval;
}

export const createPromiseResolver = (store: MiddlewareAPI) => (
  next: Dispatch<AnyAction>,
  promise: Promise<unknown>,
  action: ThunklessAction<any>,
  successType: string,
  failureType: string,
  chain: ThunklessChain,
  dispatchOnError: ThunklessAction<any>['dispatchOnError'],
  extra: Record<string, any>,
) => promise
  .then(prepareChain(chain))
  .then(createDispatcher(store, next, extra, successType))
  .catch(createErrorHandler(store, next, failureType, dispatchOnError, action, extra));
