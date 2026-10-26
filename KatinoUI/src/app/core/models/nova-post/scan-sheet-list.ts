export interface ScanSheetListItem {
  npApiKeyId: string;
  // Whose NP account the scan sheet belongs to, missing for a scan sheet that was just created
  ownerFullName?: string | null;
  scanSheetRef: string;
  scanSheetNumber: string | null;
  description?: string | null;
  // Kyiv local time, missing for a scan sheet that was just created
  createdAt?: string | null;
}

export interface ScanSheetList {
  scanSheets: ScanSheetListItem[];
  // True when NP did not return the list for at least one API key
  hasErrors: boolean;
}
