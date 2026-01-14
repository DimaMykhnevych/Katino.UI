import { SyncStatus } from '../../enums/sync-status';
import { SyncType } from '../../enums/sync-type';

export interface SyncRecord {
  id: string;
  syncType: SyncType;
  status: SyncStatus;
  startedAt?: Date;
  completedAt?: Date;
  apiRequestedRecords?: number;
  dbInsertedRecords?: number;
  errorMessage: string;
  triggeredBy: string;
  triggeredByUsername: string;
}
