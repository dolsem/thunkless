import type { AnyAction } from 'redux';
import type { StatusSelector } from './status-selector.interface';
import type { ThunklessChain, ErrorPayload } from './promise-resolver';
export interface ThunklessActionProps<
  P = never,
  M = never,
  S = any,
  T extends readonly [string, string, string]|string = readonly [string, string, string]|string,
  R extends AnyAction = AnyAction,
> {
  // FSA props
  type: T;
  error?: boolean;
  payload?: any;
  meta?: M;

  // thunkless props
  promise?: P extends never ? never : Promise<P>|(() => Promise<P>);
  statusSelector?: P extends never ? never : StatusSelector|StatusSelector[];
  chain?: P extends never ? never : ThunklessChain<P>;
  dispatchOnError?: P extends never ? never : string|((payload: ErrorPayload) => AnyAction|null|void);
  transform?: (action: this, store: S) => R;
}

export type ThunklessAction<
  P = never,
  M = never,
  S = any,
  T extends readonly [string, string, string]|string = readonly [string, string, string]|string,
  R extends AnyAction = AnyAction,
  O extends Record<string, any> = {},
> = ThunklessActionProps<P, M, S, T, R>&{
  // other props
  [K in keyof O]: O[K];
}
