import { Component, OnInit, ViewChild } from '@angular/core';
import { ProductVariantService } from '../../services/product-variant.service';
import { GetProductVariant } from '../../models/get-product-variant';
import { catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { ProductVariant } from 'src/app/core/models/product-variant';
import { MatPaginator } from '@angular/material/paginator';
import { GroupedProductVariant } from '../../models/grouped-product-variant';
import { ProductGroup } from '../../models/product-group';
import { CustomTranslateService } from 'src/app/core/services/custom-translate.service';
import { ProductStatus } from 'src/app/core/enums/product-status';
import { ProductStatusMapper } from 'src/app/core/mappers/product-status-mapper';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
})
export class InventoryComponent implements OnInit {
  @ViewChild(MatPaginator)
  paginator!: MatPaginator;
  @ViewChild(MatSort)
  sort!: MatSort;

  private productGroups: ProductGroup[] = [];

  public productVariantResponse?: GetProductVariant;
  public isRetrievingProductVariants: boolean = false;

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

  public dataSource: MatTableDataSource<GroupedProductVariant> =
    new MatTableDataSource<GroupedProductVariant>();

  constructor(
    private _productVariantService: ProductVariantService,
    private _customTranslateService: CustomTranslateService
  ) {}

  public ngOnInit(): void {
    this.getProductVariants();
    this.dataSource.filterPredicate = (
      data: GroupedProductVariant,
      filter: string
    ) => {
      return data.product.name
        .toLocaleLowerCase()
        .includes(filter.toLocaleLowerCase());
    };
  }

  // Add method to toggle measurements column
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
        return 'badge text-bg-success';
      case ProductStatus.onOrder:
        return 'badge text-bg-info';
      case ProductStatus.discontinued:
        return 'badge text-bg-danger';

      default:
        return '';
    }
  }

  public applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private getProductVariants(): void {
    this.isRetrievingProductVariants = true;
    this._productVariantService
      .getProductVariants()
      .pipe(
        catchError((error) => {
          return this.onCatchError(error);
        })
      )
      .subscribe((resp: GetProductVariant) => {
        this.productVariantResponse = resp;
        this.processGroupedData(resp.productVariants);
        this.isRetrievingProductVariants = false;
      });
  }

  private processGroupedData(variants: ProductVariant[]): void {
    // Group variants by product ID
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
          a.size.name.localeCompare(b.size.name)
        ),
        variantCount: productVariants.length,
      })
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
  }

  private onCatchError(error: any): Observable<any> {
    this.isRetrievingProductVariants = false;
    return of({});
  }
}
