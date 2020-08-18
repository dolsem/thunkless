import type { ThunklessAction } from './thunkless-action.interface';

export const createThunklessAction = <
  P = never,
  S = any,
  T extends string|readonly [string, string, string] = [string, string, string],
>(action: ThunklessAction<P, S, T>) => action;
