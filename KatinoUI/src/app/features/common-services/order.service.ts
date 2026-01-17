import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { convertToHttpParams } from 'src/app/core/http/request/http-params.util';
import { GetOrderRequest } from 'src/app/core/models/order/get-order-request';
import { GetOrderResponse } from 'src/app/core/models/order/get-order-response';
import { AppSettings } from 'src/app/core/settings';

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
}
