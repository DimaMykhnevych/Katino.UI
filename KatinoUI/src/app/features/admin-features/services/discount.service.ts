import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppSettings } from 'src/app/core/settings';
import { DiscountResponse } from 'src/app/core/models/discount/discount-response';
import { AddDiscount } from 'src/app/core/models/discount/add-discount';
import { UpdateDiscount } from 'src/app/core/models/discount/update-discount';
import { SetDiscountActive } from 'src/app/core/models/discount/set-discount-active';

@Injectable({
  providedIn: 'root',
})
export class DiscountService {
  constructor(private _http: HttpClient) {}

  public getDiscounts(): Observable<DiscountResponse[]> {
    return this._http.get<DiscountResponse[]>(
      `${AppSettings.apiHost}/Discount`,
    );
  }

  public addDiscount(discount: AddDiscount): Observable<DiscountResponse> {
    return this._http.post<DiscountResponse>(
      `${AppSettings.apiHost}/Discount`,
      discount,
    );
  }

  public updateDiscount(
    discount: UpdateDiscount,
  ): Observable<DiscountResponse> {
    return this._http.put<DiscountResponse>(
      `${AppSettings.apiHost}/Discount/${discount.id}`,
      discount,
    );
  }

  public deleteDiscount(discountId: string): Observable<boolean> {
    return this._http.delete<boolean>(
      `${AppSettings.apiHost}/Discount/${discountId}`,
    );
  }

  public setDiscountActive(
    setDiscount: SetDiscountActive,
  ): Observable<boolean> {
    return this._http.patch<boolean>(
      `${AppSettings.apiHost}/Discount/${setDiscount.id}/active`,
      setDiscount,
    );
  }
}
