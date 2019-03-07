const ActionStatus = {
  __THUNKLESS_ACTION_STATUS_BUSY__: Symbol('__THUNKLESS_ACTION_STATUS_BUSY__'),
  __THUNKLESS_ACTION_STATUS_SUCCESS__: Symbol('__THUNKLESS_ACTION_STATUS_SUCCESS__'),
  __THUNKLESS_ACTION_STATUS_FAILURE__: Symbol('__THUNKLESS_ACTION_STATUS_FAILURE__'),
};
const values = new Set(Object.values(ActionStatus));

const getDescription = Object.getOwnPropertyDescriptor(Symbol.prototype, 'description')
  ? symbol => symbol.description
  : symbol => symbol.toString().slice(7, -1);

export default {
  BUSY: ActionStatus.__THUNKLESS_ACTION_STATUS_BUSY__,
  SUCCESS: ActionStatus.__THUNKLESS_ACTION_STATUS_SUCCESS__,
  FAILURE: ActionStatus.__THUNKLESS_ACTION_STATUS_FAILURE__,

  toString: getDescription,
  fromString: value => ActionStatus[value],
  has: Set.prototype.has.bind(values),
}
