import { CheckboxReceiptKind } from '../../../enums/checkbox-receipt-kind';
import { CheckboxReceiptStatus } from '../../../enums/checkbox-receipt-status';

export interface OrderReceipt {
  id: string;
  kind: CheckboxReceiptKind;
  status: CheckboxReceiptStatus;
  amount: number;
  fiscalCode: string | null;
  ettnNumber: string | null;
  lastError: string | null;
  hasPdf: boolean;
  // Checkbox receipts to fetch the PDF by (receiptId of the PDF endpoint): one for most rows,
  // several for a prepayment chain return, empty when there is no PDF
  pdfReceiptIds: string[];
  createdAt: Date;
  completedAt: Date | null;
}
