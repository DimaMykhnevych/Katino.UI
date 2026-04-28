import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderTag } from 'src/app/core/models/order/order-tag';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class OrderTagService {
  constructor(private _http: HttpClient) {}

  public getOrderTags(
    search: string = '',
    customOnly: boolean | null = null,
  ): Observable<OrderTag[]> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('search', search);
    httpParams = httpParams.append(
      'customOnly',
      customOnly ? `${customOnly}` : 'false',
    );
    return this._http.get<OrderTag[]>(`${AppSettings.apiHost}/OrderTag`, {
      params: httpParams,
    });
  }

  public detachOrderTag(orderId: string, tagId: string): Observable<void> {
    return this._http.delete<void>(
      `${AppSettings.apiHost}/OrderTag/${orderId}/${tagId}`,
    );
  }
}
