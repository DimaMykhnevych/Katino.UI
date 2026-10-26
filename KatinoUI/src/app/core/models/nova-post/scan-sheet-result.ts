export interface ScanSheetGroupResult {
  npApiKeyId: string | null;
  ordersCount: number;
  success: boolean;
  // Set when the scan sheet was created, used to download its PDF
  scanSheetRef: string | null;
  scanSheetNumber: string | null;
  error: string | null;
}

export interface ScanSheetResult {
  success: boolean;
  groups: ScanSheetGroupResult[];
}
