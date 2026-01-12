import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable, of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import { CrmUserSettings } from 'src/app/core/models/crm-user-settings';
import { GetNpCitiesResponse } from 'src/app/core/models/nova-post/get-np-cities-response';
import { NpCityResponse } from 'src/app/core/models/nova-post/np-city-response';
import { NpWarehouse } from 'src/app/core/models/nova-post/np-warehouse';
import { SearchNpWarehouses } from 'src/app/core/models/nova-post/search-np-warehouses';
import { CrmSettingsService } from 'src/app/features/common-services/crm-settings.service';
import { NovaPostService } from 'src/app/features/common-services/nova-post.service';

@Component({
  selector: 'app-np-warehouse-selection',
  templateUrl: './np-warehouse-selection.component.html',
  styleUrls: ['./np-warehouse-selection.component.scss'],
})
export class NpWarehouseSelectionComponent implements OnInit, OnDestroy {
  public form: FormGroup = this._builder.group({});

  public npCity?: NpCityResponse;
  public npWarehouse?: NpWarehouse;
  public isRetrievingData: boolean = false;

  public crmUserSettings?: CrmUserSettings;
  public npCities?: GetNpCitiesResponse;
  public npWarehouses: NpWarehouse[] = [];

  public isCityOptionSelected = false;
  public isWarehouseOptionSelected = false;

  private _destroy$: Subject<void> = new Subject<void>();

  constructor(
    private _builder: FormBuilder,
    private _crmUserSettingsService: CrmSettingsService,
    private _novaPostService: NovaPostService
  ) {}

  public ngOnInit(): void {
    this.initializeForm();
    this.getCrmSettings();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onCityInput(event: Event): void {
    this.isCityOptionSelected = false;
  }

  public onWarehouseInput(event: Event): void {
    this.isWarehouseOptionSelected = false;
  }

  public onCityOptionSelected(event: MatAutocompleteSelectedEvent): void {
    this.isCityOptionSelected = true;
    this.npCity = event.option.value;
  }

  public onCityBlur(): void {
    if (!this.isCityOptionSelected) {
      this.city?.setValue(null);
      this.city?.markAsTouched();
    }
  }

  public onWarehouseBlur(): void {
    if (!this.isWarehouseOptionSelected) {
      this.warehouse?.setValue(null);
      this.warehouse?.markAsTouched();
    }
  }

  public displayCityFn(city: NpCityResponse): string {
    return city && city.present ? city.present : '';
  }

  public displayWarehouseFn(warehouse: NpWarehouse): string {
    return warehouse && warehouse.description ? warehouse.description : '';
  }

  public onWarehouseOptionSelected(event: MatAutocompleteSelectedEvent): void {
    this.isWarehouseOptionSelected = true;
    this.npWarehouse = event.option.value;
  }

  private getCrmSettings(): void {
    this.isRetrievingData = true;
    this._crmUserSettingsService
      .getCrmSettings()
      .pipe(
        catchError((error) => {
          return this.onCatchError(error);
        }),
        takeUntil(this._destroy$)
      )
      .subscribe((resp: CrmUserSettings) => {
        this.crmUserSettings = resp;
        this.npCity = resp.npCity;
        this.npWarehouse = resp.npWarehouse;
        this.isRetrievingData = false;
      });
  }

  private onCatchError(error: any): Observable<any> {
    this.isRetrievingData = false;
    return of({});
  }

  private initializeForm(): void {
    this.form = this._builder.group({
      city: new FormControl(this.npCity?.present, [Validators.required]),
      warehouse: new FormControl(this.npWarehouse?.id, [Validators.required]),
    });

    this.subscribeOnInputChanges();
  }

  private subscribeOnInputChanges(): void {
    this.city!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this._destroy$),
      switchMap((value: string) => this._novaPostService.getNpCities(value))
    ).subscribe((data) => {
      this.npCities = data;
    });

    this.warehouse!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this._destroy$),
      switchMap((value: string) => {
        const searchRequest: SearchNpWarehouses = {
          cityRef: this.npCity!.deliveryCity,
          searchString: value,
        };

        return this._novaPostService.getNpWarehouses(searchRequest);
      })
    ).subscribe((data) => {
      this.npWarehouses = data;
    });
  }

  get city() {
    return this.form.get('city');
  }

  get warehouse() {
    return this.form.get('warehouse');
  }
}
