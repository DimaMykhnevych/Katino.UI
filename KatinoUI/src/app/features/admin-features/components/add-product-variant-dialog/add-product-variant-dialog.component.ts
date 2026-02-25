import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AddEditProductVariantData } from '../../models/add-edit-product-variant-data';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProductService } from '../../services/product.service';
import { GetProductsResponse } from '../../models/get-products-response';
import { of, Subject, forkJoin, Observable } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { DialogService } from 'src/app/features/common-services/dialog.service';
import { AddEditProductData } from '../../models/add-edit-product-data';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Product } from 'src/app/core/models/product';
import { SizeService } from '../../services/size.service';
import { GetSizesResponse } from '../../models/get-sizes-response';
import { Size } from 'src/app/core/models/size';
import { ProductStatus } from 'src/app/core/enums/product-status';
import { StatusConstants } from 'src/app/core/constants/status-constants';
import { ProductStatusMapper } from 'src/app/core/mappers/product-status-mapper';
import { CustomTranslateService } from 'src/app/core/services/custom-translate.service';
import { ColorService } from '../../services/color.service';
import { GetColorsResponse } from '../../models/get-colors-response';
import { AddEditColorData } from '../../models/add-edit-color-data';
import { Color } from 'src/app/core/models/color';
import { MatSelectChange } from '@angular/material/select';
import { ProductVariantService } from '../../services/product-variant.service';
import { GetMeasurementTypesResponse } from '../../models/get-measurement-types-response';
import { MeasurementTypeService } from '../../services/measurement-type.service';
import { MeasurementType } from 'src/app/core/models/measurement-type';
import { AddProductVariantMeasurement } from '../../models/add-product-variant-measurement';
import { AddProductVariant } from '../../models/add-product-variant';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { UpdateProductVariant } from '../../models/update-product-variant';
import { PhotoItem } from '../../models/photo-item';

@Component({
  selector: 'app-add-product-variant-dialog',
  templateUrl: './add-product-variant-dialog.component.html',
  styleUrls: ['./add-product-variant-dialog.component.scss'],
})
export class AddProductVariantDialogComponent implements OnInit, OnDestroy {
  public form: FormGroup = this._builder.group({});

  public data: AddEditProductVariantData;
  public productsResponse?: GetProductsResponse;
  public sizesResponse?: GetSizesResponse;
  public colorsResponse?: GetColorsResponse;
  public isRetrievingData: boolean = false;
  public isUpdatingData: boolean = false;
  public allProductStatuses: ProductStatus[] =
    StatusConstants.allProductStatuses;

  public measurementTypesResponse?: GetMeasurementTypesResponse;

  public photos: PhotoItem[] = [];
  public isUploadingPhoto: boolean = false;
  public maxPhotos: number = 10;
  public maxPhotoSizeMb: number = 25;

