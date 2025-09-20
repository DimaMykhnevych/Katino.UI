import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppSettings } from 'src/app/core/settings';
import { GetCategoriesResponse } from '../models/get-categories-response';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private _http: HttpClient) {}

  public getCategories(): Observable<GetCategoriesResponse> {
    return this._http.get<GetCategoriesResponse>(
      `${AppSettings.apiHost}/Category`
    );
  }
}
