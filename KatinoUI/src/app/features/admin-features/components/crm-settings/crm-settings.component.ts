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
import { NovaPostService } from 'src/app/features/common-services/nova-post.service';
import { NpApiKey } from 'src/app/core/models/nova-post/np-api-key';
import { CurrentUserService } from 'src/app/core/permission/services';
import { Roles } from 'src/app/core/models/roles';

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

  // The NP API key (sender) is a global setting, only the Owner selects it
  public isOwner = false;
  public npApiKeys: NpApiKey[] = [];
  public selectedNpApiKeyId: string | null = null;
  public initialNpApiKeyId: string | null = null;

  private _destroy$ = new Subject<void>();

  constructor(
    private _crmUserSettingsService: CrmSettingsService,
    private _novaPostService: NovaPostService,
    private _currentUserService: CurrentUserService,
  ) {}

  public ngOnInit(): void {
    this.isOwner = this._currentUserService.userInfo?.role === Roles.Owner;
    if (this.isOwner) {
      this.loadNpApiKeys();
    }

    this.loadSettings();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onNpFormReady(form: FormGroup): void {
    this.npForm = form;
  }

  public get isNpApiKeyChanged(): boolean {
    return this.isOwner && this.selectedNpApiKeyId !== this.initialNpApiKeyId;
  }

  public get canSaveOrUpdate(): boolean {
    return (
      !!this.npForm &&
      this.npForm.valid &&
      (!this.npForm.pristine || this.isNpApiKeyChanged) &&
      (!this.isOwner || !!this.selectedNpApiKeyId) &&
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
      const payload: AddCrmSettingsCommand = {
        userSettings: {
          npCity: { present: city.present, deliveryCity: city.deliveryCity },
          npWarehouseId: warehouse.id,
          selectedNpApiKeyId: this.isOwner ? this.selectedNpApiKeyId : null,
        },
      };

      this._crmUserSettingsService
        .createCrmSettings(payload)
        .pipe(
          catchError(() => {
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

    const payload: UpdateCrmSettingsCommand = {
      userSettings: {
        id: this.settingsId!,
        npCity: { present: city.present, deliveryCity: city.deliveryCity },
        npWarehouseId: warehouse.id,
        selectedNpApiKeyId: this.isOwner ? this.selectedNpApiKeyId : null,
      },
    };

    this._crmUserSettingsService
      .updateCrmSettings(payload)
      .pipe(
        catchError(() => {
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
        catchError(() => {
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
        // The selected NP API key lives on the deleted settings row, so it is gone as well
        this.initialNpApiKeyId = null;
        this.selectedNpApiKeyId = null;

        this.npWarehouseSelection?.resetToInitial();
      });
  }

  public onReset(): void {
    this.npWarehouseSelection?.resetToInitial();
    this.selectedNpApiKeyId = this.initialNpApiKeyId;
  }

  public onSyncInProgressChanged(isInProgress: boolean): void {
    this.isNpSyncInProgress = isInProgress;
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private loadNpApiKeys(): void {
    this._novaPostService
      .getNpApiKeys()
      .pipe(
        catchError(() => of([] as NpApiKey[])),
        takeUntil(this._destroy$)
      )
      .subscribe((keys: NpApiKey[]) => (this.npApiKeys = keys));
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
        catchError(() => of(null)),
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

    this.initialNpApiKeyId = resp.selectedNpApiKeyId ?? null;
    this.selectedNpApiKeyId = this.initialNpApiKeyId;
  }
}
