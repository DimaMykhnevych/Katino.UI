import { HttpErrorResponse } from '@angular/common/http';
import { ReceiptState } from '../enums/receipt-state';

// Only maps backend state to UI: which label and which action button. The backend decides everything else.
export class ReceiptStateHelper {
  // null and NotRequired: the order has no receipts to show
  public static hasReceipt(state: ReceiptState | null | undefined): boolean {
    return (
      state !== null &&
      state !== undefined &&
      state !== ReceiptState.notRequired
    );
  }

  public static getLabelKey(state: ReceiptState): string {
    return `orders.receipt.state.${ReceiptState[state]}`;
  }

  public static getBadgeClass(state: ReceiptState): string {
    switch (state) {
      case ReceiptState.done:
        return 'badge--success';
      case ReceiptState.failed:
        return 'badge--fail';
      case ReceiptState.awaitingReturn:
        return 'badge--purple';
      case ReceiptState.pending:
      case ReceiptState.inProgress:
        return 'badge--progress';
      default:
        return 'badge--neutral';
    }
  }

  public static canRetry(state: ReceiptState | null | undefined): boolean {
    return (
      state === ReceiptState.waitingForTtn ||
      state === ReceiptState.unknown ||
      state === ReceiptState.failed
    );
  }

  public static isAwaitingReturn(
    state: ReceiptState | null | undefined,
  ): boolean {
    return state === ReceiptState.awaitingReturn;
  }

  // Translation key for a failed receipt PDF request
  public static getPdfErrorKey(code: string | null): string {
    const known = [
      'receiptNotFound',
      'receiptPdfNotAvailable',
      'checkboxUnavailable',
    ];
    return code && known.includes(code)
      ? `orders.receipt.errors.${code}`
      : 'orders.receipt.errors.pdfFailed';
  }

  // The backend puts its error code in `error`. A blob request (PDF) gets the JSON error body as a Blob.
  public static async getErrorCode(
    err: HttpErrorResponse,
  ): Promise<string | null> {
    const body = err?.error;
    if (body instanceof Blob) {
      try {
        return JSON.parse(await body.text())?.error ?? null;
      } catch {
        return null;
      }
    }
    return body?.error ?? null;
  }
}
