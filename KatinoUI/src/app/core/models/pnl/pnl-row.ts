import { PnlRowKind } from '../../enums/pnl-row-kind';

export interface PnlRow {
  key: string;
  title: string;
  kind: PnlRowKind;
  months: number[];
  total: number;
  sharePercent?: number;
}
