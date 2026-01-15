import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { AddCrmSettingsCommand } from 'src/app/core/models/crm-settings/add-crm-settings-command';
import { UpdateCrmSettingsCommand } from 'src/app/core/models/crm-settings/update-crm-settings-command';
import { CrmUserSettings } from 'src/app/core/models/crm-user-settings';
import { NpCityResponse } from 'src/app/core/models/nova-post/np-city-response';
import { NpWarehouse } from 'src/app/core/models/nova-post/np-warehouse';
import { NpWarehouseSelectionComponent } from 'src/app/features/common-components/components/np-warehouse-selection/np-warehouse-selection.component';
import { CrmSettingsService } from 'src/app/features/common-services/crm-settings.service';

@Component({
  selector: 'app-crm-settings',
  templateUrl: './crm-settings.component.html',
  styleUrls: ['./crm-settings.component.scss'],
})
export class CrmSettingsComponent implements OnInit, OnDestroy {
  @ViewChild(NpWarehouseSelectionComponent)
  npWarehouseSelection?: NpWarehouseSelectionComponent;

  public npForm?: FormGroup;

  public initialCity: NpCityResponse | null = null;
  public initialWarehouse: NpWarehouse | null = null;

  public hasSettings = false;
  public settingsId: string | null = null;

  public isSubmitting = false;
  public isNpSyncInProgress = false;

  private _destroy$ = new Subject<void>();

  constructor(private _crmUserSettingsService: CrmSettingsService) {}

  public ngOnInit(): void {
    this.loadSettings();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onNpFormReady(form: FormGroup): void {
    this.npForm = form;
  }

  public get canSaveOrUpdate(): boolean {
    return (
      !!this.npForm &&
      this.npForm.valid &&
      !this.npForm.pristine &&
      !this.isSubmitting &&
      !this.isNpSyncInProgress
    );
  }

  public onSaveOrUpdate(): void {
    if (!this.npForm || this.npForm.invalid) return;

    const city = this.npForm.get('city')?.value as NpCityResponse | null;
    const warehouse = this.npForm.get('warehouse')?.value as NpWarehouse | null;

    if (!city || !warehouse) return;

    this.isSubmitting = true;

    if (!this.hasSettings) {
      // CREATE
      const payload: AddCrmSettingsCommand = {
        userSettings: {
          npCity: { present: city.present, deliveryCity: city.deliveryCity },
          npWarehouseId: warehouse.id,
        },
      };

      this._crmUserSettingsService
        .createCrmSettings(payload)
        .pipe(
          catchError((e) => {
            this.isSubmitting = false;
            return of(null);
          }),
          takeUntil(this._destroy$)
        )
        .subscribe((ok: boolean | null) => {
          if (!ok) {
            this.isSubmitting = false;
            return;
          }
          this.loadSettingsAfterSave();
        });

      return;
    }

    // UPDATE
    const payload: UpdateCrmSettingsCommand = {
      userSettings: {
        id: this.settingsId!,
        npCity: { present: city.present, deliveryCity: city.deliveryCity },
        npWarehouseId: warehouse.id,
      },
    };

    this._crmUserSettingsService
      .updateCrmSettings(payload)
      .pipe(
        catchError((e) => {
          this.isSubmitting = false;
          return of(null);
        }),
        takeUntil(this._destroy$)
      )
      .subscribe((ok: boolean | null) => {
        if (!ok) {
          this.isSubmitting = false;
          return;
        }
        this.loadSettingsAfterSave();
      });
  }

  public onDelete(): void {
    if (!this.settingsId) return;

    this.isSubmitting = true;

    this._crmUserSettingsService
      .deleteCrmSettings(this.settingsId)
      .pipe(
        catchError((e) => {
          this.isSubmitting = false;
          return of(null);
        }),
        takeUntil(this._destroy$)
      )
      .subscribe(() => {
        this.isSubmitting = false;

        this.hasSettings = false;
        this.settingsId = null;
        this.initialCity = null;
        this.initialWarehouse = null;

        this.npWarehouseSelection?.resetToInitial();
      });
  }

  public onReset(): void {
    this.npWarehouseSelection?.resetToInitial();
  }

  public onSyncInProgressChanged(isInProgress: boolean): void {
    this.isNpSyncInProgress = isInProgress;
  }

  private loadSettingsAfterSave(): void {
    this._crmUserSettingsService
      .getCrmSettings()
      .pipe(
        catchError(() => {
          this.isSubmitting = false;
          return of(null);
        }),
        takeUntil(this._destroy$)
      )
      .subscribe((resp: CrmUserSettings | null) => {
        this.isSubmitting = false;
        if (!resp) return;

        this.applyLoadedSettings(resp);
        this.npWarehouseSelection?.resetToInitial();
      });
  }

  private loadSettings(): void {
    this._crmUserSettingsService
      .getCrmSettings()
      .pipe(
        catchError((e) => of(null)),
        takeUntil(this._destroy$)
      )
      .subscribe((resp: CrmUserSettings | null) => {
        if (!resp) return;
        this.applyLoadedSettings(resp);
        this.npWarehouseSelection?.resetToInitial();
      });
  }

  private applyLoadedSettings(resp: CrmUserSettings): void {
    this.hasSettings = !!resp?.id;
    this.settingsId = resp?.id ?? null;

    this.initialCity = resp.npCity ?? null;
    this.initialWarehouse = resp.npWarehouse ?? null;
  }
}
