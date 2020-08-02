import { ActionStatus } from '../src/action-status.enum';

it('is defined', () => {
  expect(ActionStatus).toBeDefined();
});

it('implements has', () => {
  expect(ActionStatus.has(ActionStatus.BUSY)).toBeTruthy();
  expect(ActionStatus.has(ActionStatus.FAILURE)).toBeTruthy();
  expect(ActionStatus.has(ActionStatus.SUCCESS)).toBeTruthy();
  expect(ActionStatus.has(undefined)).toBeFalsy();
  expect(ActionStatus.has('randomstring')).toBeFalsy();
});
