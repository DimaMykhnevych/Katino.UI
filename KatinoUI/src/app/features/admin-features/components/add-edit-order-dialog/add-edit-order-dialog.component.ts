import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AddEditOrderData } from '../../models/order/add-edit-order-data';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { DeliveryType } from 'src/app/core/enums/delivery-type';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { EMPTY, Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  switchMap,
  take,
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
import { ProductVariant } from 'src/app/core/models/product-variant';
import { ProductVariantService } from '../../services/product-variant.service';
import { SaleType } from 'src/app/core/enums/sale-type';
import { PayerType } from 'src/app/core/enums/payer-type';
import { PaymentMethod } from 'src/app/core/enums/payment-method';
import { FormValidators } from 'src/app/core/validators/form-validators';
import { CrmSettingsService } from 'src/app/features/common-services/crm-settings.service';
import { OrderService } from 'src/app/features/common-services/order.service';
import { ToastrService } from 'ngx-toastr';
import { ProductStatus } from 'src/app/core/enums/product-status';
import { TranslateService } from '@ngx-translate/core';
import { CrmUserSettings } from 'src/app/core/models/crm-user-settings';
import { UpdateOrder } from 'src/app/core/models/order/update-order/update-order';

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
  public readonly PREPAYMENT_AMOUNT = 200;
  public form: FormGroup = this._builder.group({});
  public seatWeightOptions = [2, 4, 10];

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
  public productSearchCtrl = new FormControl('');
  public productVariants: ProductVariant[] = [];
  public isSearchingProducts = false;
  public SaleType = SaleType;

  public deliveryTypeOptions: DeliveryTypeOption[] = Object.values(DeliveryType)
    .filter((v) => typeof v === 'number')
    .map((v) => ({
      value: v as DeliveryType,
      labelKey: `orders.deliveryType.${DeliveryType[v as DeliveryType]}`,
    }));

  private _destroy$ = new Subject<void>();
  private _costManuallyEdited = false;
  private _afterpaymentManuallyEdited = false;
  private readonly PHONE_PATTERN = /^380\d{9}$/;
  private readonly DEFAULT_DESCRIPTION = 'Одяг KATINO';
  private readonly SEAT_DEFAULTS: Record<
    number,
    { l: number; w: number; h: number }
  > = {
    2: { l: 33, w: 23, h: 10 },
    4: { l: 40, w: 20, h: 20 },
    10: { l: 50, w: 50, h: 16 },
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) data: AddEditOrderData,
    private _builder: FormBuilder,
    private _npService: NovaPostService,
    private _productVariantService: ProductVariantService,
    private _crmSettingsService: CrmSettingsService,
    private _orderService: OrderService,
    private _toastr: ToastrService,
    private _dialogRef: MatDialogRef<AddEditOrderDialogComponent>,
    private _translate: TranslateService,
  ) {
    this.data = data;
  }

  public ngOnInit(): void {
    this.initializeForm();
    this.applyInitialRecipientWarehouse();
    this.populateOrderItemsFromExistingOrder();
    this.subscribeOnRecipientPhoneChanges();
    this.subscribeOnDeliveryTypeChanges();
    this.subscribeOnProductSearch();
    this.subscribeOnPricingChanges();
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

  public displayProductVariant = (pv: ProductVariant): string =>
    pv ? `${pv.product.name} • ${pv.color.name} • ${pv.size.name}` : '';

  public onProductSelected(pv: ProductVariant): void {
    this.orderItems.push(
      this._builder.group({
        productVariantId: [pv.id, Validators.required],
        productVariant: [pv],
        isCustomTailoring: [false],
        comment: [''],
        quantity: [1, [Validators.required, Validators.min(1)]],
      }),
    );

    this.productSearchCtrl.setValue('');
    this.productVariants = [];
  }

  public isFormValid(): boolean {
    if (!this.form) return false;
    if (this.form.invalid) return false;
    if (!this.orderItems || this.orderItems.length === 0) return false;
    if (this.deliveryType?.value === DeliveryType.warehouseOrPost) {
      if (
        !this.recipientNpSelection?.city ||
        !this.recipientNpSelection?.warehouse
      ) {
        return false;
      }
    }

    return true;
  }

  public onAddEditOrderClick(): void {
    if (!this.isFormValid() || this.isUpdatingData) return;

    if (this.hasDiscontinuedItems()) {
      this._toastr.error(
        this.data?.isAdding
          ? this._t('orders.toastr.discontinuedErrorAdd')
          : this._t('orders.toastr.discontinuedErrorUpdate'),
      );
      return;
    }

    this.isUpdatingData = true;

    this._crmSettingsService
      .getCrmSettings()
      .pipe(
        take(1),
        switchMap((settings: CrmUserSettings) => {
          const hasSettings =
            !!settings?.npCity &&
            !!settings?.npWarehouse &&
            !!settings?.npWarehouse?.id;

          if (!hasSettings) {
            this._toastr.warning(this._t('orders.toastr.settingsRequired'));
            return EMPTY;
          }

          return this._npService.getSenderContactPersons().pipe(
            take(1),
            switchMap((persons: NpContactPerson[]) => {
              if (!persons || persons.length === 0) {
                this._toastr.error(
                  this._t('orders.toastr.senderContactMissing'),
                );
                return EMPTY;
              }

              const senderContactPerson = persons[0];

              if (this.data?.isAdding) {
                const model = this.buildAddOrderModel(
                  settings,
                  senderContactPerson,
                );
                return this._orderService.addOrder(model);
              }

              const model = this.buildUpdateOrderModel(
                settings,
                senderContactPerson,
              );
              return this._orderService.updateOrder(model);
            }),
          );
        }),
        catchError(() => {
          this._toastr.error(this._t('common.somethingWentWrong'));
          return EMPTY;
        }),
        finalize(() => (this.isUpdatingData = false)),
      )
      .subscribe((res: any) => {
        const isAdd = !!this.data?.isAdding;

        const orderOk = isAdd
          ? res?.orderAddedSuccessfully
          : res?.orderUpdatedSuccessfully;
        const docOk = isAdd
          ? res?.npInternetDocCreatedSuccessfully
          : res?.npInternetDocUpdatedSuccessfully;

        if (!orderOk) {
          this._toastr.error(this._t('orders.toastr.saveFailed'));
          return;
        }

        if (docOk === false) {
          this._toastr.warning(
            isAdd
              ? this._t('orders.toastr.docNotCreated')
              : this._t('orders.toastr.docNotUpdated'),
          );
        } else {
          this._toastr.success(this._t('orders.toastr.saveSuccess'));
        }

        this._dialogRef.close(true);
      });
  }

  private hasDiscontinuedItems(): boolean {
    const groups = this.orderItems.controls as FormGroup[];
    return groups.some((g) => {
      const pv = g.get('productVariant')?.value;
      return pv?.status === ProductStatus.discontinued;
    });
  }

  private buildAddOrderModel(
    settings: CrmUserSettings,
    senderContactPerson: NpContactPerson,
  ): AddOrder {
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
      senderNpWarehouseId: settings.npWarehouse.id,
      recipientNpWarehouseId:
        dt === DeliveryType.warehouseOrPost
          ? (this.recipientNpSelection.warehouse?.id ?? undefined)
          : undefined,

      payerType: PayerType.recipient,
      paymentMethod: PaymentMethod.cash,
      saleType: (this.saleType?.enabled
        ? this.saleType.value
        : this.data?.order?.saleType) as SaleType,

      sendUntilDate: this.asLocalNoon(this.form.value.sendUntilDate),
      weight: Number(this.seatGroup.get('weight')?.value ?? 2),
      deliveryType: dt,
      seatsAmount: 1,
      description: this.form.value.description ?? '',
      cost: Number(this.cost?.value ?? 0),
      afterpaymentOnGoodsCost:
        this.isPrepayment?.value === true
          ? Number(this.afterpaymentOnGoodsCost?.value ?? 0)
          : undefined,

      orderItems: this.orderItems.controls.map((c) => ({
        productVariantId: c.value.productVariantId,
        isCustomTailoring: c.value.isCustomTailoring,
        comment: c.value.comment,
        quantity: c.value.quantity,
      })),

      orderNpOptionsSeats: [
        {
          npOptionsSeat: {
            volumetricWidth: Number(
              this.seatGroup.get('volumetricWidth')?.value ?? 0,
            ),
            volumetricLength: Number(
              this.seatGroup.get('volumetricLength')?.value ?? 0,
            ),
            volumetricHeight: Number(
              this.seatGroup.get('volumetricHeight')?.value ?? 0,
            ),
            weight: Number(this.seatGroup.get('weight')?.value ?? 0),
          },
        },
      ],

      senderNpCity: settings.npCity,
      recipientNpCity:
        dt === DeliveryType.warehouseOrPost
          ? (this.recipientNpSelection.city ?? undefined)
          : undefined,
      senderContactPerson: senderContactPerson,

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

  private buildUpdateOrderModel(
    settings: CrmUserSettings,
    senderContactPerson: NpContactPerson,
  ): UpdateOrder {
    const dt = this.deliveryType!.value as DeliveryType;

    const existingOrder = this.data?.order!;
    const existingAddressId = existingOrder?.addressInfo?.id ?? null;

    return {
      id: existingOrder.id,

      senderNpWarehouseId: settings.npWarehouse.id,
      recipientNpWarehouseId:
        dt === DeliveryType.warehouseOrPost
          ? (this.recipientNpSelection.warehouse?.id ?? undefined)
          : undefined,

      payerType: PayerType.recipient,
      paymentMethod: PaymentMethod.cash,
      saleType: existingOrder.saleType,

      sendUntilDate: this.form.value.sendUntilDate,
      weight: Number(this.seatGroup.get('weight')?.value ?? 2),
      deliveryType: dt,
      seatsAmount: 1,
      description: this.form.value.description ?? '',
      cost: Number(this.cost?.value ?? 0),
      afterpaymentOnGoodsCost:
        this.isPrepayment?.value === true
          ? Number(this.afterpaymentOnGoodsCost?.value ?? 0)
          : undefined,

      orderItems: (this.orderItems.controls as FormGroup[]).map((g) => ({
        id: g.value.id,
        isCustomTailoring: !!g.value.isCustomTailoring,
        comment: g.value.comment ?? '',
        quantity: Number(g.value.quantity ?? 0),
        productVariantId: g.value.productVariantId,
      })),

      orderNpOptionsSeats: [
        {
          npOptionsSeat: {
            volumetricWidth: Number(
              this.seatGroup.get('volumetricWidth')?.value ?? 0,
            ),
            volumetricLength: Number(
              this.seatGroup.get('volumetricLength')?.value ?? 0,
            ),
            volumetricHeight: Number(
              this.seatGroup.get('volumetricHeight')?.value ?? 0,
            ),
            weight: Number(this.seatGroup.get('weight')?.value ?? 0),
          },
        },
      ],

      senderNpCity: settings.npCity,
      recipientNpCity:
        dt === DeliveryType.warehouseOrPost
          ? (this.recipientNpSelection.city ?? undefined)
          : undefined,
      senderContactPerson: senderContactPerson,

      orderRecipient: {
        instUrl: this.form.value.instUrl,
        npContactPerson: {
          lastName: this.form.value.recipientLastName,
          firstName: this.form.value.recipientFirstName,
          middleName: this.form.value.recipientMiddleName,
          phones: this.form.value.recipientPhones,
        },
      },

      addressInfo:
        dt === DeliveryType.address
          ? {
              id: existingAddressId!,
              recipientAddressNote:
                this.addressInfoGroup.value.recipientAddressNote ?? '',
              recipientCity: this.addressInfoGroup.value.recipientCity ?? '',
              recipientAddressName:
                this.addressInfoGroup.value.recipientAddressName ?? '',
              recipientHouse: this.addressInfoGroup.value.recipientHouse ?? '',
              recipientFlat: this.addressInfoGroup.value.recipientFlat ?? '',
            }
          : null,
    };
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

  private subscribeOnProductSearch(): void {
    this.productSearchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((v) => typeof v === 'string' && v.length >= 2),
        tap(() => (this.isSearchingProducts = true)),
        switchMap((value: string) =>
          this._productVariantService
            .getProductVariants({
              productName: value,
            })
            .pipe(
              catchError(() => of({ productVariants: [], resultsAmount: 0 })),
            ),
        ),
        takeUntil(this._destroy$),
      )
      .subscribe((resp) => {
        this.productVariants = resp.productVariants;
        this.isSearchingProducts = false;
      });
  }

  private subscribeOnPricingChanges(): void {
    this.cost!.valueChanges.pipe(
      takeUntil(this._destroy$),
      distinctUntilChanged(),
    ).subscribe(() => {
      if (this.cost?.dirty) {
        this._costManuallyEdited = true;
      }

      this.recalculateAfterpaymentIfNeeded(false);
    });

    this.afterpaymentOnGoodsCost!.valueChanges.pipe(
      takeUntil(this._destroy$),
      distinctUntilChanged(),
    ).subscribe(() => {
      if (this.afterpaymentOnGoodsCost?.dirty)
        this._afterpaymentManuallyEdited = true;
    });

    this.saleType!.valueChanges.pipe(
      takeUntil(this._destroy$),
      distinctUntilChanged(),
    ).subscribe(() => {
      this.recalculateCostIfNeeded(false);
      this.recalculateAfterpaymentIfNeeded(false);
    });

    this.isPrepayment!.valueChanges.pipe(
      takeUntil(this._destroy$),
      distinctUntilChanged(),
    ).subscribe((v: boolean) => {
      this._afterpaymentManuallyEdited = false;
      this.applyPrepaymentValidators(v);
      this.recalculateAfterpaymentIfNeeded(true);
    });

    this.orderItems.valueChanges
      .pipe(takeUntil(this._destroy$), debounceTime(150))
      .subscribe(() => {
        this.recalculateCostIfNeeded(false);
        this.recalculateAfterpaymentIfNeeded(false);
      });
  }

  private initializeForm(): void {
    const currentDeliveryType: DeliveryType =
      this.data?.order?.deliveryType ?? DeliveryType.warehouseOrPost;
    const middleNameValidators =
      currentDeliveryType === DeliveryType.warehouseOrPost
        ? []
        : [Validators.required];

    const existingSeat = this.data?.order?.orderNpOptionsSeats?.[0];

    const initialSeatWeight = existingSeat?.weight ?? 2;
    const initialSeatLength =
      existingSeat?.volumetricLength ??
      this.SEAT_DEFAULTS[initialSeatWeight]?.l ??
      33;
    const initialSeatWidth =
      existingSeat?.volumetricWidth ??
      this.SEAT_DEFAULTS[initialSeatWeight]?.w ??
      23;
    const initialSeatHeight =
      existingSeat?.volumetricHeight ??
      this.SEAT_DEFAULTS[initialSeatWeight]?.h ??
      10;

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
      orderItems: this._builder.array([]),
      saleType: new FormControl(this.data?.order?.saleType ?? SaleType.retail, [
        Validators.required,
      ]),
      cost: new FormControl(this.data?.order?.cost ?? 0, [
        Validators.required,
        Validators.min(1),
      ]),
      isPrepayment: new FormControl(
        !!this.data?.order?.afterpaymentOnGoodsCost,
      ),
      afterpaymentOnGoodsCost: new FormControl(
        this.data?.order?.afterpaymentOnGoodsCost ?? null,
      ),
      seat: this._builder.group({
        weight: new FormControl(initialSeatWeight, [Validators.required]),
        volumetricLength: new FormControl(initialSeatLength, [
          Validators.required,
          Validators.min(1),
        ]),
        volumetricWidth: new FormControl(initialSeatWidth, [
          Validators.required,
          Validators.min(1),
        ]),
        volumetricHeight: new FormControl(initialSeatHeight, [
          Validators.required,
          Validators.min(1),
        ]),
      }),
      sendUntilDate: new FormControl(this.data?.order?.sendUntilDate ?? null, [
        Validators.required,
        FormValidators.notInPastDateValidator(),
      ]),
      description: new FormControl(
        this.data?.order?.description ?? this.DEFAULT_DESCRIPTION,
      ),
    });

    if (!this.data?.isAdding) {
      this.saleType?.disable({ emitEvent: false });
    }

    this.applyPrepaymentValidators(this.isPrepayment?.value === true);

    this.applyDeliveryTypeValidators(this.deliveryType!.value);

    if (this.data?.isAdding) {
      this.applySeatDefaults(this.seatGroup.get('weight')!.value);
    }
    this.subscribeOnSeatWeightChanges();
  }

  private subscribeOnSeatWeightChanges(): void {
    this.seatGroup
      .get('weight')!
      .valueChanges.pipe(distinctUntilChanged(), takeUntil(this._destroy$))
      .subscribe((w: number) => this.applySeatDefaults(Number(w)));
  }

  private applySeatDefaults(weight: number): void {
    const preset = this.SEAT_DEFAULTS[weight] ?? this.SEAT_DEFAULTS[2];

    this.seatGroup.patchValue(
      {
        volumetricLength: preset.l,
        volumetricWidth: preset.w,
        volumetricHeight: preset.h,
      },
      { emitEvent: false },
    );

    this.seatGroup.get('volumetricLength')?.markAsPristine();
    this.seatGroup.get('volumetricWidth')?.markAsPristine();
    this.seatGroup.get('volumetricHeight')?.markAsPristine();
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

  private populateOrderItemsFromExistingOrder(): void {
    if (!this.data?.order?.orderItems?.length) {
      return;
    }

    while (this.orderItems.length) {
      this.orderItems.removeAt(0);
    }

    for (const oi of this.data.order.orderItems) {
      this.orderItems.push(
        this._builder.group({
          id: [oi.id],
          productVariantId: [oi.productVariantId, Validators.required],
          productVariant: [oi.productVariant],
          isCustomTailoring: [oi.isCustomTailoring],
          comment: [oi.comment ?? ''],
          quantity: [
            oi.quantity ?? 1,
            [Validators.required, Validators.min(1)],
          ],
        }),
      );
    }
  }

  private getUnitPriceBySaleType(
    pv: ProductVariant,
    saleType: SaleType,
  ): number {
    const p = pv?.product;
    if (!p) return 0;

    switch (saleType) {
      case SaleType.drop:
        return Number(p.dropPrice ?? 0);
      case SaleType.wholesale:
        return Number(p.wholesalePrice ?? 0);
      case SaleType.retail:
      default:
        return Number(p.price ?? 0);
    }
  }

  private computeAutoCost(): number {
    const saleType = (
      this.saleType?.enabled
        ? this.saleType.value
        : (this.data?.order?.saleType ?? SaleType.retail)
    ) as SaleType;

    let total = 0;

    for (const ctrl of this.orderItems.controls as FormGroup[]) {
      const qty = Number(ctrl.get('quantity')?.value ?? 0);
      const pv = ctrl.get('productVariant')?.value;

      if (!pv || qty <= 0) continue;

      total += this.getUnitPriceBySaleType(pv, saleType) * qty;
    }

    return Math.round(total);
  }

  private recalculateCostIfNeeded(force: boolean): void {
    if (!force && this._costManuallyEdited) {
      return;
    }

    const autoCost = this.computeAutoCost();

    this.cost?.setValue(autoCost, { emitEvent: false });
    this.cost?.markAsPristine();
  }

  private applyPrepaymentValidators(isPrepayment: boolean): void {
    const ctrl = this.afterpaymentOnGoodsCost!;

    if (isPrepayment) {
      ctrl.setValidators([Validators.required, Validators.min(1)]);
    } else {
      ctrl.clearValidators();
      ctrl.setValue(null, { emitEvent: false });
      ctrl.markAsPristine();
      this._afterpaymentManuallyEdited = false;
    }

    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  private recalculateAfterpaymentIfNeeded(force: boolean): void {
    if (this.isPrepayment?.value !== true) {
      return;
    }

    if (!force && this._afterpaymentManuallyEdited) {
      return;
    }

    const cost = Number(this.cost?.value ?? 0);
    const v = Math.max(cost - this.PREPAYMENT_AMOUNT, 0);

    this.afterpaymentOnGoodsCost?.setValue(v, { emitEvent: false });
    this.afterpaymentOnGoodsCost?.markAsPristine();
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

  private _t(key: string): string {
    return this._translate.instant(key);
  }

  private asLocalNoon(d: Date): Date {
    const x = new Date(d);
    x.setHours(12, 0, 0, 0);
    return x;
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

  get orderItems(): FormArray {
    return this.form.get('orderItems') as FormArray;
  }

  get orderItemGroups(): FormGroup[] {
    return this.orderItems.controls as FormGroup[];
  }

  get saleType() {
    return this.form.get('saleType');
  }
  get cost() {
    return this.form.get('cost');
  }
  get isPrepayment() {
    return this.form.get('isPrepayment');
  }
  get afterpaymentOnGoodsCost() {
    return this.form.get('afterpaymentOnGoodsCost');
  }
  get seatGroup(): FormGroup {
    return this.form.get('seat') as FormGroup;
  }

  get sendUntilDate() {
    return this.form.get('sendUntilDate');
  }
  get description() {
    return this.form.get('description');
  }
}
