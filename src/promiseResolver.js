const prepareChain = (chain, payload) => Promise.all([
  payload, 
  typeof chain === 'function' ? chain(payload) : chain,
]);

const createDispatcher = (store, next, extra, type) =>
  ([payload, chain]) => {
    if (chain) {
      if (chain instanceof Array) {
        for (let i = 0; i < chain.length; i++) {
          if (chain[i]) store.dispatch(chain[i]);
        }
      } else {
        store.dispatch(chain);
      }
    }

    next({ ...extra, payload, type });
  }

const createErrorHandler = (store, next, failureType, dispatchOnError, action, extra) =>
  (error) => {
    const payload = {
      error,
      origin: action,
    };

    next({ ...extra, type: failureType, error: true, payload });

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
  }

export default store => 
  (next, promise, action, successType, failureType, chain, dispatchOnError, extra) =>
    promise
      .then(payload => prepareChain(chain, payload))
      .then(createDispatcher(store, next, extra, successType))
      .catch(createErrorHandler(store, next, failureType, dispatchOnError, action, extra));
