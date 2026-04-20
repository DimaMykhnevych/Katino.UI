import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderTag } from 'src/app/core/models/order/order-tag';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class OrderTagService {
  constructor(private _http: HttpClient) {}

  public getOrderTags(): Observable<OrderTag[]> {
    return this._http.get<OrderTag[]>(`${AppSettings.apiHost}/OrderTag`);
  }

  public detachOrderTag(orderId: string, tagId: string): Observable<void> {
    return this._http.delete<void>(
      `${AppSettings.apiHost}/OrderTag/${orderId}/${tagId}`,
    );
  }
}
