import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AddEditOrderData } from '../../models/order/add-edit-order-data';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
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
    });
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
}
