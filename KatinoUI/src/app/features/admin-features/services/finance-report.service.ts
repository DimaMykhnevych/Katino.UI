import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PnlReport } from 'src/app/core/models/pnl/pnl-report';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class FinanceReportService {
  constructor(private _http: HttpClient) {}

  public getPnlReport(year?: number): Observable<PnlReport> {
    let httpParams = new HttpParams();
    if (year) {
      httpParams = httpParams.append('year', year);
    }

    return this._http.get<PnlReport>(
      `${AppSettings.apiHost}/FinanceReport/pnl`,
      {
        params: httpParams,
      },
    );
  }
}
