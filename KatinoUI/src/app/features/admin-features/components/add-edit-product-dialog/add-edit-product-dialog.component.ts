import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AddEditProductData } from '../../models/add-edit-product-data';
import { CategoryService } from '../../services/category.service';
import { Observable, of, Subject } from 'rxjs';
import { GetCategoriesResponse } from '../../models/get-categories-response';
import { catchError, takeUntil } from 'rxjs/operators';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AddEditCategoryData } from '../../models/add-edit-category-data';
import { DialogService } from 'src/app/features/common-services/dialog.service';
import { Category } from 'src/app/core/models/category';
import { ProductService } from '../../services/product.service';
import { Product } from 'src/app/core/models/product';
import { UpdateProduct } from '../../models/update-product';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-add-edit-product-dialog',
  templateUrl: './add-edit-product-dialog.component.html',
  styleUrls: ['./add-edit-product-dialog.component.scss'],
})
export class AddEditProductDialogComponent implements OnInit, OnDestroy {
  public form: FormGroup = this._builder.group({});

  public data: AddEditProductData;
  public isRetrievingData: boolean = false;
  public isUpdatingData: boolean = false;
  public categoriesResponse?: GetCategoriesResponse;

  private _destroy$: Subject<void> = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) data: AddEditProductData,
    private _dialogRef: MatDialogRef<AddEditProductDialogComponent>,
    private _categoryService: CategoryService,
    private _builder: FormBuilder,
    private _dialogService: DialogService,
    private _productService: ProductService,
    private _toastr: ToastrService,
    private _translate: TranslateService
  ) {
    this.data = data;
  }

  public ngOnInit(): void {
    this.getCategories();
    this.initializeForm();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public isFormValid(): boolean {
    return this.form.status !== 'INVALID' && this.form.status !== 'PENDING';
  }

  public onAddEditCategory(isAddingCategory: boolean): void {
    const dialogData: AddEditCategoryData = {
      category: this.data.product?.category ?? null,
      isAdding: isAddingCategory,
    };
    const dialogRef = this._dialogService.openAddEditCategoryDialog(dialogData);
    dialogRef.afterClosed().subscribe((resp: Category) => {
      // close button is clicked
      if (!resp.name) {
        return;
      }
      if (isAddingCategory) {
        this.categoriesResponse?.categories.push(resp);
        this.categoryId?.setValue(resp.id);
      } else {
        const requiredCategory = this.categoriesResponse?.categories.find(
          (c) => c.id === resp.id
        );

        requiredCategory!.name = resp.name;
        requiredCategory!.description = resp.description;

        if (this.data.product?.category) {
          this.data.product.category = resp;
        }
      }
    });
  }

  public onAddEditClick(): void {
    if (this.data.isAdding) {
      this.addProduct();
    } else {
      this.updateProduct();
    }
  }

  public onCategorySelectionChange(event: MatSelectChange): void {
    if (!this.data.isAdding) {
      const changedCategory = this.categoriesResponse?.categories.find(
        (c) => c.id == event.value
      );

      this.data.product!.category = changedCategory!;
    }
  }

  private addProduct(): void {
    this.isUpdatingData = true;
    this._productService
      .addProduct(this.form.value)
      .pipe(
        catchError((error) => {
          return this.onCatchUpdateError(true);
        })
      )
      .subscribe((product: Product) => {
        if (product.id) {
          this.onProductAdded(product);
        }
      });
  }

  private updateProduct(): void {
    this.isUpdatingData = true;
    const updateModel: UpdateProduct = {
      id: this.data.product!.id,
      name: this.name?.value,
      categoryId: this.categoryId?.value,
      costPrice: this.costPrice?.value,
      wholesalePrice: this.wholesalePrice?.value,
      dropPrice: this.dropPrice?.value,
      price: this.price?.value,
    };
    this._productService
      .updateProduct(updateModel)
      .pipe(
        catchError((error) => {
          return this.onCatchUpdateError(false);
        })
      )
      .subscribe((product: Product) => {
        if (product.id) {
          this.onProductUpdated(product);
        }
      });
  }

  private onProductAdded(product: Product): void {
    this.isUpdatingData = false;

    this._translate.get('toastrs.productAdded').subscribe((resp: string) => {
      this.showSuccess(resp);
    });

    this._dialogRef.close(product);
  }

  private onProductUpdated(product: Product): void {
    this.isUpdatingData = false;

    this._translate.get('toastrs.productUpdated').subscribe((resp: string) => {
      this.showSuccess(resp);
    });

    this._dialogRef.close(product);
  }

  private getCategories(): void {
    this.isRetrievingData = true;
    this._categoryService
      .getCategories()
      .pipe(
        catchError((error) => {
          return this.onCatchError(error);
        }),
        takeUntil(this._destroy$)
      )
      .subscribe((resp: GetCategoriesResponse) => {
        this.categoriesResponse = resp;
        this.isRetrievingData = false;
      });
  }

  private onCatchUpdateError(isAddingError: boolean): Observable<any> {
    this.isUpdatingData = false;

    if (isAddingError) {
      this._translate
        .get('toastrs.productAddedError')
        .subscribe((resp: string) => {
          this.showError(resp);
        });
    } else {
      this._translate
        .get('toastrs.productUpdatedError')
        .subscribe((resp: string) => {
          this.showError(resp);
        });
    }

    return of({});
  }

  private onCatchError(error: any): Observable<any> {
    this.isRetrievingData = false;
    return of({});
  }

  private showSuccess(text: string): void {
    this._toastr.success(`${text}`);
  }

  private showError(text: string): void {
    this._toastr.error(`${text}`);
  }

  private initializeForm(): void {
    this.form = this._builder.group({
      name: new FormControl(this.data.product?.name, [Validators.required]),
      costPrice: new FormControl(this.data.product?.costPrice, [
        Validators.required,
      ]),
      wholesalePrice: new FormControl(this.data.product?.wholesalePrice, [
        Validators.required,
      ]),
      dropPrice: new FormControl(this.data.product?.dropPrice, [
        Validators.required,
      ]),
      price: new FormControl(this.data.product?.price, [Validators.required]),
      categoryId: new FormControl(this.data?.product?.category.id, [
        Validators.required,
      ]),
    });
  }

  get name() {
    return this.form.get('name');
  }
  get costPrice() {
    return this.form.get('costPrice');
  }
  get wholesalePrice() {
    return this.form.get('wholesalePrice');
  }
  get dropPrice() {
    return this.form.get('dropPrice');
  }
  get price() {
    return this.form.get('price');
  }
  get categoryId() {
    return this.form.get('categoryId');
  }
}
