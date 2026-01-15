import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap, takeUntil } from 'rxjs/operators';
import { CurrentSyncStatus } from 'src/app/core/models/nova-post/current-sync-status';
import { SyncRecord } from 'src/app/core/models/nova-post/sync-record';
import { SyncStatus } from 'src/app/core/enums/sync-status';
import { NovaPostService } from 'src/app/features/common-services/nova-post.service';

import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-np-sync-history',
  templateUrl: './np-sync-history.component.html',
  styleUrls: ['./np-sync-history.component.scss'],
})
export class NpSyncHistoryComponent implements OnInit, OnDestroy {
  @Output() syncInProgressChanged = new EventEmitter<boolean>();

  public readonly HISTORY_LIMIT = 20;

  public currentStatus?: CurrentSyncStatus;
  public isLoading = false;
  public isTriggering = false;

  public dataSource = new MatTableDataSource<SyncRecord>([]);
  public displayedColumns: string[] = [
    'status',
    'startedAt',
    'completedAt',
    'apiRequestedRecords',
    'dbInsertedRecords',
    'triggeredByUsername',
    'errorMessage',
  ];

  public readonly SyncStatus = SyncStatus;

  private _destroy$ = new Subject<void>();

  constructor(
    private _novaPostService: NovaPostService,
    private _toastr: ToastrService,
    private _translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onTriggerSync(): void {
    if (!this.currentStatus?.canTriggerSync || this.isTriggering) return;

    this.isTriggering = true;
    this._novaPostService
      .triggerSync()
      .pipe(
        finalize(() => (this.isTriggering = false)),
        catchError(() => {
          this._toastr.error(
            this._translate.instant('crmSettingsPage.sync.toast.triggerFailed'),
            this._translate.instant('crmSettingsPage.sync.toast.title')
          );
          return of(void 0);
        })
      )
      .subscribe(() => {
        this._toastr.success(
          this._translate.instant('crmSettingsPage.sync.toast.triggered'),
          this._translate.instant('crmSettingsPage.sync.toast.title')
        );

        this.loadAll();
      });
  }

  public getStatusTextKey(status: SyncStatus): string {
    switch (status) {
      case SyncStatus.notStarted:
        return 'crmSettingsPage.sync.status.notStarted';
      case SyncStatus.inProgress:
        return 'crmSettingsPage.sync.status.inProgress';
      case SyncStatus.completed:
        return 'crmSettingsPage.sync.status.completed';
      case SyncStatus.failed:
        return 'crmSettingsPage.sync.status.failed';
      default:
        return 'crmSettingsPage.sync.status.notStarted';
    }
  }

  public getStatusBadgeClass(status: SyncStatus): string {
    switch (status) {
      case SyncStatus.inProgress:
        return 'badge badge--progress';
      case SyncStatus.completed:
        return 'badge badge--success';
      case SyncStatus.failed:
        return 'badge badge--fail';
      default:
        return 'badge badge--neutral';
    }
  }

  private loadAll(): void {
    this.loadAll$().subscribe();
  }

  private loadAll$() {
    this.isLoading = true;

    return forkJoin({
      status: this._novaPostService
        .getCurrentSyncStatus()
        .pipe(catchError(() => of(undefined))),
      history: this._novaPostService
        .getSyncHistory(this.HISTORY_LIMIT)
        .pipe(catchError(() => of({ syncRecords: [], resultsAmount: 0 }))),
    }).pipe(
      finalize(() => (this.isLoading = false)),
      takeUntil(this._destroy$),
      switchMap((res) => {
        if (res.status) this.currentStatus = res.status;
        this.dataSource.data = res.history.syncRecords ?? [];

        this.emitSyncFlag();

        return of(null);
      })
    );
  }

  private emitSyncFlag(): void {
    this.syncInProgressChanged.emit(!!this.currentStatus?.isInProgress);
  }
}
