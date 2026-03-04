import { PnlRow } from './pnl-row';

export interface PnlReport {
  year: number;
  rows: PnlRow[];
}
