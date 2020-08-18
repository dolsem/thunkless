import { createThunklessAction } from '../src/create-thunkless-action';

it('is identity function', () => {
  const arg = {} as any;
  expect(createThunklessAction(arg)).toBe(arg);
});
