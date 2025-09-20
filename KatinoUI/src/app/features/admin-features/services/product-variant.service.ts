import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GetProductVariant } from '../models/get-product-variant';
import { AppSettings } from 'src/app/core/settings';
import { GetProductVariantRequest } from '../models/get-product-variant-request';
import { convertToHttpParams } from 'src/app/core/http/request/http-params.util';

@Injectable({
  providedIn: 'root',
})
export class ProductVariantService {
  constructor(private _http: HttpClient) {}

  public getProductVariants(
    request: GetProductVariantRequest
  ): Observable<GetProductVariant> {
    const httpParams: HttpParams =
      convertToHttpParams<GetProductVariantRequest>(request);
    return this._http.get<GetProductVariant>(
      `${AppSettings.apiHost}/ProductVariant`,
      {
        params: httpParams,
      }
    );
  }
}
