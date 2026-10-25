import { TtnState } from '../../../enums/ttn-state';

export interface OrderCreationResult {
  orderAddedSuccessfully: boolean;
  npInternetDocCreatedSuccessfully: boolean;
  ttnState: TtnState;
  error?: string;
}
