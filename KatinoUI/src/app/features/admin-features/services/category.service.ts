import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppSettings } from 'src/app/core/settings';
import { GetCategoriesResponse } from '../models/get-categories-response';
import { Category } from 'src/app/core/models/category';
import { AddCategory } from '../models/add-category';
import { UpdateCategory } from '../models/update-category';

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

  public addCategory(category: AddCategory): Observable<Category> {
    return this._http.post<Category>(
      `${AppSettings.apiHost}/Category`,
      category
    );
  }

  public updateCategory(category: UpdateCategory): Observable<Category> {
    return this._http.put<Category>(
      `${AppSettings.apiHost}/Category`,
      category
    );
  }
}
