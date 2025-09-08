import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GetProductVariant } from '../models/get-product-variant';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class ProductVariantService {
  constructor(private _http: HttpClient) {}

  public getProductVariants(): Observable<GetProductVariant> {
    return this._http.get<GetProductVariant>(
      `${AppSettings.apiHost}/ProductVariant`
    );
  }
}
