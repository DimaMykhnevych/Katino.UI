import { SewingStatisticsItem } from './sewing-statistics-item';

export interface GetSewingStatisticsResponse {
  items: SewingStatisticsItem[];
  resultsAmount: number;
}
