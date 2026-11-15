// Secrets (license key, cashier password) are never returned
export interface CheckboxAccount {
  id: string;
  npApiKeyId: string;
  npApiKeyOwnerFullName: string;
  licenseKeyLast4: string;
  cashierLogin: string;
  taxCode: number;
  isActive: boolean;
}
