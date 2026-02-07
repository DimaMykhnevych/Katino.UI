import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AddEditOrderData } from '../../models/order/add-edit-order-data';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { DeliveryType } from 'src/app/core/enums/delivery-type';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { NpContactPerson } from 'src/app/core/models/nova-post/np-contact-person';
import { NovaPostService } from 'src/app/features/common-services/nova-post.service';
import { NpWarehouseSelectionValue } from 'src/app/features/common-components/components/np-warehouse-selection/np-warehouse-selection.component';
import { AddOrder } from 'src/app/core/models/order/add-order/add-order';
import { AddOrderAddressInfo } from 'src/app/core/models/order/add-order/add-order-address-info';
import { NpCityResponse } from 'src/app/core/models/nova-post/np-city-response';
import { NpWarehouse } from 'src/app/core/models/nova-post/np-warehouse';

export interface DeliveryTypeOption {
  value: DeliveryType;
  labelKey: string;
}

@Component({
  selector: 'app-add-edit-order-dialog',
  templateUrl: './add-edit-order-dialog.component.html',
  styleUrls: ['./add-edit-order-dialog.component.scss'],
})
export class AddEditOrderDialogComponent implements OnInit, OnDestroy {
  public form: FormGroup = this._builder.group({});

  public data: AddEditOrderData;
  public isUpdatingData: boolean = false;
  public phoneSuggestions: NpContactPerson[] = [];
  public isPhoneOptionSelected = false;
  public isSearchingPhones = false;
  public DeliveryType = DeliveryType;
  public recipientNpSelection: NpWarehouseSelectionValue = {
    city: null,
    warehouse: null,
  };
  public initialRecipientCity: NpCityResponse | null = null;
  public initialRecipientWarehouse: NpWarehouse | null = null;

  public deliveryTypeOptions: DeliveryTypeOption[] = Object.values(DeliveryType)
    .filter((v) => typeof v === 'number')
    .map((v) => ({
      value: v as DeliveryType,
      labelKey: `orders.deliveryType.${DeliveryType[v as DeliveryType]}`,
    }));

