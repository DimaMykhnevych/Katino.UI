import { SewingQueueItem } from './sewing-queue-item';

export interface GroupedSewingQueueItem {
  sendUntilDate: Date;
  items: SewingQueueItem[];
}
