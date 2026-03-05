import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { PnlReport } from 'src/app/core/models/pnl/pnl-report';
import { PnlRow } from 'src/app/core/models/pnl/pnl-row';
import { PnlRowKind } from 'src/app/core/enums/pnl-row-kind';
import { FinanceReportService } from '../../services/finance-report.service';
import { FinanceCategory } from 'src/app/core/models/financeCategory/finance-category';
import { FormControl, Validators } from '@angular/forms';
import { FinanceCategoryService } from '../../services/finance-category.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { MatTabChangeEvent } from '@angular/material/tabs';

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

  public expenseCategories: FinanceCategory[] = [];
  public isCategoriesLoading = false;
  public isCategorySaving = false;

  public newCategoryName = new FormControl('', [
    Validators.required,
    Validators.minLength(2),
  ]);

  private readonly REPORT_TAB_INDEX = 0;
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

  constructor(
    private _pnlService: FinanceReportService,
    private _financeCategoryService: FinanceCategoryService,
    private _toastr: ToastrService,
    private _translate: TranslateService,
  ) {}

  public ngOnInit(): void {
    this.buildYearOptions();
    this.selectedYear = this.yearOptions[this.yearOptions.length - 1];
    this.loadReport(this.selectedYear);
    this.loadExpenseCategories();
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

  public isSecondaryCategory(row: PnlRow): boolean {
    return (
      row.kind === PnlRowKind.expenseCategory ||
      row.kind === PnlRowKind.revenueRetail ||
      row.kind === PnlRowKind.revenueDropWholesale
    );
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

  public addExpenseCategory(): void {
    if (this.newCategoryName.invalid) {
      this.newCategoryName.markAsTouched();
      return;
    }

    const name = (this.newCategoryName.value ?? '').trim();
    if (!name) return;

    this.isCategorySaving = true;

    this._financeCategoryService
      .addExpenseCategory(name)
      .pipe(
        catchError(() => of(undefined)),
        finalize(() => (this.isCategorySaving = false)),
      )
      .subscribe((created) => {
        if (!created) {
          this._toastr.error(this._t('pnl.categories.toastr.createFailed'));
          return;
        }

        this.expenseCategories = [...this.expenseCategories, created].sort(
          (a, b) => (a.name ?? '').localeCompare(b.name ?? ''),
        );

        this.newCategoryName.setValue('');
        this.newCategoryName.markAsPristine();
        this.newCategoryName.markAsUntouched();
        this._toastr.success(this._t('pnl.categories.toastr.created'));
        this.loadReport(this.selectedYear);
      });
  }

  public hideExpenseCategory(cat: FinanceCategory): void {
    this._financeCategoryService
      .hideExpenseCategory(cat.id)
      .pipe(catchError(() => of(false)))
      .subscribe((ok) => {
        if (!ok) {
          this._toastr.error(this._t('pnl.categories.toastr.hideFailed'));
          return;
        }

        this.expenseCategories = this.expenseCategories.filter(
          (x) => x.id !== cat.id,
        );
        this._toastr.success(this._t('pnl.categories.toastr.hidden'));
        this.loadReport(this.selectedYear);
      });
  }

  public onTabChanged(e: MatTabChangeEvent): void {
    if (e.index === this.REPORT_TAB_INDEX) {
      this.loadReport(this.selectedYear);
    }
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

  private loadExpenseCategories(): void {
    this.isCategoriesLoading = true;
    this._financeCategoryService
      .getExpenseCategories()
      .pipe(
        catchError(() => of([] as FinanceCategory[])),
        finalize(() => (this.isCategoriesLoading = false)),
      )
      .subscribe((cats) => {
        this.expenseCategories = cats;
      });
  }

  private _t(key: string): string {
    return this._translate.instant(key);
  }
}
