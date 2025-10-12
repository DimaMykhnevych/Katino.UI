import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AddEditProductVariantData } from '../../models/add-edit-product-variant-data';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductService } from '../../services/product.service';
import { GetProductsResponse } from '../../models/get-products-response';
import { Observable, of, Subject } from 'rxjs';
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

@Component({
  selector: 'app-add-product-variant-dialog',
  templateUrl: './add-product-variant-dialog.component.html',
  styleUrls: ['./add-product-variant-dialog.component.scss'],
})
export class AddProductVariantDialogComponent implements OnInit, OnDestroy {
  public form: FormGroup = this._builder.group({});

  public data: AddEditProductVariantData;
  public productsResponse?: GetProductsResponse;
  public isRetrievingData: boolean = false;

  private _destroy$: Subject<void> = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) data: AddEditProductVariantData,
    private _productServcie: ProductService,
    private _dialogService: DialogService,
    private _builder: FormBuilder
  ) {
    this.data = data;
  }

  public ngOnInit(): void {
    this.getProducts();
    this.initializeForm();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onAddEditProduct(isAddingProduct: boolean): void {
    const dialogData: AddEditProductData = {
      product: this.data.productVariant?.product ?? null,
      isAdding: isAddingProduct,
    };
    const dialogRef = this._dialogService.openAddEditProductDialog(dialogData);
    dialogRef.afterClosed().subscribe((resp: Product) => {
      // close button is clicked
      if (!resp.name) {
        return;
      }

      if (isAddingProduct) {
        this.productsResponse?.products.push(resp);
        this.productId?.setValue(resp.id);
      } else {
        const requiredProduct = this.productsResponse?.products.find(
          (c) => c.id === resp.id
        );

        requiredProduct!.name = resp.name;
        requiredProduct!.costPrice = resp.costPrice;
        requiredProduct!.wholesalePrice = resp.wholesalePrice;
        requiredProduct!.dropPrice = resp.dropPrice;
        requiredProduct!.price = resp.price;
        requiredProduct!.category = resp.category;

        if (this.data.productVariant?.product) {
          this.data.productVariant.product = resp;
        }
      }
    });
  }

  public onAddEditSize(isAdding: boolean): void {}

  public isFormValid(): boolean {
    return this.form.status !== 'INVALID' && this.form.status !== 'PENDING';
  }

  private getProducts(): void {
    this.isRetrievingData = true;
    this._productServcie
      .getProducts()
      .pipe(
        catchError((error) => {
          return this.onCatchError(error);
        }),
        takeUntil(this._destroy$)
      )
      .subscribe((resp: GetProductsResponse) => {
        this.productsResponse = resp;
        this.isRetrievingData = false;
      });
  }

  private onCatchError(error: any): Observable<any> {
    this.isRetrievingData = false;
    return of({});
  }

  private initializeForm(): void {
    // TODO start with adding other fields of product variant (size, status, color, etc.)
    // color - colorpicker or hex insert, article - generate (on backend), status - calculate depending on amount, instock default
    // measurements - form array, quantities, totalsold - default 0
    this.form = this._builder.group({
      productId: new FormControl(
        {
          value: this.data?.productVariant?.productId,
          disabled: !this.data?.isAdding,
        },
        [Validators.required]
      ),
      sizeId: new FormControl(
        {
          value: this.data?.productVariant?.sizeId,
          disabled: !this.data?.isAdding,
        },
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
}
