import type { AnyAction } from 'redux';
import type { StatusSelector } from './status-selector.interface';
import type { ThunklessChain, ErrorPayload } from './promise-resolver';

export interface ThunklessAction<T = never, S = any> {
  // FSA props
  type: string[]|string;
  error?: boolean;
  payload?: any;
  meta?: any;

  // thunkless props
  promise?: T extends never ? never : Promise<T>|(() => Promise<T>);
  statusSelector?: T extends never ? never : StatusSelector|StatusSelector[];
  chain?: T extends never ? never : ThunklessChain<T>;
  dispatchOnError?: T extends never ? never : string|((payload: ErrorPayload) => AnyAction|null|void);
  transform?: (action: this, store: S) => AnyAction;

  // other props
  [K: string]: any;
}
