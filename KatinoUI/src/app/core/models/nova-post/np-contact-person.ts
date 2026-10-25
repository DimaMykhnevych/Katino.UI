export interface NpContactPerson {
  id: string;
  ref: string;
  counterpartyRef: string;
  lastName: string;
  firstName: string;
  middleName: string;
  phones: string;
  // NP API key the sender contact person was loaded under (sender contact persons only)
  npApiKeyId?: string;
}
