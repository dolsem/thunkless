import { middleware } from '../src/middleware';
import { ActionStatus } from '../src/action-status.enum';

it('exports middleware', () => {
  expect(require('../src')).toHaveProperty('middleware', middleware);
});

it('exports ActionStatus', () => {
  expect(require('../src')).toHaveProperty('ActionStatus', ActionStatus);
});
