import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ProductVariantService } from '../../services/product-variant.service';
import { GetProductVariant } from '../../models/get-product-variant';
import { catchError, debounceTime, takeUntil } from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { ProductVariant } from 'src/app/core/models/product-variant';
import { MatPaginator } from '@angular/material/paginator';
import { GroupedProductVariant } from '../../models/grouped-product-variant';
import { ProductGroup } from '../../models/product-group';
import { CustomTranslateService } from 'src/app/core/services/custom-translate.service';
import { ProductStatus } from 'src/app/core/enums/product-status';
import { ProductStatusMapper } from 'src/app/core/mappers/product-status-mapper';
import { MatSort } from '@angular/material/sort';
import { GetProductVariantRequest } from '../../models/get-product-variant-request';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { GetCategoriesResponse } from '../../models/get-categories-response';
import { DefaultOptions } from 'src/app/core/constants/default-options';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from 'src/app/features/common-services/dialog.service';
import { AddEditProductVariantData } from '../../models/add-edit-product-variant-data';
import { StatusConstants } from 'src/app/core/constants/status-constants';
import { UIDialogService } from 'src/app/layout/dialogs/services/ui-dialog.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
})
export class InventoryComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  private productGroups: ProductGroup[] = [];

  public productVariantResponse?: GetProductVariant;
  public categoriesResponse?: GetCategoriesResponse;
  public isRetrievingData: boolean = false;
  public showLargeImage: boolean = false;
  public form: FormGroup = this._builder.group({});
  public allSelectionOptionId = DefaultOptions.allSelectionOptionId;
  public translatedAllOption$?: Observable<string>;
  public allProductStatuses: ProductStatus[] =
    StatusConstants.allProductStatuses;
  public retrievingLastAddedProductVariantInfo: boolean = false;

  private _destroy$: Subject<void> = new Subject<void>();

  // Add property to track measurements column collapsed state
  public isHeadersCollapsed: boolean = true;

  public displayedColumns: string[] = [
    'product',
    'productPhoto',
    'availability',
    'productStatus',
    'measurements',
    'prices',
    'amount',
    'article',
    'actions',
  ];

  public selectedImageUrl?: string;
  public currentPhotoIndex: number = 0;
  public currentPhotos: any[] = [];

  public placeholderImageUrl = 'https://placehold.co/400';

  public dataSource: MatTableDataSource<GroupedProductVariant> =
    new MatTableDataSource<GroupedProductVariant>();

  constructor(
    private _productVariantService: ProductVariantService,
    private _customTranslateService: CustomTranslateService,
    private _categoryService: CategoryService,
    private _builder: FormBuilder,
    private _translate: TranslateService,
    private _dialogService: DialogService,
    private _uiDialogService: UIDialogService,
    private _toastr: ToastrService,
  ) {}

  public ngOnInit(): void {
    this.initializeForm();
    this.translatedAllOption$ = this._translate.stream('common.allOption');
    this.subscribeOnFormValueChanges();
    this.getCategories();
    this.getProductVariants({});
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public toggleMeasurementsColumn(): void {
    this.isHeadersCollapsed = !this.isHeadersCollapsed;
  }

  public getProductStatusDisplayName(productStatus: ProductStatus): string {
    const mapper = new ProductStatusMapper(this._customTranslateService);
    return mapper.convertProductStatusToString(productStatus);
  }

  public getProductStatusClass(productStatus: ProductStatus): string {
    switch (productStatus) {
      case ProductStatus.inStock:
        return 'status-badge badge-success';
      case ProductStatus.onOrder:
        return 'status-badge badge-info';
      case ProductStatus.discontinued:
        return 'status-badge badge-danger';

      default:
        return '';
    }
  }

  public onAddProductVariantClick(): void {
    const data: AddEditProductVariantData = {
      productVariant: null,
      isAdding: true,
    };
    const dialogRef = this._dialogService.openAddEditProductVariantDialog(data);
    dialogRef.afterClosed().subscribe(() => {
      this.getFreshData();
    });
  }

  public onEditClick(productVariant: ProductVariant): void {
    const data: AddEditProductVariantData = {
      productVariant: productVariant,
      isAdding: false,
    };
    const dialogRef = this._dialogService.openAddEditProductVariantDialog(data);
    dialogRef.afterClosed().subscribe(() => {
      this.getFreshData();
    });
  }

  public onDeleteClick(productVariant: ProductVariant): void {
    const productInfo = `${productVariant.product.name} (${productVariant.size.name}, ${productVariant.color.name})`;

    const dialogRef = this._uiDialogService.openConfirmationDialog({
      titleKey: 'dialogs.productVariantDeletionTitle',
      contentKey: 'dialogs.productVariantDeletionContent',
      contentParams: { productInfo: productInfo },
      confirmButtonTextKey: 'common.delete',
      cancelButtonTextKey: 'common.cancel',
      type: 'danger',
      icon: 'delete_outline',
    });

    dialogRef.afterClosed().subscribe((confirmed: string) => {
      if (confirmed === 'true') {
        this.onProductVariantDelete(productVariant);
      }
    });
  }

  public onCopyClick(productVariant: ProductVariant): void {
    this.copyProductVariant(productVariant);
  }

  public showCopyLastAddedButton(): boolean {
    return this.productVariantResponse!.resultsAmount > 0;
  }

  public onCopyLastProductVariantClick(): void {
    this.retrievingLastAddedProductVariantInfo = true;
    this._productVariantService
      .getProductVariants({
        getLastAddedProductVariant: true,
      })
      .pipe(
        catchError((error) => {
          return this.onCatchError(error);
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((resp) => {
        this.retrievingLastAddedProductVariantInfo = false;
        if (resp && resp.resultsAmount > 0) {
          const productVariant = resp.productVariants[0];
          this.copyProductVariant(productVariant);
        }
      });
  }

  public openLargeImage(photos: any[], startIndex: number = 0): void {
    if (photos && photos.length > 0) {
      this.currentPhotos = photos.filter((photo) => photo && photo.photoUrl);
      if (this.currentPhotos.length > 0) {
        this.currentPhotoIndex = startIndex;
        this.selectedImageUrl =
          this.currentPhotos[this.currentPhotoIndex].photoUrl;
        this.showLargeImage = true;
      }
    }
  }

  public closeLargeImage(): void {
    this.showLargeImage = false;
    this.selectedImageUrl = undefined;
    this.currentPhotos = [];
    this.currentPhotoIndex = 0;
  }

  public nextPhoto(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.currentPhotos.length > 0) {
      this.currentPhotoIndex =
        (this.currentPhotoIndex + 1) % this.currentPhotos.length;
      this.selectedImageUrl =
        this.currentPhotos[this.currentPhotoIndex].photoUrl;
    }
  }

  public previousPhoto(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.currentPhotos.length > 0) {
      this.currentPhotoIndex =
        this.currentPhotoIndex === 0
          ? this.currentPhotos.length - 1
          : this.currentPhotoIndex - 1;
      this.selectedImageUrl =
        this.currentPhotos[this.currentPhotoIndex].photoUrl;
    }
  }

  public get hasMultiplePhotos(): boolean {
    return this.currentPhotos.length > 1;
  }

  public get photoCounter(): string {
    return `${this.currentPhotoIndex + 1} / ${this.currentPhotos.length}`;
  }

  private copyProductVariant(productVariant: ProductVariant): void {
    const data: AddEditProductVariantData = {
      productVariant: productVariant,
      isAdding: true,
    };
    const dialogRef = this._dialogService.openAddEditProductVariantDialog(data);
    dialogRef.afterClosed().subscribe(() => {
      this.getFreshData();
    });
  }

  private onProductVariantDelete(productVariant: ProductVariant): void {
    this._productVariantService
      .deleteProductVariant(productVariant.id)
      .pipe(
        catchError((error) => {
          return this.onCatchDeleteError();
        }),
      )
      .subscribe((resp: boolean) => {
        this.onProductVariantDeletionCompleted(resp);
      });
  }

  private onProductVariantDeletionCompleted(resp: boolean) {
    if (resp) {
      this._translate
        .get('toastrs.productVariantDeleted')
        .subscribe((resp: string) => {
          this.showSuccess(resp);
        });
    } else {
      this._translate
        .get('toastrs.productVariantDeletedError')
        .subscribe((resp: string) => {
          this.showError(resp);
        });
    }

    this.getFreshData();
  }

  private onCatchDeleteError(): Observable<any> {
    this._translate
      .get('toastrs.productVariantDeletedError')
      .subscribe((resp: string) => {
        this.showError(resp);
      });

    return of({});
  }

  private showSuccess(text: string): void {
    this._toastr.success(`${text}`);
  }

  private showError(text: string): void {
    this._toastr.error(`${text}`);
  }

  private getFreshData(): void {
    this.clearForm();
    this.getCategories();
    this.getProductVariants({});
  }

  private subscribeOnFormValueChanges(): void {
    this.form.valueChanges
      .pipe(takeUntil(this._destroy$), debounceTime(300))
      .subscribe(() => {
        this.dataSource.data = [];
        this.getProductVariantsWithSelectedFilters();
      });
  }

  private getProductVariantsWithSelectedFilters(): void {
    let categoryId =
      this.form.value.categoryId === this.allSelectionOptionId
        ? null
        : this.form.value.categoryId;

    let productStatus =
      this.form.value.productStatus === this.allSelectionOptionId
        ? null
        : this.form.value.productStatus;

    this.getProductVariants({
      productName: this.form.value.productName,
      categoryId: categoryId,
      productStatus: productStatus,
    });
  }

  private getProductVariants(searchParams: GetProductVariantRequest): void {
    this.isRetrievingData = true;
    this._productVariantService
      .getProductVariants(searchParams)
      .pipe(
        catchError((error) => {
          return this.onCatchError(error);
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((resp: GetProductVariant) => {
        this.productVariantResponse = resp;
        this.processGroupedData(resp.productVariants);
        this.isRetrievingData = false;
      });
  }

  private processGroupedData(variants: ProductVariant[]): void {
    const groupedMap = new Map<string, ProductVariant[]>();

    variants.forEach((variant) => {
      const productId = variant.productId;
      if (!groupedMap.has(productId)) {
        groupedMap.set(productId, []);
      }
      groupedMap.get(productId)!.push(variant);
    });

    // Create product groups
    this.productGroups = Array.from(groupedMap.entries()).map(
      ([productId, productVariants]) => ({
        product: productVariants[0].product,
        variants: productVariants.sort((a, b) =>
          a.size.name.localeCompare(b.size.name),
        ),
        variantCount: productVariants.length,
      }),
    );

    // Create flat array with grouping info for table display
    const flattenedVariants: GroupedProductVariant[] = [];

    this.productGroups.forEach((group) => {
      group.variants.forEach((variant, index) => {
        const groupedVariant: GroupedProductVariant = {
          ...variant,
          isFirstInGroup: index === 0,
          isLastInGroup: index == group.variants.length - 1,
          groupSize: group.variantCount,
          showProductInfo: index === 0,
        };
        flattenedVariants.push(groupedVariant);
      });
    });

    this.dataSource.data = flattenedVariants;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'product':
          return item.product.name;
        default:
          return (item as any)[property];
      }
    };
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private getCategories(): void {
    this.isRetrievingData = true;
    this._categoryService
      .getCategories()
      .pipe(
        catchError((error) => {
          return this.onCatchError(error);
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((resp) => {
        this.categoriesResponse = resp;
      });
  }

  private onCatchError(error: any): Observable<any> {
    this.isRetrievingData = false;
    this.retrievingLastAddedProductVariantInfo = false;
    return of({});
  }

  private initializeForm(): void {
    this.form = this._builder.group({
      productName: new FormControl(),
      categoryId: new FormControl(DefaultOptions.allSelectionOptionId),
      productStatus: new FormControl(DefaultOptions.allSelectionOptionId),
    });
  }

  private clearForm(): void {
    this.dataSource.data = [];
    this.productName!.setValue('', { emitEvent: false });
    this.categoryId!.setValue(this.allSelectionOptionId, { emitEvent: false });
    this.productStatus!.setValue(this.allSelectionOptionId, {
      emitEvent: false,
    });
  }

  get productName() {
    return this.form.get('productName');
  }

  get categoryId() {
    return this.form.get('categoryId');
  }

  get productStatus() {
    return this.form.get('productStatus');
  }
}
