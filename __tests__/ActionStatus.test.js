let ActionStatus = require('../src/ActionStatus').default;

it('is defined', () => {
  expect(ActionStatus).toBeDefined();
});

it('implements has', () => {
  expect(ActionStatus.has(ActionStatus.BUSY)).toBeTruthy();
  expect(ActionStatus.has(ActionStatus.FAILURE)).toBeTruthy();
  expect(ActionStatus.has(ActionStatus.SUCCESS)).toBeTruthy();
  expect(ActionStatus.has(Symbol(ActionStatus.SUCCESS.toString()))).toBeFalsy();
  expect(ActionStatus.has(undefined)).toBeFalsy();
  expect(ActionStatus.has('randomstring')).toBeFalsy();
});

describe('serializes / deserializes', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('without Symbol.prototype.description defined', () => {
    expect(ActionStatus.fromString(ActionStatus.toString(ActionStatus.SUCCESS)))
      .toEqual(ActionStatus.SUCCESS);
  });

  it('with Symbol.prototype.description defined', () => {
    Object.defineProperty(Symbol.prototype, 'description', {
      get: function() { return this.toString().slice(7, -1) }
    });
    ActionStatus = require('../src/ActionStatus').default;

    expect(ActionStatus.fromString(ActionStatus.toString(ActionStatus.SUCCESS)))
      .toEqual(ActionStatus.SUCCESS);
  });
});
