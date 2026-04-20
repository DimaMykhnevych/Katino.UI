import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { Observable, Subject, merge, of } from 'rxjs';
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
import { AddEditOrderData } from '../../models/order/add-edit-order-data';
import { UIDialogService } from 'src/app/layout/dialogs/services/ui-dialog.service';
import { OrderDeleteResult } from 'src/app/core/models/order/delete-order/order-delete-result';
import { DatePipe } from '@angular/common';
import { CurrentUserService } from 'src/app/core/permission/services';
import { Roles } from 'src/app/core/models/roles';
import { NovaPostService } from 'src/app/features/common-services/nova-post.service';
import { OrderSort } from 'src/app/core/enums/order-sort';
import { DeliveryType } from 'src/app/core/enums/delivery-type';
import { OrderTagType } from 'src/app/core/enums/order-tag-type';
import { OrderTag } from 'src/app/core/models/order/order-tag';
import { OrderTagService } from '../../services/order-tag.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  @ViewChild(MatMenuTrigger) private _statusMenuTrigger?: MatMenuTrigger;
  public readonly DeliveryType = DeliveryType;
  public readonly OrderTagType = OrderTagType;
  public readonly ALL_STATUSES_VALUE = DefaultOptions.allSelectionOptionId;
  public readonly ALL_TAGS_VALUE = DefaultOptions.allSelectionOptionId;
  public readonly orderSortOptions: { value: OrderSort; labelKey: string }[] = [
    {
      value: OrderSort.byCreationDate,
      labelKey: 'orders.filters.sortByCreationDate',
    },
    { value: OrderSort.byUrgency, labelKey: 'orders.filters.sortByUrgency' },
  ];
  public translatedAllOption$?: Observable<string>;
  public translatedAllTagsOption$?: Observable<string>;
  public allTags: OrderTag[] = [];

  public userRole: string | undefined = '';
  public form: FormGroup = this._builder.group({});
  public isRetrievingData = false;
  public isCreatingScanSheet = false;

  public statusLoading = new Set<string>();
  public statusSaving = new Set<string>();
  public currentMenuOrder?: Order;
  public currentManualOptions: OrderStatus[] = [];

  public ordersResponse?: GetOrderResponse;

  public dataSource = new MatTableDataSource<Order>([]);
  public displayedColumns: string[] = [
    'sendUntil',
    'comment',
    'ttn',
    'items',
    'delivery',
    'status',
    'cost',
    'actions',
  ];

  public pageIndex = 0;
  public pageSize = 20;
  public pageSizeOptions = [10, 20, 50, 100];

  public allOrderStatuses: OrderStatus[] = Object.values(OrderStatus).filter(
    (v) => typeof v === 'number',
  ) as OrderStatus[];

  public selectedStatuses: (OrderStatus | string)[] = [this.ALL_STATUSES_VALUE];

  private _destroy$ = new Subject<void>();
  private _statusesAutoSet = false;

  constructor(
    private _builder: FormBuilder,
    private _orderService: OrderService,
    private _dialogService: DialogService,
    private _customTranslate: CustomTranslateService,
    private _toastr: ToastrService,
    private _translate: TranslateService,
    private _uiDialogService: UIDialogService,
    private _userService: CurrentUserService,
    private _novaPostService: NovaPostService,
    private datePipe: DatePipe,
    private _orderTagService: OrderTagService,
  ) {}

  public ngOnInit(): void {
    const currentUserInfo = this._userService.userInfo;
    this.userRole = currentUserInfo.role;
    this.initializeForm();
    this.translatedAllOption$ = this._translate.stream(
      'orders.filters.allStatuses',
    );
    this.translatedAllTagsOption$ = this._translate.stream(
      'orders.filters.allTags',
    );
    this._orderTagService
      .getOrderTags()
      .pipe(takeUntil(this._destroy$))
      .subscribe((tags) => {
        this.allTags = tags;
      });
    this.subscribeOnFormValueChanges();

    this.fetchOrders();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public isCreateScanSheetControlVisible(): boolean {
    return this.userRole === Roles.Admin || this.userRole === Roles.Owner;
  }

  public onAddOrderClick(): void {
    const data: AddEditOrderData = {
      order: null,
      isAdding: true,
    };
    const dialogRef = this._dialogService.openAddEditOrderDialog(data);
    dialogRef.afterClosed().subscribe((changed: boolean) => {
      if (changed) {
        this.pageIndex = 0;
        this.fetchOrders();
      }
    });
  }

  public onCreateScanSheetClick(): void {
    this.isCreatingScanSheet = true;
    this._novaPostService
      .createScanSheet()
      .pipe(
        catchError(() => {
          this.isCreatingScanSheet = false;
          return of(false);
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((resp: boolean) => {
        this.isCreatingScanSheet = false;
        if (resp === true) {
          this._toastr.success(
            this._translate.instant('orders.toastr.scanSheetCreated'),
          );
        } else {
          this._toastr.error(
            this._translate.instant('orders.toastr.scanSheetFailed'),
          );
        }
      });
  }

  public onEditOrderClick(order: Order): void {
    const data: AddEditOrderData = {
      order: order,
      isAdding: false,
    };

    const dialogRef = this._dialogService.openAddEditOrderDialog(data);
    dialogRef.afterClosed().subscribe((changed: boolean) => {
      if (changed) {
        this.pageIndex = 0;
        this.fetchOrders();
      }
    });
  }

  public onDeleteOrderClick(order: Order): void {
    const orderItemsRows = order.orderItems.map(
      (oi) =>
        `${oi.productVariant.product.name} • ${oi.productVariant.color.name} • ${oi.productVariant.size.name}`,
    );
    const orderItemsText = orderItemsRows.join('\n');
    const formattedDate = this.datePipe.transform(
      order.creationDateTime,
      'shortDate',
    );

    const dialogRef = this._uiDialogService.openConfirmationDialog({
      titleKey: 'dialogs.orderDeletionTitle',
      contentKey: 'dialogs.orderDeletionContent',
      contentParams: {
        orderDate: formattedDate,
        orderInfo: orderItemsText,
      },
      confirmButtonTextKey: 'common.delete',
      cancelButtonTextKey: 'common.cancel',
      type: 'danger',
      icon: 'delete_outline',
    });

    dialogRef.afterClosed().subscribe((confirmed: string) => {
      if (confirmed === 'true') {
        this.onOrderDelete(order);
      }
    });
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
      .getNextManualStatus(o.id)
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

        if (
          newStatus === OrderStatus.refusal ||
          newStatus === OrderStatus.exchange
        ) {
          this.fetchOrders();
        }
      });
  }

  public onAllTagsToggled(e: MatOptionSelectionChange): void {
    if (!e.isUserInput) return;

    if (e.source.selected) {
      this.orderTagsControl!.setValue([this.ALL_TAGS_VALUE], {
        emitEvent: true,
      });
    } else {
      this.orderTagsControl!.setValue([], { emitEvent: true });
    }
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

  public clearDateRange(): void {
    this.form.patchValue({ createdFrom: null, createdTo: null });
  }

  public getTtnPrefix(ttn: string | null | undefined): string {
    if (!ttn) return '';
    if (ttn.length <= 4) return '';
    return ttn.slice(0, -4);
  }

  public getTtnSuffix(ttn: string | null | undefined): string {
    if (!ttn) return '';
    return ttn.slice(-4);
  }

  public getOrderTagTextKey(type: OrderTagType): string {
    return this._customTranslate.getOrderTagTextKey(type);
  }

  public onDetachTag(order: Order, tag: OrderTag, event: MouseEvent): void {
    event.stopPropagation();
    order.tags = order.tags.filter((t) => t.id !== tag.id);
    this._orderTagService
      .detachOrderTag(order.id, tag.id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: () => {
          this._toastr.success(
            this._translate.instant('orders.toastr.tagDetached'),
          );
          this.fetchOrders();
        },
        error: () => {
          order.tags = [...order.tags, tag];
          this._toastr.error(
            this._translate.instant('orders.toastr.tagDetachFailed'),
          );
        },
      });
  }

  get orderSearchString() {
    return this.form.get('orderSearchString');
  }

  get orderStatuses() {
    return this.form.get('orderStatuses');
  }

  get createdFrom() {
    return this.form.get('createdFrom');
  }

  get createdTo() {
    return this.form.get('createdTo');
  }

  get orderSort() {
    return this.form.get('orderSort');
  }

  get orderTagsControl() {
    return this.form.get('orderTags');
  }

  private fetchOrders(sort?: OrderSort): void {
    const values = (this.orderStatuses!.value ?? []) as (
      | OrderStatus
      | string
    )[];
    this.fetchOrdersWithStatuses(values, sort);
  }

  private fetchOrdersWithStatuses(
    values: (OrderStatus | string)[],
    sort?: OrderSort,
  ): void {
    const isAll = values.includes(this.ALL_STATUSES_VALUE);

    const request: GetOrderRequest = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      search: (this.form.value.orderSearchString || '').trim(),
      orderStatuses: isAll ? [] : (values as OrderStatus[]),
      tagIds: this.getSelectedTagIds(),
      createdFrom: this.toUtcStartOfDay(this.form.value.createdFrom),
      createdTo: this.toUtcEndOfDay(this.form.value.createdTo),
      sort: sort ?? this.form.value.orderSort ?? OrderSort.byCreationDate,
    };

    this.getOrders(request);
  }

  private getOrders(request: GetOrderRequest): void {
    this.isRetrievingData = true;
    this.dataSource.data = [];

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

  private onOrderDelete(order: Order): void {
    this._orderService
      .deleteOrder(order.id)
      .pipe(
        catchError((error) => {
          return this.onCatchDeleteError();
        }),
      )
      .subscribe((resp: OrderDeleteResult) => {
        this.onOrderDeletionCompleted(resp);
      });
  }

  private onOrderDeletionCompleted(resp: OrderDeleteResult) {
    if (!resp.orderDeletedSuccessfully) {
      this.showError(this._translate.instant('toastrs.orderDeletionFailed'));
    } else if (!resp.npInternetDocDeletedSuccessfully) {
      this._toastr.warning(this._translate.instant('toastrs.docNotDeleted'));
    } else {
      this._toastr.success(
        this._translate.instant('toastrs.orderDeleteSuccess'),
      );
    }

    this.pageIndex = 0;
    this.fetchOrders();
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

  private getSelectedTagIds(): string[] {
    const values = (this.orderTagsControl!.value ?? []) as string[];
    const isAll = values.includes(this.ALL_TAGS_VALUE);
    return isAll ? [] : values;
  }

  private applyAllTagsRules(values: string[]): void {
    const ctrl = this.orderTagsControl!;
    const hasAll = values.includes(this.ALL_TAGS_VALUE);

    if (hasAll && values.length > 1) {
      ctrl.setValue(
        values.filter((v) => v !== this.ALL_TAGS_VALUE),
        { emitEvent: false },
      );
      return;
    }

    if (!hasAll && values.length === 0) {
      ctrl.setValue([this.ALL_TAGS_VALUE], { emitEvent: false });
    }
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

  private showError(text: string): void {
    this._toastr.error(`${text}`);
  }

  private onCatchError(error: any): Observable<any> {
    this.isRetrievingData = false;
    this.ordersResponse = { orders: [], resultsAmount: 0 };
    this.dataSource.data = [];
    return of({ orders: [], resultsAmount: 0 });
  }

  private onCatchDeleteError(): Observable<any> {
    this._translate
      .get('toastrs.orderDeletedUnknownError')
      .subscribe((resp: string) => {
        this.showError(resp);
      });

    return of({});
  }

  private initializeForm(): void {
    this.form = this._builder.group({
      orderSearchString: new FormControl(''),
      orderStatuses: new FormControl([this.ALL_STATUSES_VALUE]),
      orderTags: new FormControl([this.ALL_TAGS_VALUE]),
      createdFrom: new FormControl(null),
      createdTo: new FormControl(null),
      orderSort: new FormControl(OrderSort.byCreationDate),
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

      this._statusesAutoSet = false;
      this.applyAllStatusesRules(values);

      const finalValues = (ctrl.value ?? []) as (OrderStatus | string)[];

      this.pageIndex = 0;
      this.fetchOrdersWithStatuses(finalValues);
    });

    merge(this.createdFrom!.valueChanges, this.createdTo!.valueChanges)
      .pipe(auditTime(0), takeUntil(this._destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.fetchOrders();
      });

    this.orderTagsControl!.valueChanges.pipe(
      auditTime(0),
      takeUntil(this._destroy$),
    ).subscribe(() => {
      const values = (this.orderTagsControl!.value ?? []) as string[];
      this.applyAllTagsRules(values);
      this.pageIndex = 0;
      this.fetchOrders();
    });

    this.orderSort!.valueChanges.pipe(takeUntil(this._destroy$)).subscribe(
      (sort: OrderSort) => {
        const currentStatuses = (this.orderStatuses!.value ?? []) as (
          | OrderStatus
          | string
        )[];
        const isAllStatuses =
          currentStatuses.length === 1 &&
          currentStatuses[0] === this.ALL_STATUSES_VALUE;

        if (sort === OrderSort.byUrgency && isAllStatuses) {
          this._statusesAutoSet = true;
          this.orderStatuses!.setValue(
            [OrderStatus.inProgress, OrderStatus.readyToShip],
            { emitEvent: false },
          );
        } else if (sort !== OrderSort.byUrgency && this._statusesAutoSet) {
          this._statusesAutoSet = false;
          this.orderStatuses!.setValue([this.ALL_STATUSES_VALUE], {
            emitEvent: false,
          });
        }

        this.pageIndex = 0;
        this.fetchOrders(sort);
      },
    );
  }

  private toUtcStartOfDay(date: Date | null | undefined): string | null {
    if (!date) return null;
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
    ).toISOString();
  }

  private toUtcEndOfDay(date: Date | null | undefined): string | null {
    if (!date) return null;
    return new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999,
      ),
    ).toISOString();
  }
}
