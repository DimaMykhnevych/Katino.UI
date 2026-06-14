import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import {
  toUtcEndOfDay,
  toUtcStartOfDay,
} from 'src/app/core/helpers/date.helper';
import { GetSewingStatisticsRequest } from 'src/app/core/models/statistics/sewed-amount/get-sewing-statistics-request';
import { SewingStatisticsItem } from 'src/app/core/models/statistics/sewed-amount/sewing-statistics-item';
import { StatisticsService } from '../../../services/statistics.service';

@Component({
  selector: 'app-sewing-statistics',
  templateUrl: './sewing-statistics.component.html',
  styleUrls: ['./sewing-statistics.component.scss'],
})
export class SewingStatisticsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() public dateFrom: Date | null = null;
  @Input() public dateTo: Date | null = null;

  public displayedColumns = ['productName', 'totalSewed', 'sewerName'];

  public isLoading = false;
  public items: SewingStatisticsItem[] = [];
  public totalCount = 0;
  public pageIndex = 0;
  public pageSize = 20;
  public pageSizeOptions = [5, 10, 20];

  private _destroy$ = new Subject<void>();

  constructor(private _statisticsService: StatisticsService) {}

  public ngOnInit(): void {
    this.loadData();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const dateFromChanged =
      changes['dateFrom'] && !changes['dateFrom'].firstChange;
    const dateToChanged = changes['dateTo'] && !changes['dateTo'].firstChange;

    if (dateFromChanged || dateToChanged) {
      this.pageIndex = 0;
      this.loadData();
    }
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onPageChanged(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;

    const request: GetSewingStatisticsRequest = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      from: toUtcStartOfDay(this.dateFrom) ?? undefined,
      to: toUtcEndOfDay(this.dateTo) ?? undefined,
    };

    this._statisticsService
      .getSewingStatistics(request)
      .pipe(
        catchError(() => of({ items: [], resultsAmount: 0 })),
        takeUntil(this._destroy$),
      )
      .subscribe((response) => {
        this.isLoading = false;
        this.items = response.items;
        this.totalCount = response.resultsAmount;
      });
  }
}
