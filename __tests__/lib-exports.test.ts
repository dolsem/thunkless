import { middleware } from '../src/middleware';
import { ActionStatus } from '../src/action-status.enum';
import { createThunklessAction } from '../src/create-thunkless-action';

it('exports middleware', () => {
  expect(require('../src/thunkless')).toHaveProperty('middleware', middleware);
});

it('exports ActionStatus', () => {
  expect(require('../src/thunkless')).toHaveProperty('ActionStatus', ActionStatus);
});

it('exports createThunklessAction', () => {
  expect(require('../src/thunkless')).toHaveProperty('createThunklessAction', createThunklessAction);
});
