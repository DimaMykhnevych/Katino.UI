export interface ScanSheetGroupResult {
  npApiKeyId: string | null;
  ordersCount: number;
  success: boolean;
  error: string | null;
}

export interface ScanSheetResult {
  success: boolean;
  groups: ScanSheetGroupResult[];
}
