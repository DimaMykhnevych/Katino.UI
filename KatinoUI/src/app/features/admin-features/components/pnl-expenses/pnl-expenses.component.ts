import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { FinanceExpense } from 'src/app/core/models/finance-entry/finance-expense';
import { FinanceCategory } from 'src/app/core/models/financeCategory/finance-category';
import { FinanceExpenseService } from '../../services/finance-expense.service';
import { UpdateManualExpenseCommand } from 'src/app/core/models/finance-entry/update-manual-expense';
import { CreateManualExpense } from 'src/app/core/models/finance-entry/create-manual-expense';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-pnl-expenses',
  templateUrl: './pnl-expenses.component.html',
  styleUrls: ['./pnl-expenses.component.scss'],
})
export class PnlExpensesComponent implements OnInit, OnDestroy {
  @Input() year!: number;
  @Input() expenseCategories: FinanceCategory[] = [];

  public isLoading = false;

  public dataSource = new MatTableDataSource<FinanceExpense>([]);
  public displayedColumns: string[] = [
    'date',
    'category',
    'amount',
    'comment',
    'actions',
  ];

  public addForm: FormGroup = this._fb.group({
    entryDate: new FormControl(null, [Validators.required]),
    categoryId: new FormControl(null, [Validators.required]),
    amount: new FormControl(null, [Validators.required, Validators.min(0.01)]),
    comment: new FormControl(''),
  });

  public savingIds = new Set<string>();
  public deletingIds = new Set<string>();

  public editAmount: Record<string, number> = {};
  public editComment: Record<string, string> = {};
  public isRowEditing: Record<string, boolean> = {};

  private _destroy$ = new Subject<void>();

  constructor(
    private _fb: FormBuilder,
    private _expenseService: FinanceExpenseService,
    private _toastr: ToastrService,
    private _translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onYearChangedExternally(): void {
    this.loadExpenses();
  }

  public loadExpenses(): void {
    if (!this.year) return;

    this.isLoading = true;
    this._expenseService
      .getFinanceExpenses(this.year)
      .pipe(
        catchError(() => of([] as FinanceExpense[])),
        finalize(() => (this.isLoading = false)),
        takeUntil(this._destroy$),
      )
      .subscribe((rows) => {
        this.dataSource.data = rows ?? [];
        this.hydrateEditBuffers();
      });
  }

  private hydrateEditBuffers(): void {
    this.editAmount = {};
    this.editComment = {};
    this.isRowEditing = {};

    for (const r of this.dataSource.data) {
      this.editAmount[r.id] = r.amount;
      this.editComment[r.id] = r.comment ?? '';
      this.isRowEditing[r.id] = false;
    }
  }

  public startEdit(row: FinanceExpense): void {
    if (row.isLocked) return;

    this.isRowEditing[row.id] = true;
    this.editAmount[row.id] = row.amount;
    this.editComment[row.id] = row.comment ?? '';
  }

  public cancelEdit(row: FinanceExpense): void {
    this.isRowEditing[row.id] = false;
    this.editAmount[row.id] = row.amount;
    this.editComment[row.id] = row.comment ?? '';
  }

  public saveEdit(row: FinanceExpense): void {
    if (row.isLocked) return;

    const amount = Number(this.editAmount[row.id]);
    const comment = (this.editComment[row.id] ?? '').trim();

    if (!amount || amount <= 0) {
      this._toastr.error(this._t('pnl.expenses.toastr.amountInvalid'));
      return;
    }

    this.savingIds.add(row.id);

    const cmd: UpdateManualExpenseCommand = {
      id: row.id,
      amount,
      comment,
    };

    this._expenseService
      .updateFinanceExpense(cmd)
      .pipe(
        catchError(() => of(false)),
        finalize(() => this.savingIds.delete(row.id)),
        takeUntil(this._destroy$),
      )
      .subscribe((ok) => {
        if (!ok) {
          this._toastr.error(this._t('pnl.expenses.toastr.updateFailed'));
          return;
        }

        row.amount = amount;
        row.comment = comment;
        this.isRowEditing[row.id] = false;

        this._toastr.success(this._t('pnl.expenses.toastr.updated'));
      });
  }

  public deleteRow(row: FinanceExpense): void {
    if (row.isLocked) return;

    this.deletingIds.add(row.id);

    this._expenseService
      .deleteFinanceExpense(row.id)
      .pipe(
        catchError(() => of(false)),
        finalize(() => this.deletingIds.delete(row.id)),
        takeUntil(this._destroy$),
      )
      .subscribe((ok) => {
        if (!ok) {
          this._toastr.error(this._t('pnl.expenses.toastr.deleteFailed'));
          return;
        }

        this.dataSource.data = this.dataSource.data.filter(
          (x) => x.id !== row.id,
        );
        this._toastr.success(this._t('pnl.expenses.toastr.deleted'));
      });
  }

  public addExpense(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }

    const v = this.addForm.value;

    const cmd: CreateManualExpense = {
      entryDate: this.asLocalNoon(v.entryDate),
      categoryId: v.categoryId,
      amount: Number(v.amount),
      comment: (v.comment ?? '').trim(),
    };

    this.isLoading = true;

    this._expenseService
      .addFinanceExpense(cmd)
      .pipe(
        catchError(() => of(false)),
        finalize(() => (this.isLoading = false)),
        takeUntil(this._destroy$),
      )
      .subscribe((ok) => {
        if (!ok) {
          this._toastr.error(this._t('pnl.expenses.toastr.createFailed'));
          return;
        }

        this._toastr.success(this._t('pnl.expenses.toastr.created'));

        this.addForm.reset();
        this.loadExpenses();
      });
  }

  public isSaving(rowId: string): boolean {
    return this.savingIds.has(rowId);
  }

  public isDeleting(rowId: string): boolean {
    return this.deletingIds.has(rowId);
  }

  private _t(key: string): string {
    return this._translate.instant(key);
  }

  private asLocalNoon(d: Date): Date {
    const x = new Date(d);
    x.setHours(12, 0, 0, 0);
    return x;
  }

  get entryDate() {
    return this.addForm.get('entryDate');
  }
  get categoryId() {
    return this.addForm.get('categoryId');
  }
  get amount() {
    return this.addForm.get('amount');
  }
}
