import ActionStatus from './ActionStatus';
import createPromiseResolver from './promiseResolver';

const HOP = Object.prototype.hasOwnProperty;

const createMiddleware = (store, next, resolve) => (action) => {
  if (!HOP.call(action, 'promise')) return next(action);

  const {
    // FSA props
    type,
    error,
    payload,

    // thunkless props
    promise,
    statusSelector,
    chain,
    dispatchOnError,
    transform,

    // anything else (should only include meta for FSA-compliancy)
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
    ? action => next(transform(action, store.getState()))
    : next;

  let successType;
  let failureType;

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

export default store => next => createMiddleware(store, next, createPromiseResolver(store));
