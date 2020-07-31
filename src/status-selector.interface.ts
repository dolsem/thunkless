import { ActionStatus } from './action-status.enum';

export interface StatusSelector {
  (state: any): ActionStatus|boolean|null|undefined;
}
