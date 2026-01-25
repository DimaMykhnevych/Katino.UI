import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { Observable, Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  takeUntil,
  auditTime,
} from 'rxjs/operators';

import { GetOrderRequest } from 'src/app/core/models/order/get-order-request';
import { GetOrderResponse } from 'src/app/core/models/order/get-order-response';
import { Order } from 'src/app/core/models/order/order';
import { OrderService } from 'src/app/features/common-services/order.service';
import { OrderStatus } from 'src/app/core/enums/order-status';
import { CustomTranslateService } from 'src/app/core/services/custom-translate.service';
import { StyleClassHelper } from 'src/app/layout/helpers/style-class-helper';
import { DialogService } from 'src/app/features/common-services/dialog.service';
import { OrderItem } from 'src/app/core/models/order/order-item';
import { OrderConstants } from 'src/app/core/constants/order-constants';
import { ToastrService } from 'ngx-toastr';
import { SetManualOrderStatus } from 'src/app/core/models/order/set-manual-order-status';
import { TranslateService } from '@ngx-translate/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { DefaultOptions } from 'src/app/core/constants/default-options';
import { MatOptionSelectionChange } from '@angular/material/core';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  @ViewChild(MatMenuTrigger) private _statusMenuTrigger?: MatMenuTrigger;
  public readonly ALL_STATUSES_VALUE = DefaultOptions.allSelectionOptionId;
  public translatedAllOption$?: Observable<string>;

  public form: FormGroup = this._builder.group({});
  public isRetrievingData = false;

  public statusLoading = new Set<string>();
  public statusSaving = new Set<string>();
  public currentMenuOrder?: Order;
  public currentManualOptions: OrderStatus[] = [];

  public ordersResponse?: GetOrderResponse;

  public dataSource = new MatTableDataSource<Order>([]);
  public displayedColumns: string[] = [
    'sendUntil',
    'ttn',
    'items',
    'delivery',
    'status',
    'cost',
  ];

  public pageIndex = 0;
  public pageSize = 20;
  public pageSizeOptions = [10, 20, 50, 100];

  public allOrderStatuses: OrderStatus[] = Object.values(OrderStatus).filter(
    (v) => typeof v === 'number',
  ) as OrderStatus[];

  public selectedStatuses: (OrderStatus | string)[] = [this.ALL_STATUSES_VALUE];

  private _destroy$ = new Subject<void>();

  constructor(
    private _builder: FormBuilder,
    private _orderService: OrderService,
    private _dialogService: DialogService,
    private _customTranslate: CustomTranslateService,
    private _toastr: ToastrService,
    private _translate: TranslateService,
  ) {}

  public ngOnInit(): void {
    this.initializeForm();
    this.translatedAllOption$ = this._translate.stream(
      'orders.filters.allStatuses',
    );
    this.subscribeOnFormValueChanges();

    this.fetchOrders();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onPageChanged(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.fetchOrders();
  }

  public openDetails(order: Order): void {
    this._dialogService.openOrderDetailsDialog(order);
  }

  public getOrderStatusTextKey(s: OrderStatus): string {
    return this._customTranslate.getOrderStatusTextKey(s);
  }

  public getOrderStatusBadgeClass(s: OrderStatus): string {
    return StyleClassHelper.getOrderStatusBadgeClass(s);
  }

  public getItemsPreview(o: Order) {
    const items = (o.orderItems ?? []).filter(Boolean);
    const preview = items.slice(0, 2);
    const rest = Math.max(0, items.length - preview.length);
    return { preview, rest, total: items.length };
  }

  public getItemTitle(it: OrderItem): string {
    const productName = it?.productVariant?.product?.name || '';
    const color = it?.productVariant?.color?.name || '';
    const size = it?.productVariant?.size?.name || '';
    const parts = [productName, color, size].filter(Boolean);
    return parts.length ? parts.join(' • ') : '—';
  }

  public getItemQtyText(it: any): string {
    const toProduce = it?.quantityToProduce ?? 0;
    const qty = it?.quantity ?? 0;

    if (toProduce > 0) return `${toProduce}`;
    return `${qty}`;
  }

  public getCustomCommentShort(comment?: string): string {
    if (!comment) return '';
    const trimmed = comment.trim();
    if (trimmed.length <= 40) return trimmed;
    return trimmed.slice(0, 40) + '…';
  }

  public getDeadlineClass(o: Order): string {
    if (!o?.sendUntilDate || !o?.creationDateTime) return '';
    const statusesToHighlight = [
      OrderStatus.inProgress,
      OrderStatus.readyToShip,
      OrderStatus.packed,
    ];
    if (!statusesToHighlight.includes(o.orderStatus)) {
      return '';
    }

    const now = new Date();
    const created = new Date(o.creationDateTime);
    const sendUntil = new Date(o.sendUntilDate);

    const createdDaysAgo = this.diffDays(created, now);
    if (
      createdDaysAgo > OrderConstants.DEADLINE_HIGHLIGHT_FOR_NEW_ORDERS_DAYS
    ) {
      return '';
    }

    const untilDaysFromNow = this.diffDays(now, sendUntil);
    if (untilDaysFromNow < 0) return 'deadline--overdue';

    if (untilDaysFromNow <= OrderConstants.DEADLINE_SOON_DAYS)
      return 'deadline--soon';

    return '';
  }

  public shouldShowTtnWarning(o: Order): boolean {
    if (!o?.internetDocumentCreationAttempted) return false;
    const ttn = (o?.internetDocumentIntDocNumber || '').trim();
    return ttn.length === 0;
  }

  public onStatusBadgeClick(o: Order, event: MouseEvent): void {
    event.stopPropagation();

    if (this.statusSaving.has(o.id)) return;

    this.currentMenuOrder = o;
    this.currentManualOptions = [];

    this.statusLoading.add(o.id);

    this._orderService
      .getNextManualStatus(o.orderStatus)
      .pipe(
        catchError(() => of([] as OrderStatus[])),
        finalize(() => this.statusLoading.delete(o.id)),
        takeUntil(this._destroy$),
      )
      .subscribe((opts) => {
        this.currentManualOptions = opts ?? [];
      });
  }

  public hasManualOptionsForCurrent(): boolean {
    return (this.currentManualOptions?.length ?? 0) > 0;
  }

  public setManualStatus(
    o: Order,
    newStatus: OrderStatus,
    event: MouseEvent,
  ): void {
    event.stopPropagation();

    if (this.statusSaving.has(o.id)) return;

    const req: SetManualOrderStatus = {
      orderId: o.id,
      orderManualStatus: newStatus,
    };

    this.statusSaving.add(o.id);

    this._orderService
      .setManualStatus(req)
      .pipe(
        catchError(() => of(false)),
        finalize(() => this.statusSaving.delete(o.id)),
        takeUntil(this._destroy$),
      )
      .subscribe((ok) => {
        this._statusMenuTrigger?.closeMenu();

        if (!ok) {
          this._toastr.error(
            this._translate.instant('orders.toastr.statusUpdateFailed'),
          );
          return;
        }

        o.orderStatus = newStatus;
        this.dataSource.data = [...this.dataSource.data];

        this._toastr.success(
          this._translate.instant('orders.toastr.statusUpdated'),
          undefined,
          { timeOut: 500 },
        );
      });
  }

  public onAllStatusesToggled(e: MatOptionSelectionChange): void {
    if (!e.isUserInput) return;

    if (e.source.selected) {
      this.orderStatuses!.setValue([this.ALL_STATUSES_VALUE], {
        emitEvent: true,
      });
    } else {
      this.orderStatuses!.setValue([], { emitEvent: true });
    }
  }

  private fetchOrders(): void {
    const values = (this.orderStatuses!.value ?? []) as (
      | OrderStatus
      | string
    )[];
    this.fetchOrdersWithStatuses(values);
  }

  private fetchOrdersWithStatuses(values: (OrderStatus | string)[]): void {
    const isAll = values.includes(this.ALL_STATUSES_VALUE);

    const request: GetOrderRequest = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      search: (this.form.value.orderSearchString || '').trim(),
      orderStatuses: isAll ? [] : (values as OrderStatus[]),
    };

    this.getOrders(request);
  }

  private getOrders(request: GetOrderRequest): void {
    this.isRetrievingData = true;

    this._orderService
      .getOrders(request)
      .pipe(
        catchError((error) => this.onCatchError(error)),
        takeUntil(this._destroy$),
      )
      .subscribe((resp: GetOrderResponse) => {
        this.ordersResponse = resp;
        this.dataSource.data = resp?.orders ?? [];
        this.isRetrievingData = false;
      });
  }

  private diffDays(a: Date, b: Date): number {
    const aDate = new Date(
      a.getFullYear(),
      a.getMonth(),
      a.getDate(),
    ).getTime();
    const bDate = new Date(
      b.getFullYear(),
      b.getMonth(),
      b.getDate(),
    ).getTime();
    return Math.round((bDate - aDate) / (1000 * 60 * 60 * 24));
  }

  private applyAllStatusesRules(values: (OrderStatus | string)[]): void {
    const ctrl = this.form.get('orderStatuses')!;
    const hasAll = values.includes(this.ALL_STATUSES_VALUE);

    if (hasAll && values.length > 1) {
      const withoutAll = values.filter((v) => v !== this.ALL_STATUSES_VALUE);
      ctrl.setValue(withoutAll, { emitEvent: false });
      return;
    }

    const onlyStatuses = values as OrderStatus[];
    const unique = Array.from(new Set(onlyStatuses));

    if (!hasAll && unique.length === this.allOrderStatuses.length) {
      ctrl.setValue([this.ALL_STATUSES_VALUE], { emitEvent: false });
      return;
    }

    if (!hasAll && unique.length === 0) {
      ctrl.setValue([this.ALL_STATUSES_VALUE], { emitEvent: false });
      return;
    }
  }

  private onCatchError(error: any): Observable<any> {
    this.isRetrievingData = false;
    this.ordersResponse = { orders: [], resultsAmount: 0 };
    this.dataSource.data = [];
    return of({ orders: [], resultsAmount: 0 });
  }

  private initializeForm(): void {
    this.form = this._builder.group({
      orderSearchString: new FormControl(''),
      orderStatuses: new FormControl([this.ALL_STATUSES_VALUE]),
    });
  }

  private subscribeOnFormValueChanges(): void {
    this.orderSearchString!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this._destroy$),
    ).subscribe(() => {
      this.pageIndex = 0;
      this.fetchOrders();
    });

    this.orderStatuses!.valueChanges.pipe(
      auditTime(0),
      takeUntil(this._destroy$),
    ).subscribe(() => {
      const ctrl = this.orderStatuses!;
      const values = (ctrl.value ?? []) as (OrderStatus | string)[];

      this.applyAllStatusesRules(values);

      const finalValues = (ctrl.value ?? []) as (OrderStatus | string)[];

      this.pageIndex = 0;
      this.fetchOrdersWithStatuses(finalValues);
    });
  }

  get orderSearchString() {
    return this.form.get('orderSearchString');
  }

  get orderStatuses() {
    return this.form.get('orderStatuses');
  }
}
