import type { AnyAction } from 'redux';
import type { StatusSelector } from './status-selector.interface';
import type { ThunklessChain, ErrorPayload } from './promise-resolver';

export interface ThunklessAction<
  P = never,
  S = any,
  T extends readonly [string, string, string]|string = readonly [string, string, string]|string,
> {
  // FSA props
  type: T;
  error?: boolean;
  payload?: any;
  meta?: any;

  // thunkless props
  promise?: P extends never ? never : Promise<P>|(() => Promise<P>);
  statusSelector?: P extends never ? never : StatusSelector|StatusSelector[];
  chain?: P extends never ? never : ThunklessChain<P>;
  dispatchOnError?: P extends never ? never : string|((payload: ErrorPayload) => AnyAction|null|void);
  transform?: (action: this, store: S) => AnyAction;

  // other props
  [K: string]: any;
}
