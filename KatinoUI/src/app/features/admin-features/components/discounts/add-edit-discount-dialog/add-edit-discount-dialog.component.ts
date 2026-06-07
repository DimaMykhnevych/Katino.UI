import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AddEditDiscountData } from '../../../models/add-edit-discount-data';
import { DiscountResponse } from 'src/app/core/models/discount/discount-response';
import { DiscountType } from 'src/app/core/enums/discount-type';
import { DiscountValueType } from 'src/app/core/enums/discount-value-type';
import { AddDiscount } from 'src/app/core/models/discount/add-discount';
import { UpdateDiscount } from 'src/app/core/models/discount/update-discount';
import { CollectionProduct } from 'src/app/core/models/collection/collection-product';
import { DiscountCollection } from 'src/app/core/models/discount/discount-collection';
import { Product } from 'src/app/core/models/product';
import { Collection } from 'src/app/core/models/collection/collections';
import { DiscountService } from 'src/app/features/admin-features/services/discount.service';

@Component({
  selector: 'app-add-edit-discount-dialog',
  templateUrl: './add-edit-discount-dialog.component.html',
  styleUrls: ['./add-edit-discount-dialog.component.scss'],
})
export class AddEditDiscountDialogComponent implements OnInit, OnDestroy {
  public readonly discountType = DiscountType;
  public readonly discountValueType = DiscountValueType;

  public form: FormGroup = this._fb.group({});
  public isSaving = false;

  public selectedProducts: CollectionProduct[] = [];
  public selectedCollections: DiscountCollection[] = [];

