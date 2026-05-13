import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
})
export class StatisticsComponent implements OnInit, OnDestroy {
  public filterForm!: FormGroup;
  public appliedFrom: Date | null = null;
  public appliedTo: Date | null = null;

  private _destroy$ = new Subject<void>();

  constructor(private _fb: FormBuilder) {}

  public ngOnInit(): void {
    this.filterForm = this._fb.group({
      dateFrom: [null],
      dateTo: [null],
    });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public applyFilters(): void {
    const { dateFrom, dateTo } = this.filterForm.value;
    this.appliedFrom = dateFrom ?? null;
    this.appliedTo = dateTo ?? null;
  }

  public resetFilters(): void {
    this.filterForm.reset();
    this.appliedFrom = null;
    this.appliedTo = null;
  }
}
