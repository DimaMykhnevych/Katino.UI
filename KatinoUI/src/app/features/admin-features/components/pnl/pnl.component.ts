import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { PnlReport } from 'src/app/core/models/pnl/pnl-report';
import { PnlRow } from 'src/app/core/models/pnl/pnl-row';
import { PnlRowKind } from 'src/app/core/enums/pnl-row-kind';
import { FinanceReportService } from '../../services/finance-report.service';

@Component({
  selector: 'app-pnl',
  templateUrl: './pnl.component.html',
  styleUrls: ['./pnl.component.scss'],
})
export class PnlComponent implements OnInit, OnDestroy {
  public isLoading = false;

  public selectedYear!: number;
  public yearOptions: number[] = [];

  public report?: PnlReport;

  public dataSource = new MatTableDataSource<PnlRow>([]);
  public displayedColumns: string[] = [];

  public readonly monthKeys = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ];

  public readonly PnlRowKind = PnlRowKind;

  private _destroy$ = new Subject<void>();

  constructor(private _pnlService: FinanceReportService) {}

  public ngOnInit(): void {
    this.buildYearOptions();
    this.selectedYear = this.yearOptions[this.yearOptions.length - 1];
    this.loadReport(this.selectedYear);
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onYearChanged(year: number): void {
    this.selectedYear = year;
    this.loadReport(year);
  }

  public getRowTitle(row: PnlRow): string {
    if (row.kind === PnlRowKind.expenseCategory) return row.title;

    switch (row.kind) {
      case PnlRowKind.revenueTotal:
        return 'pnl.rows.revenueTotal';
      case PnlRowKind.revenueRetail:
        return 'pnl.rows.revenueRetail';
      case PnlRowKind.revenueDropWholesale:
        return 'pnl.rows.revenueDropWholesale';
      case PnlRowKind.expensesTotal:
        return 'pnl.rows.expensesTotal';
      case PnlRowKind.margin:
        return 'pnl.rows.margin';
      case PnlRowKind.marginPercent:
        return 'pnl.rows.marginPercent';
      default:
        return row.title;
    }
  }

  public getRowClass(row: PnlRow): Record<string, boolean> {
    return {
      'row-revenue':
        row.kind === PnlRowKind.revenueTotal ||
        row.kind === PnlRowKind.revenueRetail ||
        row.kind === PnlRowKind.revenueDropWholesale,

      'row-expenses':
        row.kind === PnlRowKind.expensesTotal ||
        row.kind === PnlRowKind.expenseCategory,

      'row-margin':
        row.kind === PnlRowKind.margin || row.kind === PnlRowKind.marginPercent,

      'row-section-start-expenses': row.kind === PnlRowKind.expensesTotal,
      'row-section-start-margin': row.kind === PnlRowKind.margin,
    };
  }

  public getCellClass(row: PnlRow, value: number): string {
    if (
      (row.kind === PnlRowKind.margin ||
        row.kind === PnlRowKind.marginPercent) &&
      value < 0
    ) {
      return 'neg';
    }
    return '';
  }

  public formatPercent(v?: number): string {
    if (v === null || v === undefined) return '—';
    return `${v.toFixed(2)}%`;
  }

  private buildYearOptions(): void {
    const MIN_YEAR = 2026;
    const now = new Date();
    const currentYear = now.getFullYear();
    const maxYear = Math.max(currentYear, MIN_YEAR);

    this.yearOptions = [];
    for (let y = MIN_YEAR; y <= maxYear; y++) this.yearOptions.push(y);
  }

  private buildColumns(): void {
    this.displayedColumns = [
      'title',
      ...this.monthKeys.map((m) => `m_${m}`),
      'total',
      'share',
    ];
  }

  private loadReport(year: number): void {
    this.isLoading = true;
    this.buildColumns();

    this._pnlService
      .getPnlReport(year)
      .pipe(
        takeUntil(this._destroy$),
        catchError(() => of(undefined)),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe((rep) => {
        this.report = rep;
        this.dataSource.data = rep?.rows ?? [];
      });
  }
}
