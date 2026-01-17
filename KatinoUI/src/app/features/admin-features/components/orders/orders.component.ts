import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { catchError, debounceTime, takeUntil } from 'rxjs/operators';
import { GetOrderRequest } from 'src/app/core/models/order/get-order-request';
import { GetOrderResponse } from 'src/app/core/models/order/get-order-response';
import { OrderService } from 'src/app/features/common-services/order.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit, OnDestroy {
  public form: FormGroup = this._builder.group({});
  public isRetrievingData = false;

  public ordersResponse?: GetOrderResponse;

  private _destroy$: Subject<void> = new Subject<void>();

  constructor(
    private _builder: FormBuilder,
    private _orderService: OrderService,
  ) {}

  public ngOnInit(): void {
    this.initializeForm();
    this.subscribeOnFormValueChanges();

    // TODO pageSize is taken from mat-table
    this.getOrders({ page: 1, pageSize: 20, search: '' });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private getOrders(request: GetOrderRequest): void {
    this.isRetrievingData = true;
    this._orderService
      .getOrders(request)
      .pipe(
        catchError((error) => {
          return this.onCatchError(error);
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((resp: GetOrderResponse) => {
        this.ordersResponse = resp;
        this.isRetrievingData = false;
      });
  }

  private onCatchError(error: any): Observable<any> {
    this.isRetrievingData = false;
    return of({});
  }

  private initializeForm(): void {
    this.form = this._builder.group({
      orderSearchString: new FormControl(),
    });
  }

  private subscribeOnFormValueChanges(): void {
    this.form.valueChanges
      .pipe(takeUntil(this._destroy$), debounceTime(300))
      .subscribe(() => {
        // this.dataSource.data = [];
        // TODO pageSize is taken from mat-table
        this.getOrders({
          page: 1,
          pageSize: 20,
          search: this.form.value.orderSearchString,
        });
      });
  }

  get orderSearchString() {
    return this.form.get('orderSearchString');
  }
}
