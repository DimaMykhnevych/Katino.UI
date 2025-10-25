import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GetMeasurementTypesResponse } from '../models/get-measurement-types-response';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class MeasurementTypeService {
  constructor(private _http: HttpClient) {}

  public getMeasurementTypes(): Observable<GetMeasurementTypesResponse> {
    return this._http.get<GetMeasurementTypesResponse>(
      `${AppSettings.apiHost}/MeasurementType`
    );
  }
}
