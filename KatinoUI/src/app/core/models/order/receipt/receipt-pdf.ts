export interface ReceiptPdf {
  blob: Blob;
  // https://check.checkbox.ua/{checkbox receipt id}; null if the header is missing
  receiptUrl: string | null;
}
