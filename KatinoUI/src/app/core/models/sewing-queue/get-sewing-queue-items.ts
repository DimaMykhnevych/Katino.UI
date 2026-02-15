import { SewingQueueItem } from './sewing-queue-item';

export interface GetSewingQueueItems {
  sewingQueueItems: SewingQueueItem[];
  resultsAmount: number;
}
