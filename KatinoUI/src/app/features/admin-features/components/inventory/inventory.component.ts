import { Component, OnInit } from '@angular/core';
import { ProductVariantService } from '../../services/product-variant.service';
import { GetProductVariant } from '../../models/get-product-variant';
import { catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
})
export class InventoryComponent implements OnInit {
  public productVariantResponse?: GetProductVariant;
  public isRetrievingProductVariants: boolean = false;

  constructor(private _productVariantService: ProductVariantService) {}

  public ngOnInit(): void {
    this.getProductVariants();
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
      .subscribe((resp) => {
        this.productVariantResponse = resp;
        this.isRetrievingProductVariants = false;
      });
  }

  private onCatchError(error: any): Observable<any> {
    this.isRetrievingProductVariants = false;
    return of({});
  }
}
