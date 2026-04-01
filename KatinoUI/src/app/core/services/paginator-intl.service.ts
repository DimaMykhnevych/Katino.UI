import { Injectable, OnDestroy } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable()
export class PaginatorIntlService extends MatPaginatorIntl implements OnDestroy {
  private _destroy$ = new Subject<void>();

  constructor(private _translate: TranslateService) {
    super();
    this._translate.onLangChange
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this._updateLabels());
    this._updateLabels();
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this._translate.instant('paginator.rangeOfLabel', { length });
    }
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return this._translate.instant('paginator.rangeLabel', {
      startIndex: startIndex + 1,
      endIndex,
      length,
    });
  };

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _updateLabels(): void {
    this.itemsPerPageLabel = this._translate.instant('paginator.itemsPerPage');
    this.nextPageLabel = this._translate.instant('paginator.nextPage');
    this.previousPageLabel = this._translate.instant('paginator.previousPage');
    this.firstPageLabel = this._translate.instant('paginator.firstPage');
    this.lastPageLabel = this._translate.instant('paginator.lastPage');
    this.changes.next();
  }
}