  private _destroy$: Subject<void> = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) data: AddEditProductVariantData,
    private _dialogRef: MatDialogRef<AddProductVariantDialogComponent>,
    private _productService: ProductService,
    private _productVariantService: ProductVariantService,
    private _sizeService: SizeService,
    private _colorService: ColorService,
    private _measurementTypeService: MeasurementTypeService,
    private _dialogService: DialogService,
    private _builder: FormBuilder,
    private _customTranslateService: CustomTranslateService,
    private _translate: TranslateService,
    private _toastr: ToastrService,
  ) {
    this.data = data;
  }

  public ngOnInit(): void {
    this.initializeForm();
    this.loadAllData();
    this.loadExistingPhotos();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();

    this.photos
      .filter((p) => !p.isExisting)
      .forEach((p) => URL.revokeObjectURL(p.photoUrl));
  }

  public onColorSelectionChange(event: MatSelectChange): void {
    if (!this.data.isAdding) {
      const changedColor = this.colorsResponse?.colors.find(
        (c) => c.id == event.value,
      );

      this.data.productVariant!.color = changedColor!;
    }
  }

  public onAddEditProduct(isAddingProduct: boolean): void {
    const dialogData: AddEditProductData = {
      product: this.data.productVariant?.product ?? null,
      isAdding: isAddingProduct,
    };
    const dialogRef = this._dialogService.openAddEditProductDialog(dialogData);
    dialogRef.afterClosed().subscribe((resp: Product) => {
      if (!resp?.name) {
        return;
      }

      if (isAddingProduct) {
        this.productsResponse?.products.push(resp);
        this.productId?.setValue(resp.id);
      } else {
        const requiredProduct = this.productsResponse?.products.find(
          (c) => c.id === resp.id,
        );

        if (requiredProduct) {
          requiredProduct.name = resp.name;
          requiredProduct.costPrice = resp.costPrice;
          requiredProduct.wholesalePrice = resp.wholesalePrice;
          requiredProduct.dropPrice = resp.dropPrice;
          requiredProduct.price = resp.price;
          requiredProduct.category = resp.category;
        }

        if (this.data.productVariant?.product) {
          this.data.productVariant.product = resp;
        }
      }
    });
  }

  public onAddEditColor(isAddingColor: boolean): void {
    const dialogData: AddEditColorData = {
      color: this.data.productVariant?.color ?? null,
      isAdding: isAddingColor,
    };

    const dialogRef = this._dialogService.openAddEditColorDialog(dialogData);
    dialogRef.afterClosed().subscribe((resp: Color) => {
      if (!resp?.name) {
        return;
      }

      if (isAddingColor) {
        this.colorsResponse?.colors.push(resp);
        this.colorId?.setValue(resp.id);
      } else {
        const requiredColor = this.colorsResponse?.colors.find(
          (c) => c.id === resp.id,
        );

        if (requiredColor) {
          requiredColor.name = resp.name;
          requiredColor.hexCode = resp.hexCode;
        }

        if (this.data.productVariant?.color) {
          this.data.productVariant.color = resp;
        }
      }
    });
  }

  public onAddSize(): void {
    const dialogRef = this._dialogService.openAddSizeDialog();
    dialogRef.afterClosed().subscribe((resp: Size) => {
      if (!resp?.name) {
        return;
      }

      this.sizesResponse?.sizes.push(resp);
      this.sizeId?.setValue(resp.id);
    });
  }

  public onPhotoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);
    const availableSlots =
      this.maxPhotos - this.photos.filter((p) => !p.markedForDeletion).length;

    if (files.length > availableSlots) {
      this._translate
        .get('validation.maxPhotosReached', { max: this.maxPhotos })
        .subscribe((msg: string) => {
          this._toastr.warning(msg);
        });
      files.splice(availableSlots);
    }

    files.forEach((file) => {
      if (!this.isValidImageFile(file)) {
        this._translate
          .get('validation.invalidImageFormat')
          .subscribe((msg: string) => {
            this._toastr.error(`${file.name}: ${msg}`);
          });
        return;
      }

      try {
        const reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onload = (_event) => {
          const photoItem: PhotoItem = {
            file: file,
            photoUrl: reader.result as string,
            displayOrder: this.photos.length,
            isExisting: false,
          };

          this.photos.push(photoItem);
        };
      } catch (error) {
        this._translate
          .get('validation.failedLoadingImagePreview')
          .subscribe((msg: string) => {
            this._toastr.error(msg);
          });
      }
    });

    input.value = '';
  }

  public onRemovePhoto(index: number): void {
    const photo = this.photos[index];

    if (photo.isExisting) {
      photo.markedForDeletion = true;
    } else {
      URL.revokeObjectURL(photo.photoUrl);
      this.photos.splice(index, 1);
    }

    this.reorderPhotos();
  }

  public onRestorePhoto(index: number): void {
    const photo = this.photos[index];
    const visiblePhotoLength = this.getVisiblePhotos().length;
    if (photo.isExisting && photo.markedForDeletion) {
      if (visiblePhotoLength < this.maxPhotos) {
        photo.markedForDeletion = false;
        return;
      }

      this._translate
        .get('validation.maxPhotosReached', { max: this.maxPhotos })
        .subscribe((msg: string) => {
          this._toastr.warning(msg);
        });
    }
  }

  public getVisiblePhotos(): PhotoItem[] {
    return this.photos.filter((p) => !p.markedForDeletion);
  }

  public canAddMorePhotos(): boolean {
    return this.getVisiblePhotos().length < this.maxPhotos;
  }

  private isValidImageFile(file: File): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
    ];
    const maxSize = this.maxPhotoSizeMb * 1024 * 1024;

    if (
      !validTypes.includes(file.type.toLowerCase()) &&
      !file.name.toLowerCase().endsWith('.heic') &&
      !file.name.toLowerCase().endsWith('.heif')
    ) {
      return false;
    }

    if (file.size > maxSize) {
      this._translate
        .get('validation.fileTooLarge', { max: `${this.maxPhotoSizeMb}MB` })
        .subscribe((msg: string) => {
          this._toastr.error(msg);
        });
      return false;
    }

    return true;
  }

  private loadExistingPhotos(): void {
    if (this.data.productVariant?.photos) {
      this.photos = this.data.productVariant.photos
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((photo) => ({
          id: photo.id,
          photoUrl: photo.photoUrl,
          displayOrder: photo.displayOrder,
          isExisting: true,
          markedForDeletion: false,
        }));
    }
  }

  private reorderPhotos(): void {
    this.photos.forEach((photo, index) => {
      photo.displayOrder = index;
    });
  }

  public onAddEditClick(): void {
    if (this.data.isAdding) {
      this.addProductVariant();
    } else {
      this.updateProductVariant();
    }
  }

  public isFormValid(): boolean {
    return this.form.status !== 'INVALID' && this.form.status !== 'PENDING';
  }

  public getProductStatusDisplayName(productStatus: ProductStatus): string {
    const mapper = new ProductStatusMapper(this._customTranslateService);
    return mapper.convertProductStatusToString(productStatus);
  }

  public getSelectedColor(): Color | null {
    const selectedColorId = this.colorId?.value;

    if (!selectedColorId || !this.colorsResponse?.colors) {
      return null;
    }

    return (
      this.colorsResponse.colors.find(
        (color) => color.id === selectedColorId,
      ) ?? null
    );
  }

  public onQuantityInput() {
    this.checkStatusValidity();
  }

  public onStatusSelectionChange() {
    this.checkStatusValidity();
  }

  private addProductVariant(): void {
    this.isUpdatingData = true;

    const measurements: AddProductVariantMeasurement[] =
      this.measurements.value.map((m: any) => ({
        measurementTypeId: m.measurementTypeId,
        value: m.value,
      }));

    const productVariantData: AddProductVariant = {
      productId: this.productId?.value,
      sizeId: this.sizeId?.value,
      colorId: this.colorId?.value,
      status: this.status?.value,
      quantityInStock: this.quantityInStock?.value,
      quantityDropSold: this.quantityDropSold?.value,
      quantityRegularSold: this.quantityRegularSold?.value,
      article: this.article?.value,
      measurements: measurements,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDrop: false,
    };

    const formData = new FormData();

    formData.append('ProductVariant.ProductId', productVariantData.productId);
    formData.append('ProductVariant.SizeId', productVariantData.sizeId);
    formData.append('ProductVariant.ColorId', productVariantData.colorId);
    formData.append(
      'ProductVariant.Status',
      productVariantData.status.toString(),
    );
    formData.append(
      'ProductVariant.QuantityInStock',
      productVariantData.quantityInStock.toString(),
    );
    formData.append(
      'ProductVariant.QuantityDropSold',
      productVariantData.quantityDropSold.toString(),
    );
    formData.append(
      'ProductVariant.QuantityRegularSold',
      productVariantData.quantityRegularSold.toString(),
    );
    formData.append('ProductVariant.Article', productVariantData.article);
    formData.append(
      'ProductVariant.IsDrop',
      productVariantData.isDrop.toString(),
    );

    measurements.forEach((measurement, index) => {
      formData.append(
        `ProductVariant.Measurements[${index}].MeasurementTypeId`,
        measurement.measurementTypeId,
      );
      formData.append(
        `ProductVariant.Measurements[${index}].Value`,
        measurement.value.toString(),
      );
    });

    const newPhotos = this.photos.filter((p) => !p.isExisting && p.file);
    newPhotos.forEach((photo, _) => {
      formData.append('ProductVariant.Photos', photo.file!, photo.file!.name);
    });

    this._productVariantService
      .addProductVariant(formData)
      .pipe(
        takeUntil(this._destroy$),
        catchError((error) => {
          return this.onCatchUpdateError(true);
        }),
      )
      .subscribe((success: boolean) => {
        if (success === true) {
          this.onProductVariantAdded();
        }
      });
  }

  private updateProductVariant(): void {
    this.isUpdatingData = true;

    const measurements: AddProductVariantMeasurement[] =
      this.measurements.value.map((m: any) => ({
        measurementTypeId: m.measurementTypeId,
        value: m.value,
      }));

    const productVariantData: UpdateProductVariant = {
      id: this.data.productVariant!.id,
      sizeId: this.sizeId?.value,
      colorId: this.colorId?.value,
      status: this.status?.value,
      quantityInStock: this.quantityInStock?.value,
      quantityDropSold: this.quantityDropSold?.value,
      quantityRegularSold: this.quantityRegularSold?.value,
      article: this.article?.value,
      measurements: measurements,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDrop: false,
    };

    const formData = new FormData();

    formData.append('ProductVariant.Id', productVariantData.id);
    formData.append('ProductVariant.SizeId', productVariantData.sizeId);
    formData.append('ProductVariant.ColorId', productVariantData.colorId);
    formData.append(
      'ProductVariant.Status',
      productVariantData.status.toString(),
    );
    formData.append(
      'ProductVariant.QuantityInStock',
      productVariantData.quantityInStock.toString(),
    );
    formData.append(
      'ProductVariant.QuantityDropSold',
      productVariantData.quantityDropSold.toString(),
    );
    formData.append(
      'ProductVariant.QuantityRegularSold',
      productVariantData.quantityRegularSold.toString(),
    );
    formData.append('ProductVariant.Article', productVariantData.article);
    formData.append(
      'ProductVariant.IsDrop',
      productVariantData.isDrop.toString(),
    );

    measurements.forEach((measurement, index) => {
      formData.append(
        `ProductVariant.Measurements[${index}].MeasurementTypeId`,
        measurement.measurementTypeId,
      );
      formData.append(
        `ProductVariant.Measurements[${index}].Value`,
        measurement.value.toString(),
      );
    });

    const newPhotos = this.photos.filter((p) => !p.isExisting && p.file);
    newPhotos.forEach((photo) => {
      formData.append(
        'ProductVariant.NewPhotos',
        photo.file!,
        photo.file!.name,
      );
    });

    const photosToDelete = this.photos
      .filter((p) => p.isExisting && p.markedForDeletion && p.id)
      .map((p) => p.id!);

    if (photosToDelete.length > 0) {
      photosToDelete.forEach((photoId, index) => {
        formData.append(`ProductVariant.PhotoIdsToDelete[${index}]`, photoId);
      });
    }

    this._productVariantService
      .updateProductVariant(formData)
      .pipe(
        catchError((error) => {
          return this.onCatchUpdateError(false);
        }),
      )
      .subscribe((success: boolean) => {
        if (success === true) {
          this.onProductVariantUpdated();
        }
      });
  }

  private onProductVariantAdded(): void {
    this.isUpdatingData = false;

    this._translate
      .get('toastrs.productVariantAdded')
      .subscribe((resp: string) => {
        this.showSuccess(resp);
      });

    this._dialogRef.close();
  }

  private onProductVariantUpdated(): void {
    this.isUpdatingData = false;

    this._translate
      .get('toastrs.productVariantUpdated')
      .subscribe((resp: string) => {
        this.showSuccess(resp);
      });

    this._dialogRef.close();
  }

  private onCatchUpdateError(isAddingError: boolean): Observable<any> {
    this.isUpdatingData = false;

    if (isAddingError) {
      this._translate
        .get('toastrs.productVariantAddedError')
        .subscribe((resp: string) => {
          this.showError(resp);
        });
    } else {
      this._translate
        .get('toastrs.productVariantUpdatedError')
        .subscribe((resp: string) => {
          this.showError(resp);
        });
    }

    return of({});
  }

  private showSuccess(text: string): void {
    this._toastr.success(`${text}`);
  }

  private showError(text: string): void {
    this._toastr.error(`${text}`);
  }

  private checkStatusValidity(): void {
    if (
      this.quantityInStock?.value <= 0 &&
      this.status?.value === ProductStatus.inStock
    ) {
      this.status.markAsTouched();
      this.status.setErrors({ invalidInStockStatus: true });
    } else if (
      this.quantityInStock?.value > 0 &&
      this.status?.value === ProductStatus.onOrder
    ) {
      this.status.markAsTouched();
      this.status.setErrors({ invalidInStockStatus: true });
    } else {
      this.status?.markAsUntouched();
      this.status?.setErrors(null);
    }
  }

  private loadAllData(): void {
    this.isRetrievingData = true;

    forkJoin({
      products: this._productService.getProducts().pipe(
        catchError((error) => {
          return of({
            products: [],
            resultsAmount: 0,
          } as GetProductsResponse);
        }),
      ),
      sizes: this._sizeService.getSizes().pipe(
        catchError((error) => {
          return of({
            sizes: [],
            resultsAmount: 0,
          } as GetSizesResponse);
        }),
      ),
      colors: this._colorService.getColors().pipe(
        catchError((error) => {
          return of({
            colors: [],
            resultsAmount: 0,
          } as GetColorsResponse);
        }),
      ),
      article: this.data.isAdding
        ? this._productVariantService.getGeneratedArticle().pipe(
            catchError((error) => {
              return of(null);
            }),
          )
        : of(null),
      measurementTypes: this._measurementTypeService.getMeasurementTypes().pipe(
        catchError((error) => {
          return of({
            measurementTypes: [],
            resultsAmount: 0,
          } as GetMeasurementTypesResponse);
        }),
      ),
    })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (responses) => {
          this.productsResponse = responses.products;
          this.sizesResponse = responses.sizes;
          this.colorsResponse = responses.colors;
          this.measurementTypesResponse = responses.measurementTypes;

          if (responses.article !== null) {
            this.article?.setValue(responses.article);
          }

          this.initializeMeasurements();

          this.isRetrievingData = false;
        },
        error: (error) => {
          console.error('Error loading data:', error);
          this.isRetrievingData = false;
        },
      });
  }

  private initializeForm(): void {
    this.form = this._builder.group({
      productId: new FormControl(
        {
          value: this.data?.productVariant?.productId,
          disabled: !this.data?.isAdding,
        },
        [Validators.required],
      ),
      sizeId: new FormControl(this.data?.productVariant?.sizeId, [
        Validators.required,
      ]),
      colorId: new FormControl(this.data?.productVariant?.colorId, [
        Validators.required,
      ]),
      status: new FormControl(
        this.data?.productVariant?.status ?? ProductStatus.inStock,
        [Validators.required],
      ),
      quantityInStock: new FormControl(
        this.data?.productVariant?.quantityInStock ?? 1,
        [Validators.required],
      ),
      quantityDropSold: new FormControl(
        this.data?.productVariant?.quantityDropSold ?? 0,
        [Validators.required],
      ),
      quantityRegularSold: new FormControl(
        this.data?.productVariant?.quantityRegularSold ?? 0,
        [Validators.required],
      ),
      article: new FormControl(
        {
          value: this.data?.productVariant?.article,
          disabled: true,
        },
        [Validators.required],
      ),
      measurements: this._builder.array([]),
    });
  }

  private initializeMeasurements(): void {
    const measurementsArray = this.measurements;
    measurementsArray.clear();

    this.measurementTypesResponse?.measurementTypes.forEach((type) => {
      const existingMeasurement = this.data?.productVariant?.measurements?.find(
        (m) => m.measurementTypeId === type.id,
      );

      const measurementGroup = this._builder.group({
        measurementTypeId: new FormControl(type.id, [Validators.required]),
        value: new FormControl(existingMeasurement?.value ?? ''),
      });

      measurementsArray.push(measurementGroup);
    });
  }

  get productId() {
    return this.form.get('productId');
  }

  get sizeId() {
    return this.form.get('sizeId');
  }

  get colorId() {
    return this.form.get('colorId');
  }

  get status() {
    return this.form.get('status');
  }

  get quantityInStock() {
    return this.form.get('quantityInStock');
  }

  get quantityDropSold() {
    return this.form.get('quantityDropSold');
  }

  get quantityRegularSold() {
    return this.form.get('quantityRegularSold');
  }

  get article() {
    return this.form.get('article');
  }

  get measurements(): FormArray {
    return this.form.get('measurements') as FormArray;
  }

  public getMeasurementGroup(index: number): FormGroup {
    return this.measurements.at(index) as FormGroup;
  }

  public getMeasurementType(index: number): MeasurementType | undefined {
    return this.measurementTypesResponse?.measurementTypes[index];
  }

  public getMeasurementValueControl(index: number): FormControl {
    return this.getMeasurementGroup(index).get('value') as FormControl;
  }
}
