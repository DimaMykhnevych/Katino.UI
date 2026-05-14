import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ChartConfiguration, ChartData } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import {
  toUtcEndOfDay,
  toUtcStartOfDay,
} from 'src/app/core/helpers/date.helper';
import { GetTopSellingProductsRequest } from 'src/app/core/models/statistics/top-products/get-top-selling-products-request';
import { TopSellingProduct } from 'src/app/core/models/statistics/top-products/top-selling-product';
import { StatisticsService } from '../../../services/statistics.service';

@Component({
  selector: 'app-top-selling-products',
  templateUrl: './top-selling-products.component.html',
  styleUrls: ['./top-selling-products.component.scss'],
})
export class TopSellingProductsComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() public dateFrom: Date | null = null;
  @Input() public dateTo: Date | null = null;

  public chartPlugins = [ChartDataLabels];

  public isLoading = false;
  public products: TopSellingProduct[] = [];
  public totalCount = 0;
  public pageIndex = 0;
  public pageSize = 20;
  public pageSizeOptions = [5, 10, 20];

  public chartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: '',
        backgroundColor: 'rgba(63, 81, 181, 0.75)',
        borderColor: 'rgba(63, 81, 181, 1)',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(63, 81, 181, 0.9)',
      },
    ],
  };

  public chartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 8 } },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
      datalabels: {
        anchor: 'end',
        align: (ctx: any) => {
          const vals = ctx.dataset.data as number[];
          const max = Math.max(...vals);
          return max > 0 && vals[ctx.dataIndex] / max > 0.5 ? 'start' : 'end';
        },
        color: (ctx: any) => {
          const vals = ctx.dataset.data as number[];
          const max = Math.max(...vals);
          return max > 0 && vals[ctx.dataIndex] / max > 0.5 ? '#fff' : '#3f51b5';
        },
        font: { size: 12, weight: 'bold' },
        padding: 6,
        formatter: (value: number) => value,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { precision: 0 },
        grid: { color: 'rgba(0,0,0,0.06)' },
      },
      y: {
        grid: { display: false },
      },
    },
  };

  public get chartHeight(): number {
    const perItem = 44;
    const minHeight = 180;
    return Math.max(minHeight, this.products.length * perItem);
  }

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

    const request: GetTopSellingProductsRequest = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      from: toUtcStartOfDay(this.dateFrom) ?? undefined,
      to: toUtcEndOfDay(this.dateTo) ?? undefined,
    };

    this._statisticsService
      .getTopSellingProducts(request)
      .pipe(
        catchError(() => of({ products: [], resultsAmount: 0 })),
        takeUntil(this._destroy$),
      )
      .subscribe((response) => {
        this.isLoading = false;
        this.products = response.products;
        this.totalCount = response.resultsAmount;
        this.updateChart();
      });
  }

  private updateChart(): void {
    this.chartData = {
      ...this.chartData,
      labels: this.products.map((p) => this.truncateLabel(p.name)),
      datasets: [
        {
          ...this.chartData.datasets[0],
          data: this.products.map((p) => p.totalSold),
        },
      ],
    };
  }

  private truncateLabel(label: string, maxLength = 28): string {
    return label.length > maxLength
      ? label.substring(0, maxLength) + '…'
      : label;
  }
}
