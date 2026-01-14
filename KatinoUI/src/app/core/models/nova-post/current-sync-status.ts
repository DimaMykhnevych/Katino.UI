import { SyncStatus } from '../../enums/sync-status';

export interface CurrentSyncStatus {
  id: string;
  status: SyncStatus;
  isInProgress: boolean;
  canTriggerSync: boolean;
  startedAt?: Date;
  completedAt?: Date;
  apiRequestedRecords?: number;
  dbInsertedRecords?: number;
  durationSeconds?: number;
  errorMessage: string;
  triggeredBy: string;
  triggeredByUsername: string;
}
