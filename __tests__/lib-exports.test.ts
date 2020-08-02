import { middleware } from '../src/middleware';
import { ActionStatus } from '../src/action-status.enum';

it('exports middleware', () => {
  expect(require('../src/thunkless')).toHaveProperty('middleware', middleware);
});

it('exports ActionStatus', () => {
  expect(require('../src/thunkless')).toHaveProperty('ActionStatus', ActionStatus);
});
