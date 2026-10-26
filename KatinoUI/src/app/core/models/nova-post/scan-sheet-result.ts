export interface ScanSheetGroupResult {
  npApiKeyId: string | null;
  ordersCount: number;
  success: boolean;
  // Set when the scan sheet was created, used to download its PDF
  scanSheetRef: string | null;
  scanSheetNumber: string | null;
  // NP creates no scan sheet when all the documents are already in one
  noNewDocuments: boolean;
  error: string | null;
}

export interface ScanSheetResult {
  success: boolean;
  groups: ScanSheetGroupResult[];
}
