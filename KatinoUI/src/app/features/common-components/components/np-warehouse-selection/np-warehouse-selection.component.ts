import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { of, Subject } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import { GetNpCitiesResponse } from 'src/app/core/models/nova-post/get-np-cities-response';
import { NpCityResponse } from 'src/app/core/models/nova-post/np-city-response';
import { NpWarehouse } from 'src/app/core/models/nova-post/np-warehouse';
import { SearchNpWarehouses } from 'src/app/core/models/nova-post/search-np-warehouses';
import { NovaPostService } from 'src/app/features/common-services/nova-post.service';

export interface NpWarehouseSelectionValue {
  city: NpCityResponse | null;
  warehouse: NpWarehouse | null;
}

@Component({
  selector: 'app-np-warehouse-selection',
  templateUrl: './np-warehouse-selection.component.html',
  styleUrls: ['./np-warehouse-selection.component.scss'],
})
export class NpWarehouseSelectionComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() initialCity: NpCityResponse | null = null;
  @Input() initialWarehouse: NpWarehouse | null = null;

  @Output() formReady = new EventEmitter<FormGroup>();
  @Output() valueChanged = new EventEmitter<NpWarehouseSelectionValue>();

  public form: FormGroup = this._builder.group({});
  public npCities?: GetNpCitiesResponse;
  public npWarehouses: NpWarehouse[] = [];

  public isCityOptionSelected = false;
  public isWarehouseOptionSelected = false;

  private _destroy$: Subject<void> = new Subject<void>();

  constructor(
    private _builder: FormBuilder,
    private _novaPostService: NovaPostService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.applyInitialValues();
    this.subscribeOnInputChanges();

    this.formReady.emit(this.form);

    this.form.valueChanges.pipe(takeUntil(this._destroy$)).subscribe(() => {
      this.valueChanged.emit(this.getValue());
    });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.initialCity || changes.initialWarehouse) {
      if (this.form) {
        this.resetToInitial();
      }
    }
  }

  public getValue(): NpWarehouseSelectionValue {
    return {
      city: this.city?.value ?? null,
      warehouse: this.warehouse?.value ?? null,
    };
  }

  public resetToInitial(): void {
    this.isCityOptionSelected = !!this.initialCity;
    this.isWarehouseOptionSelected = !!this.initialWarehouse;

    this.city?.setValue(this.initialCity, { emitEvent: false });

    if (this.initialCity) {
      this.warehouse?.enable({ emitEvent: false });
      this.warehouse?.setValue(this.initialWarehouse, { emitEvent: false });
    } else {
      this.warehouse?.disable({ emitEvent: false });
      this.warehouse?.setValue(null, { emitEvent: false });
    }

    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  public onCityInput(): void {
    this.isCityOptionSelected = false;

    this.resetWarehouse();
    this.warehouse?.disable({ emitEvent: false });
  }

  public onWarehouseInput(): void {
    this.isWarehouseOptionSelected = false;
  }

  public onCityOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedCity = event.option.value as NpCityResponse;

    const prevCityRef = (this.city?.value as NpCityResponse | null)
      ?.deliveryCity;

    this.isCityOptionSelected = true;
    this.city?.setValue(selectedCity, { emitEvent: false });

    if (prevCityRef && prevCityRef !== selectedCity.deliveryCity) {
      this.resetWarehouse();
    }

    this.warehouse?.enable({ emitEvent: false });
    this.form.markAsDirty();
  }

  public onCityBlur(): void {
    if (!this.isCityOptionSelected) {
      this.city?.setValue(null);
      this.city?.markAsTouched();

      this.resetWarehouse();
      this.warehouse?.disable({ emitEvent: false });
    }
  }

  public onWarehouseOptionSelected(event: MatAutocompleteSelectedEvent): void {
    this.isWarehouseOptionSelected = true;
    this.warehouse?.setValue(event.option.value as NpWarehouse, {
      emitEvent: false,
    });
    this.form.markAsDirty();
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

  private initializeForm(): void {
    const mustBeObject = this.mustBeObjectValidator();

    this.form = this._builder.group({
      city: new FormControl(null, [Validators.required, mustBeObject]),
      warehouse: new FormControl({ value: null, disabled: true }, [
        Validators.required,
        mustBeObject,
      ]),
    });
  }

  private mustBeObjectValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = control.value;
      if (v == null) return null;
      return typeof v === 'object' ? null : { mustSelectOption: true };
    };
  }

  private applyInitialValues(): void {
    this.resetToInitial();
  }

  private resetWarehouse(): void {
    this.isWarehouseOptionSelected = false;
    this.npWarehouses = [];
    this.warehouse?.setValue(null, { emitEvent: false });
    this.warehouse?.markAsPristine();
    this.warehouse?.markAsUntouched();
  }

  private subscribeOnInputChanges(): void {
    this.city!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this._destroy$),
      switchMap((value: string | NpCityResponse) => {
        const text = typeof value === 'string' ? value : value?.present ?? '';
        if (!text)
          return of({ addresses: [], totalCount: 0 } as GetNpCitiesResponse);
        return this._novaPostService
          .getNpCities(text)
          .pipe(
            catchError(() =>
              of({ addresses: [], totalCount: 0 } as GetNpCitiesResponse)
            )
          );
      })
    ).subscribe((data) => {
      this.npCities = data;
    });

    this.warehouse!.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this._destroy$),
      filter(() => !!this.city?.value && !this.warehouse?.disabled),
      switchMap((value: string | NpWarehouse) => {
        const text =
          typeof value === 'string' ? value : value?.description ?? '';
        const selectedCity = this.city?.value as NpCityResponse;
        const searchRequest: SearchNpWarehouses = {
          cityRef: selectedCity.deliveryCity,
          searchString: text,
        };
        return this._novaPostService
          .getNpWarehouses(searchRequest)
          .pipe(catchError(() => of([] as NpWarehouse[])));
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
