export enum ActionStatus {
  BUSY = 'busy',
  SUCCESS = 'success',
  FAILURE = 'failure',
}

const values = Object.values(ActionStatus) as string[];

/* istanbul ignore next */
export namespace ActionStatus {
  export function has(value: string) {
    return values.includes(value);
  }
}