  private _destroy$ = new Subject<void>();
  private readonly PHONE_PATTERN = /^380\d{9}$/;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: AddEditOrderData,
    private _builder: FormBuilder,
    private _npService: NovaPostService,
  ) {
    this.data = data;
  }

  public ngOnInit(): void {
    this.initializeForm();
    this.applyInitialRecipientWarehouse();
    this.subscribeOnRecipientPhoneChanges();
    this.subscribeOnDeliveryTypeChanges();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onPhoneOptionSelected(e: MatAutocompleteSelectedEvent): void {
    this.isPhoneOptionSelected = true;

    const selected: NpContactPerson = e.option.value;

    this.recipientPhones!.setValue(selected.phones ?? '', { emitEvent: false });
    this.recipientLastName?.setValue(selected.lastName ?? '', {
      emitEvent: false,
    });
    this.recipientFirstName?.setValue(selected.firstName ?? '', {
      emitEvent: false,
    });
    this.recipientMiddleName?.setValue(selected.middleName ?? '', {
      emitEvent: false,
    });

    this.recipientPhones?.markAsTouched();
    this.recipientLastName?.markAsTouched();
    this.recipientFirstName?.markAsTouched();
    this.recipientMiddleName?.markAsTouched();
  }

  public onPhoneBlur(): void {
    this.recipientPhones?.markAsTouched();
  }

  public onRecipientWarehouseChanged(v: NpWarehouseSelectionValue): void {
    this.recipientNpSelection = v;
  }

  public onAddEditOrderClick(): void {
    const model = this.buildAddOrderModel();
  }

  private buildAddOrderModel(): AddOrder {
    const dt = this.deliveryType!.value as DeliveryType;

    const addressInfo = (this.addressInfoGroup.value ??
      {}) as AddOrderAddressInfo;

    const safeAddressInfo: AddOrderAddressInfo | null =
      dt === DeliveryType.address
        ? {
            recipientAddressNote: addressInfo.recipientAddressNote ?? '',
            recipientCity: addressInfo.recipientCity ?? '',
            recipientAddressName: addressInfo.recipientAddressName ?? '',
            recipientHouse: addressInfo.recipientHouse ?? '',
            recipientFlat: addressInfo.recipientFlat ?? '',
          }
        : null;

    const model: AddOrder = {
      senderNpWarehouseId: '', // TODO
      recipientNpWarehouseId:
        dt === DeliveryType.warehouseOrPost
          ? (this.recipientNpSelection.warehouse?.id ?? undefined)
          : undefined,

      payerType: this.form.value.payerType ?? 0, // TODO
      paymentMethod: this.form.value.paymentMethod ?? 0, // TODO
      saleType: this.form.value.saleType ?? 0, // TODO

      sendUntilDate: this.form.value.sendUntilDate ?? new Date(), // TODO
      weight: this.form.value.weight ?? 0, // TODO
      deliveryType: dt,
      seatsAmount: this.form.value.seatsAmount ?? 1, // TODO
      description: this.form.value.description ?? '',
      cost: this.form.value.cost ?? 0,
      afterpaymentOnGoodsCost:
        this.form.value.afterpaymentOnGoodsCost ?? undefined,

      orderItems: [], // TODO
      orderNpOptionsSeats: [], // TODO

      senderNpCity: this.form.value.senderNpCity, // TODO
      recipientNpCity:
        dt === DeliveryType.warehouseOrPost
          ? (this.recipientNpSelection.city ?? undefined)
          : undefined,
      senderContactPerson: this.form.value.senderContactPerson, // TODO

      orderRecipient: {
        instUrl: this.instUrl?.value,
        npContactPerson: {
          lastName: this.recipientLastName?.value,
          firstName: this.recipientFirstName?.value,
          middleName: this.recipientMiddleName?.value,
          phones: this.recipientPhones?.value,
        },
      },

      addressInfo: safeAddressInfo,
    };

    return model;
  }

  private subscribeOnRecipientPhoneChanges(): void {
    this.recipientPhones!.valueChanges.pipe(
      takeUntil(this._destroy$),
      tap(() => {
        this.isPhoneOptionSelected = false;
      }),
      debounceTime(300),
      distinctUntilChanged(),
      tap((v) => {
        if (!v || v.length < 6) {
          this.phoneSuggestions = [];
        }
      }),
      filter((v) => !!v && v.length >= 6),
      switchMap((phone) => {
        this.isSearchingPhones = true;
        return this._npService.getNpContactPersons(phone).pipe(
          catchError(() => of([] as NpContactPerson[])),
          finalize(() => (this.isSearchingPhones = false)),
        );
      }),
    ).subscribe((results: NpContactPerson[]) => {
      this.phoneSuggestions = results ?? [];
    });
  }

  private subscribeOnDeliveryTypeChanges(): void {
    this.deliveryType!.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntil(this._destroy$),
    ).subscribe((dt: DeliveryType) => {
      const middle = this.recipientMiddleName!;

      if (dt === DeliveryType.warehouseOrPost) {
        middle.clearValidators();
      } else {
        middle.setValidators([Validators.required]);
      }

      middle.updateValueAndValidity({ emitEvent: false });

      if (dt === DeliveryType.address) {
        this.initialRecipientCity = null;
        this.initialRecipientWarehouse = null;
        this.recipientNpSelection = { city: null, warehouse: null };
      }

      if (dt === DeliveryType.warehouseOrPost && this.data?.order) {
        this.applyInitialRecipientWarehouse();
      }

      this.applyDeliveryTypeValidators(dt);
    });
  }

  private initializeForm(): void {
    const currentDeliveryType: DeliveryType =
      this.data?.order?.deliveryType ?? DeliveryType.warehouseOrPost;
    const middleNameValidators =
      currentDeliveryType === DeliveryType.warehouseOrPost
        ? []
        : [Validators.required];

    this.form = this._builder.group({
      deliveryType: new FormControl(currentDeliveryType, [Validators.required]),
      recipientPhones: new FormControl(
        this.data?.order?.orderRecipient?.npContactPerson?.phones,
        [Validators.required, Validators.pattern(this.PHONE_PATTERN)],
      ),
      recipientLastName: new FormControl(
        this.data?.order?.orderRecipient?.npContactPerson?.lastName,
        [Validators.required],
      ),
      recipientFirstName: new FormControl(
        this.data?.order?.orderRecipient?.npContactPerson?.firstName,
        [Validators.required],
      ),
      recipientMiddleName: new FormControl(
        this.data?.order?.orderRecipient?.npContactPerson?.middleName,
        middleNameValidators,
      ),
      instUrl: new FormControl(
        this.data?.order?.orderRecipient?.instUrl ?? '',
        [Validators.required],
      ),
      addressInfo: this._builder.group({
        recipientAddressNote: new FormControl(
          this.data?.order?.addressInfo?.recipientAddressNote ?? '',
        ),
        recipientCity: new FormControl(
          this.data?.order?.addressInfo?.recipientCity ?? '',
        ),
        recipientAddressName: new FormControl(
          this.data?.order?.addressInfo?.recipientAddressName ?? '',
        ),
        recipientHouse: new FormControl(
          this.data?.order?.addressInfo?.recipientHouse ?? '',
        ),
        recipientFlat: new FormControl(
          this.data?.order?.addressInfo?.recipientFlat ?? '',
        ),
      }),
    });

    this.applyDeliveryTypeValidators(this.deliveryType!.value);
  }

  private applyInitialRecipientWarehouse(): void {
    if (!this.data?.order) return;

    this.initialRecipientCity = this.data.order.recipientNpCity ?? null;
    this.initialRecipientWarehouse =
      this.data.order.recipientNpWarehouse ?? null;

    this.recipientNpSelection = {
      city: this.initialRecipientCity,
      warehouse: this.initialRecipientWarehouse,
    };
  }

  private applyDeliveryTypeValidators(dt: DeliveryType): void {
    const g = this.addressInfoGroup;

    const city: AbstractControl = g.get('recipientCity')!;
    const addr: AbstractControl = g.get('recipientAddressName')!;
    const house: AbstractControl = g.get('recipientHouse')!;
    const flat: AbstractControl = g.get('recipientFlat')!;
    const note: AbstractControl = g.get('recipientAddressNote')!;

    if (dt === DeliveryType.address) {
      city.setValidators([Validators.required]);
      addr.setValidators([Validators.required]);
      house.setValidators([Validators.required]);
      flat.setValidators([Validators.required]);
      note.clearValidators();
    } else {
      city.clearValidators();
      addr.clearValidators();
      house.clearValidators();
      flat.clearValidators();
      note.clearValidators();

      g.reset(
        {
          recipientAddressNote: '',
          recipientCity: '',
          recipientAddressName: '',
          recipientHouse: '',
          recipientFlat: '',
        },
        { emitEvent: false },
      );
    }

    city.updateValueAndValidity({ emitEvent: false });
    addr.updateValueAndValidity({ emitEvent: false });
    house.updateValueAndValidity({ emitEvent: false });
    flat.updateValueAndValidity({ emitEvent: false });
    note.updateValueAndValidity({ emitEvent: false });
  }

  get deliveryType() {
    return this.form.get('deliveryType');
  }
  get recipientPhones() {
    return this.form.get('recipientPhones');
  }
  get recipientLastName() {
    return this.form.get('recipientLastName');
  }
  get recipientFirstName() {
    return this.form.get('recipientFirstName');
  }
  get recipientMiddleName() {
    return this.form.get('recipientMiddleName');
  }
  get instUrl() {
    return this.form.get('instUrl');
  }
  get addressInfoGroup(): FormGroup {
    return this.form.get('addressInfo') as FormGroup;
  }
}
