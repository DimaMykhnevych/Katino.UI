import { TtnState } from '../../../enums/ttn-state';

export interface OrderUpdateResult {
  orderUpdatedSuccessfully: boolean;
  npInternetDocUpdatedSuccessfully: boolean;
  ttnState: TtnState;
}
