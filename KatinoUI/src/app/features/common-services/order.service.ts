import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
import { ProductVariantRedistributionHistory } from 'src/app/core/models/order/product-variant-redistribution-history';
import { TtnActionResult } from 'src/app/core/models/order/ttn-action-result';
import { ReceiptActionResult } from 'src/app/core/models/order/receipt/receipt-action-result';
import { ReceiptReturnInfo } from 'src/app/core/models/order/receipt/receipt-return-info';
import { OrderReceipt } from 'src/app/core/models/order/receipt/order-receipt';
import { ReceiptPdf } from 'src/app/core/models/order/receipt/receipt-pdf';

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

  public getRedistributionHistory(
    id: string,
  ): Observable<ProductVariantRedistributionHistory[]> {
    return this._http.get<ProductVariantRedistributionHistory[]>(
      `${AppSettings.apiHost}/Order/${id}/redistribution-history`,
    );
  }

  // prepaymentReturned is omitted when the order has no prepayment that a receipt could return
  public deleteOrder(
    id: string,
    prepaymentReturned?: boolean,
  ): Observable<OrderDeleteResult> {
    let params = new HttpParams();
    if (prepaymentReturned !== undefined) {
      params = params.append('prepaymentReturned', String(prepaymentReturned));
    }
    return this._http.delete<OrderDeleteResult>(
      `${AppSettings.apiHost}/Order/${id}`,
      { params },
    );
  }

  public retryTtn(id: string): Observable<TtnActionResult> {
    return this._http.post<TtnActionResult>(
      `${AppSettings.apiHost}/Order/${id}/ttn/retry`,
      {},
    );
  }

  public createTtn(id: string): Observable<TtnActionResult> {
    return this._http.post<TtnActionResult>(
      `${AppSettings.apiHost}/Order/${id}/ttn/create`,
      {},
    );
  }

  public retryReceipt(id: string): Observable<ReceiptActionResult> {
    return this._http.post<ReceiptActionResult>(
      `${AppSettings.apiHost}/Order/${id}/receipt/retry`,
      {},
    );
  }

  public getReceiptReturnInfo(id: string): Observable<ReceiptReturnInfo> {
    return this._http.get<ReceiptReturnInfo>(
      `${AppSettings.apiHost}/Order/${id}/receipt/return`,
    );
  }

  public returnReceipt(
    id: string,
    guaranteeAmount: number | null,
  ): Observable<ReceiptActionResult> {
    return this._http.post<ReceiptActionResult>(
      `${AppSettings.apiHost}/Order/${id}/receipt/return`,
      { guaranteeAmount },
    );
  }

  public getReceipts(id: string): Observable<OrderReceipt[]> {
    return this._http.get<OrderReceipt[]>(
      `${AppSettings.apiHost}/Order/${id}/receipts`,
    );
  }

  // The public Checkbox link of the receipt comes in the X-Receipt-Url header
  public getReceiptPdf(id: string, receiptId: string): Observable<ReceiptPdf> {
    return this._http
      .get(`${AppSettings.apiHost}/Order/${id}/receipts/${receiptId}/pdf`, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((resp) => ({
          blob: resp.body as Blob,
          receiptUrl: resp.headers.get('X-Receipt-Url'),
        })),
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