  private _destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddEditDiscountData,
    private _fb: FormBuilder,
    private _dialogRef: MatDialogRef<AddEditDiscountDialogComponent>,
    private _discountService: DiscountService,
    private _toastr: ToastrService,
    private _translate: TranslateService,
  ) {}

  public ngOnInit(): void {
    this.initializeForm();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public get name() {
    return this.form.get('name');
  }

  public get type() {
    return this.form.get('type');
  }

  public get valueType() {
    return this.form.get('valueType');
  }

  public get value() {
    return this.form.get('value');
  }

  public get selectedType(): DiscountType {
    return this.type?.value;
  }

  public get isProductSpecific(): boolean {
    return this.selectedType === DiscountType.productSpecific;
  }

  public get isCollection(): boolean {
    return this.selectedType === DiscountType.collection;
  }

  public get isGlobal(): boolean {
    return this.selectedType === DiscountType.global;
  }

  public get isBundle(): boolean {
    return this.selectedType === DiscountType.bundle;
  }

  public onTypeChanged(): void {
    if (!this.data.isAdding) {
      return;
    }

    this.selectedProducts = [];
    this.selectedCollections = [];

    if (this.isBundle) {
      this.valueType?.setValue(this.discountValueType.fixed);
      this.valueType?.disable();
    } else {
      this.valueType?.enable();
    }
  }

  public onProductSelected(product: Product): void {
    if (!this.selectedProducts.find((p) => p.id === product.id)) {
      this.selectedProducts = [
        ...this.selectedProducts,
        { id: product.id, name: product.name },
      ];
    }
  }

  public removeProduct(productId: string): void {
    this.selectedProducts = this.selectedProducts.filter(
      (p) => p.id !== productId,
    );
  }

  public onCollectionSelected(collection: Collection): void {
    if (!this.selectedCollections.find((c) => c.id === collection.id)) {
      this.selectedCollections = [
        ...this.selectedCollections,
        { id: collection.id, name: collection.name },
      ];
    }
  }

  public removeCollection(collectionId: string): void {
    this.selectedCollections = this.selectedCollections.filter(
      (c) => c.id !== collectionId,
    );
  }

  public get isSelectionValid(): boolean {
    if (this.isProductSpecific) {
      return this.selectedProducts.length > 0;
    }
    if (this.isCollection) {
      return this.selectedCollections.length > 0;
    }
    if (this.isBundle) {
      return this.selectedProducts.length >= 2;
    }
    return true;
  }

  public onSubmit(): void {
    if (this.form.invalid || !this.isSelectionValid || this.isSaving) {
      return;
    }

    if (this.data.isAdding) {
      this.addDiscount();
    } else {
      this.updateDiscount();
    }
  }

  public onClose(): void {
    this._dialogRef.close(null);
  }

  private addDiscount(): void {
    const formValue = this.form.getRawValue();
    const discount: AddDiscount = {
      name: formValue.name,
      type: formValue.type,
      valueType: formValue.valueType,
      value: formValue.value,
      isActive: formValue.isActive,
      startDate: formValue.startDate || undefined,
      endDate: formValue.endDate || undefined,
      productIds: this.isProductSpecific
        ? this.selectedProducts.map((p) => p.id)
        : [],
      collectionIds: this.isCollection
        ? this.selectedCollections.map((c) => c.id)
        : [],
      bundleProductIds: this.isBundle
        ? this.selectedProducts.map((p) => p.id)
        : [],
    };

    this.isSaving = true;
    this._discountService
      .addDiscount(discount)
      .pipe(
        catchError(() => this.onCatchError(true)),
        finalize(() => (this.isSaving = false)),
        takeUntil(this._destroy$),
      )
      .subscribe((result: DiscountResponse) => {
        if (result?.id) {
          this._toastr.success(this._t('discounts.toastr.discountCreated'));
          this._dialogRef.close(result);
        }
      });
  }

  private updateDiscount(): void {
    const formValue = this.form.getRawValue();
    const discount: UpdateDiscount = {
      id: this.data.discount!.id,
      name: formValue.name,
      valueType: formValue.valueType,
      value: formValue.value,
      isActive: formValue.isActive,
      startDate: formValue.startDate || undefined,
      endDate: formValue.endDate || undefined,
      productIds: this.isProductSpecific
        ? this.selectedProducts.map((p) => p.id)
        : [],
      collectionIds: this.isCollection
        ? this.selectedCollections.map((c) => c.id)
        : [],
      bundleProductIds: this.isBundle
        ? this.selectedProducts.map((p) => p.id)
        : [],
    };

    this.isSaving = true;
    this._discountService
      .updateDiscount(discount)
      .pipe(
        catchError(() => this.onCatchError(false)),
        finalize(() => (this.isSaving = false)),
        takeUntil(this._destroy$),
      )
      .subscribe((result: DiscountResponse) => {
        if (result?.id) {
          this._toastr.success(this._t('discounts.toastr.discountUpdated'));
          this._dialogRef.close(result);
        }
      });
  }

  private onCatchError(isAdding: boolean): Observable<any> {
    this._toastr.error(
      isAdding
        ? this._t('discounts.toastr.discountCreateFailed')
        : this._t('discounts.toastr.discountUpdateFailed'),
    );
    return of({});
  }

  private initializeForm(): void {
    const discount = this.data.discount;

    this.form = this._fb.group({
      name: [discount?.name || '', [Validators.required]],
      type: [
        {
          value: discount?.type ?? DiscountType.productSpecific,
          disabled: !this.data.isAdding,
        },
        [Validators.required],
      ],
      valueType: [
        {
          value: discount?.valueType ?? DiscountValueType.fixed,
          disabled: discount?.type === DiscountType.bundle,
        },
        [Validators.required],
      ],
      value: [
        discount?.value ?? null,
        [Validators.required, Validators.min(0.01)],
      ],
      isActive: [discount?.isActive ?? true],
      startDate: [discount?.startDate ?? null],
      endDate: [discount?.endDate ?? null],
    });

    if (discount) {
      if (discount.type === DiscountType.bundle) {
        this.selectedProducts = [...discount.bundleProducts];
      } else if (discount.type === DiscountType.productSpecific) {
        this.selectedProducts = [...discount.products];
      }
      if (discount.type === DiscountType.collection) {
        this.selectedCollections = [...discount.collections];
      }
    }
  }

  private _t(key: string): string {
    return this._translate.instant(key);
  }
}
