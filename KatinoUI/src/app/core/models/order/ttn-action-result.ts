import { TtnState } from '../../enums/ttn-state';

export interface TtnActionResult {
  success: boolean;
  ttnState: TtnState | null;
  error: string | null;
}
