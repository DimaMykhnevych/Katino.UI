import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

import { GetSewingQueueItems } from 'src/app/core/models/sewing-queue/get-sewing-queue-items';
import { SewingQueueItem } from 'src/app/core/models/sewing-queue/sewing-queue-item';
import { SubmitSewedReport } from 'src/app/core/models/sewing-queue/submit-sewed-report';
import { OrderItemService } from '../../services/order-item.service';
import { TranslateService } from '@ngx-translate/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { GroupedSewingQueueItem } from 'src/app/core/models/sewing-queue/grouped-sewing-queue-item';

@Component({
  selector: 'app-sewing-queue',
  templateUrl: './sewing-queue.component.html',
  styleUrls: ['./sewing-queue.component.scss'],
})
export class SewingQueueComponent implements OnInit, OnDestroy {
  private readonly DESKTOP_COLUMNS: string[] = [
    'product',
    'toProduce',
    'custom',
    'actual',
    'actions',
  ];
  private readonly MOBILE_COLUMNS: string[] = ['info', 'actual', 'actions'];

  public isLoading = false;
  public isMobile = false;
  public resultsAmount = 0;

  public dataSource = new MatTableDataSource<SewingQueueItem>([]);
  public displayedColumns: string[] = this.DESKTOP_COLUMNS;

  public actualForms = new Map<string, FormGroup>();

  public submitting = new Set<string>();

  public grouped: GroupedSewingQueueItem[] = [];
  public isGroupedLoading = false;

  private _destroy$ = new Subject<void>();

  constructor(
    private _service: OrderItemService,
    private _fb: FormBuilder,
    private _toastr: ToastrService,
    private _translate: TranslateService,
    private _bp: BreakpointObserver,
  ) {}

  public ngOnInit(): void {
    this._bp
      .observe([Breakpoints.Handset])
      .pipe(takeUntil(this._destroy$))
      .subscribe((r) => {
        this.isMobile = r.matches;
        this.displayedColumns = this.isMobile
          ? this.MOBILE_COLUMNS
          : this.DESKTOP_COLUMNS;
      });

    this.loadQueue();
    this.loadGrouped();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public loadQueue(): void {
    this.isLoading = true;

    this._service
      .getSewingQueue()
      .pipe(
        catchError((err) => this.onCatchError(err)),
        finalize(() => (this.isLoading = false)),
        takeUntil(this._destroy$),
      )
      .subscribe((resp: GetSewingQueueItems) => {
        const items = resp?.sewingQueueItems ?? [];
        this.resultsAmount = resp?.resultsAmount ?? items.length;
        this.dataSource.data = items;
        this.rebuildActualForms(items);
      });
  }

  public getRowKey(row: SewingQueueItem): string {
    return row.isCustomTailoring
      ? `custom:${row.orderItemId}`
      : `pv:${row.productVariantId}`;
  }

  public getActualControl(row: SewingQueueItem): FormControl {
    const key = this.getRowKey(row);
    const form = this.actualForms.get(key);
    return form?.get('actual') as FormControl;
  }

  public canSubmit(row: SewingQueueItem): boolean {
    const ctrl = this.getActualControl(row);
    if (!ctrl) return false;
    return (
      ctrl.valid &&
      Number(ctrl.value) > 0 &&
      !this.submitting.has(this.getRowKey(row))
    );
  }

  public submitRow(row: SewingQueueItem): void {
    const key = this.getRowKey(row);
    const ctrl = this.getActualControl(row);

    if (!ctrl) return;
    ctrl.markAsTouched();

    if (ctrl.invalid) return;

    const actual = Number(ctrl.value ?? 0);
    if (actual <= 0) return;

    if (row.isCustomTailoring && actual > row.quantityToProduce) {
      this._toastr.error(this._t('sewingQueue.toastr.tooMuchCustom'));
      return;
    }

    const req: SubmitSewedReport = {
      productVariantId: row.productVariantId,
      actualSewedQuantity: actual,
      orderItemId: row.isCustomTailoring ? row.orderItemId : undefined,
    };

    this.submitting.add(key);

    this._service
      .submitSewingReport(req)
      .pipe(
        catchError((err) => this.onSubmitError(err)),
        finalize(() => this.submitting.delete(key)),
        takeUntil(this._destroy$),
      )
      .subscribe((ok: boolean) => {
        if (!ok) {
          this._toastr.error(this._t('sewingQueue.toastr.submitFailed'));
          return;
        }

        this._toastr.success(this._t('sewingQueue.toastr.submitted'));
        this.loadQueue();
        this.loadGrouped();
      });
  }

  public productTitle(row: SewingQueueItem): string {
    const pv = row.productVariant;
    const name = pv?.product?.name ?? '';
    const color = pv?.color?.name ?? '';
    const size = pv?.size?.name ?? '';
    const parts = [name, color, size].filter(Boolean);
    return parts.length ? parts.join(' • ') : row.productVariantId;
  }

  public groupCardClass(g: GroupedSewingQueueItem): string {
    const d =
      g.sendUntilDate instanceof Date
        ? g.sendUntilDate
        : new Date(g.sendUntilDate as any);

    const k = this.dayKey(d);
    const today = this.dayKey(new Date());

    if (k < today) return 'card-overdue';
    if (k === today) return 'card-today';

    const threeDaysAhead = today + 3 * 24 * 60 * 60 * 1000;
    if (k <= threeDaysAhead) return 'card-soon';

    return 'card-future';
  }

  public loadGrouped(): void {
    this.isGroupedLoading = true;

    this._service
      .getSewingQueueGrouped()
      .pipe(
        catchError(() => of([] as GroupedSewingQueueItem[])),
        finalize(() => (this.isGroupedLoading = false)),
        takeUntil(this._destroy$),
      )
      .subscribe((groups) => {
        this.grouped = (groups ?? []).map((g) => ({
          ...g,
          sendUntilDate:
            g.sendUntilDate instanceof Date
              ? g.sendUntilDate
              : new Date(g.sendUntilDate as any),
          items: g.items ?? [],
        }));
      });
  }

  private dayKey(d: Date): number {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return x.getTime();
  }

  private rebuildActualForms(items: SewingQueueItem[]): void {
    this.actualForms.clear();

    for (const it of items) {
      const key = this.getRowKey(it);

      const maxValidators = it.isCustomTailoring
        ? [Validators.max(it.quantityToProduce)]
        : [];

      this.actualForms.set(
        key,
        this._fb.group({
          actual: new FormControl(null, [
            Validators.required,
            Validators.min(1),
            ...maxValidators,
          ]),
        }),
      );
    }
  }

  private onCatchError(error: any): Observable<GetSewingQueueItems> {
    this._toastr.error(this._t('common.somethingWentWrong'));
    return of({ sewingQueueItems: [], resultsAmount: 0 });
  }

  private onSubmitError(error: any): Observable<boolean> {
    this._toastr.error(this._t('sewingQueue.toastr.submitFailed'));
    return of(false);
  }

  private _t(key: string): string {
    return this._translate.instant(key);
  }
}
