import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderStatus } from 'src/app/core/enums/order-status';
import { convertToHttpParams } from 'src/app/core/http/request/http-params.util';
import { AddOrder } from 'src/app/core/models/order/add-order/add-order';
import { GetOrderRequest } from 'src/app/core/models/order/get-order-request';
import { GetOrderResponse } from 'src/app/core/models/order/get-order-response';
import { Order } from 'src/app/core/models/order/order';
import { SetManualOrderStatus } from 'src/app/core/models/order/set-manual-order-status';
import { AppSettings } from 'src/app/core/settings';
import { OrderCreationResult } from '../../core/models/order/add-order/order-creation-result';
import { OrderUpdateResult } from 'src/app/core/models/order/update-order/order-update-result';
import { UpdateOrder } from 'src/app/core/models/order/update-order/update-order';
import { OrderDeleteResult } from 'src/app/core/models/order/delete-order/order-delete-result';
import { OrderPricingResult } from 'src/app/core/models/order/cost/order-pricing-result';
import { PreviewOrderCostRequest } from 'src/app/core/models/order/cost/preview-order-cost-request';

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

  public getNextManualStatus(orderId: string): Observable<OrderStatus[]> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('OrderId', orderId);
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

  public getOrderById(id: string): Observable<Order> {
    return this._http.get<Order>(`${AppSettings.apiHost}/Order/${id}`);
  }

  public deleteOrder(id: string): Observable<OrderDeleteResult> {
    return this._http.delete<OrderDeleteResult>(
      `${AppSettings.apiHost}/Order/${id}`,
    );
  }

  public previewCost(
    previewOrderCostQuery: PreviewOrderCostRequest,
  ): Observable<OrderPricingResult> {
    return this._http.post<OrderPricingResult>(
      `${AppSettings.apiHost}/Order/preview-cost`,
      previewOrderCostQuery,
    );
  }
}
