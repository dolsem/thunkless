import type { AnyAction } from 'redux';
import type { ThunklessAction } from './thunkless-action.type';

export const createThunklessAction = <
  P = never,
  M = never,
  S = any,
  T extends string|readonly [string, string, string] = [string, string, string],
  R extends AnyAction = AnyAction,
  O extends Record<string, any> = {},
>(action: ThunklessAction<P, M, S, T, R, O>) => action;
