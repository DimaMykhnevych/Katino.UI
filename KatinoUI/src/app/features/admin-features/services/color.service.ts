import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppSettings } from 'src/app/core/settings';
import { GetColorsResponse } from '../models/get-colors-response';
import { AddColor } from '../models/add-color';
import { Color } from 'src/app/core/models/color';
import { UpdateColor } from '../models/update-color';

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  constructor(private _http: HttpClient) {}

  public getColors(): Observable<GetColorsResponse> {
    return this._http.get<GetColorsResponse>(`${AppSettings.apiHost}/Color`);
  }

  public addColor(color: AddColor): Observable<Color> {
    return this._http.post<Color>(`${AppSettings.apiHost}/Color`, color);
  }

  public updateColor(color: UpdateColor): Observable<Color> {
    return this._http.put<Color>(`${AppSettings.apiHost}/Color`, color);
  }
}
