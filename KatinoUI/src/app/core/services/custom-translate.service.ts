import { Injectable } from '@angular/core';
import { TranslateEnum } from './models/translate-enum';
import { ProductStatus } from '../enums/product-status';

@Injectable({
  providedIn: 'root',
})
export class CustomTranslateService {
  private dictionary: TranslateEnum[] = [
    {
      enum: ProductStatus[ProductStatus.inStock],
      en: 'In stock',
      ua: 'В наявності',
      ru: 'В наличии',
    },
    {
      enum: ProductStatus[ProductStatus.onOrder],
      en: 'On order',
      ua: 'Під замовлення',
      ru: 'Под заказ',
    },
    {
      enum: ProductStatus[ProductStatus.discontinued],
      en: 'Discontinued',
      ua: 'Не відшивається',
      ru: 'Не отшивается',
    },
  ];

  public translateProductStatus(statusName: string): string {
    const currentLanguage = localStorage.getItem('language') || 'en';
    const neededObject = this.dictionary.find(
      (item) => item.enum === statusName
    );
    if (neededObject) {
      return neededObject[currentLanguage as keyof TranslateEnum];
    }
    return '';
  }
}
