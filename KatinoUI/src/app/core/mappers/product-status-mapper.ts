import { ProductStatus } from '../enums/product-status';
import { CustomTranslateService } from '../services/custom-translate.service';

export class ProductStatusMapper {
  private statusDictionary = {
    [ProductStatus.inStock]:
      this._customTranslateService.translateProductStatus(
        ProductStatus[ProductStatus.inStock]
      ),
    [ProductStatus.onOrder]:
      this._customTranslateService.translateProductStatus(
        ProductStatus[ProductStatus.onOrder]
      ),
    [ProductStatus.discontinued]:
      this._customTranslateService.translateProductStatus(
        ProductStatus[ProductStatus.discontinued]
      ),
  };

  constructor(private _customTranslateService: CustomTranslateService) {}

  public convertProductStatusToString(status: ProductStatus): string {
    return this.statusDictionary[status];
  }
}
