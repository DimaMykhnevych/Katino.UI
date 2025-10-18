import { Color } from 'src/app/core/models/color';

export interface GetColorsResponse {
  colors: Color[];
  resultsAmount: number;
}
