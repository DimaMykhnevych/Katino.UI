import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppSettings } from 'src/app/core/settings';
import { GetProductsResponse } from '../models/get-products-response';
import { AddProduct } from '../models/add-product';
import { Product } from 'src/app/core/models/product';
import { UpdateProduct } from '../models/update-product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private _http: HttpClient) {}

  public getProducts(): Observable<GetProductsResponse> {
    return this._http.get<GetProductsResponse>(
      `${AppSettings.apiHost}/Product`
    );
  }

  public addProduct(product: AddProduct): Observable<Product> {
    return this._http.post<Product>(`${AppSettings.apiHost}/Product`, product);
  }

  public updateProduct(product: UpdateProduct): Observable<Product> {
    return this._http.put<Product>(`${AppSettings.apiHost}/Product`, product);
  }
}
