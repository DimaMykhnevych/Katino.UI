import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppSettings } from 'src/app/core/settings';
import { GetSizesResponse } from '../models/get-sizes-response';
import { AddSize } from '../models/add-size';
import { Size } from 'src/app/core/models/size';

@Injectable({
  providedIn: 'root',
})
export class SizeService {
  constructor(private _http: HttpClient) {}

  public getSizes(): Observable<GetSizesResponse> {
    return this._http.get<GetSizesResponse>(`${AppSettings.apiHost}/Size`);
  }

  public addSize(size: AddSize): Observable<Size> {
    return this._http.post<Size>(`${AppSettings.apiHost}/Size`, size);
  }
}
