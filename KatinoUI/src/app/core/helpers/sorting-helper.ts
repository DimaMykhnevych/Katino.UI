import { ProductVariant } from '../models/product-variant';

export class SortingHelper {
  public static compareVariants(a: ProductVariant, b: ProductVariant): number {
    const colorCompare = (a.color?.name || '').localeCompare(
      b.color?.name || '',
    );
    if (colorCompare !== 0) {
      return colorCompare;
    }

    return this.compareSizes(a.size?.name || '', b.size?.name || '');
  }

  private static compareSizes(a: string, b: string): number {
    const aTrimmed = a.trim().toUpperCase();
    const bTrimmed = b.trim().toUpperCase();

    const aIsNumeric = /^\d+$/.test(aTrimmed);
    const bIsNumeric = /^\d+$/.test(bTrimmed);

    if (aIsNumeric && bIsNumeric) {
      return Number(aTrimmed) - Number(bTrimmed);
    }

    const standardLetterOrder: Record<string, number> = {
      XS: 1,
      S: 2,
      M: 3,
      L: 4,
      XL: 5,
      XXL: 6,
      XXXL: 7,
    };

    const aLetterRank = standardLetterOrder[aTrimmed];
    const bLetterRank = standardLetterOrder[bTrimmed];

    const aIsStandardLetter = aLetterRank !== undefined;
    const bIsStandardLetter = bLetterRank !== undefined;

    if (aIsStandardLetter && bIsStandardLetter) {
      return aLetterRank - bLetterRank;
    }

    return aTrimmed.localeCompare(bTrimmed);
  }
}
