import { ReceiptState } from '../../../enums/receipt-state';

export interface ReceiptActionResult {
  success: boolean;
  receiptState: ReceiptState | null;
  error: string | null;
}
