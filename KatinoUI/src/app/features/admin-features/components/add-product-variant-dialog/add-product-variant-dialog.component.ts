import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AddEditProductVariantData } from '../../models/add-edit-product-variant-data';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductService } from '../../services/product.service';
import { GetProductsResponse } from '../../models/get-products-response';
import { of, Subject, forkJoin } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { DialogService } from 'src/app/features/common-services/dialog.service';
import { AddEditProductData } from '../../models/add-edit-product-data';
import {
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
  public allProductStatuses: ProductStatus[] =
    StatusConstants.allProductStatuses;

  private _destroy$: Subject<void> = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) data: AddEditProductVariantData,
    private _productService: ProductService,
    private _sizeService: SizeService,
    private _colorService: ColorService,
    private _dialogService: DialogService,
    private _builder: FormBuilder,
    private _customTranslateService: CustomTranslateService
  ) {
    this.data = data;
  }

  public ngOnInit(): void {
    this.initializeForm();
    this.loadAllData();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onColorSelectionChange(event: MatSelectChange): void {
    if (!this.data.isAdding) {
      const changedColor = this.colorsResponse?.colors.find(
        (c) => c.id == event.value
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
          (c) => c.id === resp.id
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
          (c) => c.id === resp.id
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
        (color) => color.id === selectedColorId
      ) ?? null
    );
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
        })
      ),
      sizes: this._sizeService.getSizes().pipe(
        catchError((error) => {
          return of({
            sizes: [],
            resultsAmount: 0,
          } as GetSizesResponse);
        })
      ),
      colors: this._colorService.getColors().pipe(
        catchError((error) => {
          return of({
            colors: [],
            resultsAmount: 0,
          } as GetColorsResponse);
        })
      ),
    })
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (responses) => {
          this.productsResponse = responses.products;
          this.sizesResponse = responses.sizes;
          this.colorsResponse = responses.colors;
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
        [Validators.required]
      ),
      sizeId: new FormControl(this.data?.productVariant?.sizeId, [
        Validators.required,
      ]),
      colorId: new FormControl(this.data?.productVariant?.colorId, [
        Validators.required,
      ]),
      status: new FormControl(
        this.data?.productVariant?.status ?? ProductStatus.inStock,
        [Validators.required]
      ),
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
}
