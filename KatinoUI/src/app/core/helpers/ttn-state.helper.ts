import { TtnState } from '../enums/ttn-state';
import { Order } from '../models/order/order';

export class TtnStateHelper {
  public static getState(o: Order): TtnState {
    if (o.ttnState !== null && o.ttnState !== undefined) return o.ttnState;
    return o.internetDocumentIntDocNumber
      ? TtnState.created
      : TtnState.notRequired;
  }

  public static getBadgeTextKey(state: TtnState): string | null {
    switch (state) {
      case TtnState.pending:
      case TtnState.inProgress:
      case TtnState.unknown:
        return 'orders.ttn.creating';
      case TtnState.needsUpdate:
        return 'orders.ttn.updating';
      case TtnState.awaitingPayment:
        return 'orders.ttn.awaitingPayment';
      case TtnState.failed:
        return 'orders.ttn.failed';
      default:
        return null;
    }
  }

  public static getBadgeClass(state: TtnState): string {
    return state === TtnState.failed ? 'badge--fail' : 'badge--neutral';
  }

  public static isInProgress(state: TtnState): boolean {
    return [
      TtnState.pending,
      TtnState.inProgress,
      TtnState.needsUpdate,
      TtnState.unknown,
    ].includes(state);
  }
}
