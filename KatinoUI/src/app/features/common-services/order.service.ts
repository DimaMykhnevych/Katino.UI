import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderStatus } from 'src/app/core/enums/order-status';
import { convertToHttpParams } from 'src/app/core/http/request/http-params.util';
import { AddOrder } from 'src/app/core/models/order/add-order/add-order';
import { GetOrderRequest } from 'src/app/core/models/order/get-order-request';
import { GetOrderResponse } from 'src/app/core/models/order/get-order-response';
import { SetManualOrderStatus } from 'src/app/core/models/order/set-manual-order-status';
import { AppSettings } from 'src/app/core/settings';
import { OrderCreationResult } from '../../core/models/order/add-order/order-creation-result';
import { OrderUpdateResult } from 'src/app/core/models/order/update-order/order-update-result';
import { UpdateOrder } from 'src/app/core/models/order/update-order/update-order';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  constructor(private _http: HttpClient) {}

  public getOrders(request: GetOrderRequest): Observable<GetOrderResponse> {
    const httpParams: HttpParams =
      convertToHttpParams<GetOrderRequest>(request);
    return this._http.get<GetOrderResponse>(`${AppSettings.apiHost}/Order`, {
      params: httpParams,
    });
  }

  public getNextManualStatus(
    currentStatus: OrderStatus,
  ): Observable<OrderStatus[]> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('CurrentOrderStatus', currentStatus);
    return this._http.get<OrderStatus[]>(
      `${AppSettings.apiHost}/Order/manual-status/get-next`,
      {
        params: httpParams,
      },
    );
  }

  public setManualStatus(request: SetManualOrderStatus): Observable<boolean> {
    return this._http.post<boolean>(
      `${AppSettings.apiHost}/Order/manual-status/set`,
      request,
    );
  }

  public addOrder(order: AddOrder): Observable<OrderCreationResult> {
    return this._http.post<OrderCreationResult>(
      `${AppSettings.apiHost}/Order`,
      order,
    );
  }

  public updateOrder(order: UpdateOrder): Observable<OrderUpdateResult> {
    return this._http.put<OrderUpdateResult>(
      `${AppSettings.apiHost}/Order`,
      order,
    );
  }
}
