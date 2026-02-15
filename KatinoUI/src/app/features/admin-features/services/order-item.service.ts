import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GetSewingQueueItems } from 'src/app/core/models/sewing-queue/get-sewing-queue-items';
import { SubmitSewedReport } from 'src/app/core/models/sewing-queue/submit-sewed-report';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class OrderItemService {
  constructor(private _http: HttpClient) {}

  public getSewingQueue(): Observable<GetSewingQueueItems> {
    return this._http.get<GetSewingQueueItems>(
      `${AppSettings.apiHost}/OrderItem/sewing-queue`,
    );
  }

  public submitSewingReport(request: SubmitSewedReport): Observable<boolean> {
    return this._http.post<boolean>(
      `${AppSettings.apiHost}/OrderItem/sewing-report`,
      request,
    );
  }
}
