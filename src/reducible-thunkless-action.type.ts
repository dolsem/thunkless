import type { ThunklessAction } from './thunkless-action.interface';
import type { ErrorPayload } from './promise-resolver';

type TransformedAction<A extends ThunklessAction<any>, T> = T extends ThunklessAction['transform'] ? ReturnType<T> : A; 

type OtherActionProps<T extends ThunklessAction<any>> = {
  promise?: never;
  statusSelector?: never;
  chain?: never;
  dispatchOnError?: never;
  transform?: never;
}&Omit<T,
  |'type'
  |'payload'
  |'promise'
  |'statusSelector'
  |'chain'
  |'dispatchOnError'
  |'transform'
>;

type SuccessPayload<T extends ThunklessAction<any>> =
  T['promise'] extends Promise<infer R> ? R :
  T['promise'] extends (...args: any[]) => Promise<infer R> ? R :
  never;

export type ReducibleThunklessAction<T extends ThunklessAction<any>> = T['type'] extends readonly [string, string, string]
  ? (
    |TransformedAction<{ type: T['type'][0], payload?: T['payload'] }&{ [K in keyof OtherActionProps<T>]: T[K] }, T['transform']>
    |TransformedAction<{ type: T['type'][1], payload: SuccessPayload<T> }&{ [K in keyof OtherActionProps<T>]: T[K] }, T['transform']>
    |TransformedAction<{ type: T['type'][2], payload: ErrorPayload, error: true }&{ [K in keyof OtherActionProps<T>]: T[K] }, T['transform']>
  )
  : T;
