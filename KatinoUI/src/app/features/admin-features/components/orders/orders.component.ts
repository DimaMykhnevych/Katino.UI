import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { Observable, Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
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

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  public form: FormGroup = this._builder.group({});
  public isRetrievingData = false;

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

  private _destroy$ = new Subject<void>();

  constructor(
    private _builder: FormBuilder,
    private _orderService: OrderService,
    private _dialogService: DialogService,
    private _customTranslate: CustomTranslateService,
  ) {}

  public ngOnInit(): void {
    this.initializeForm();
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

  private fetchOrders(): void {
    const request: GetOrderRequest = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      search: (this.form.value.orderSearchString || '').trim(),
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

  private onCatchError(error: any): Observable<any> {
    this.isRetrievingData = false;
    this.ordersResponse = { orders: [], resultsAmount: 0 };
    this.dataSource.data = [];
    return of({ orders: [], resultsAmount: 0 });
  }

  private initializeForm(): void {
    this.form = this._builder.group({
      orderSearchString: new FormControl(''),
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
  }

  get orderSearchString() {
    return this.form.get('orderSearchString');
  }
}
