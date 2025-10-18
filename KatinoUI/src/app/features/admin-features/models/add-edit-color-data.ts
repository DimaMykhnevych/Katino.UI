import { Color } from 'src/app/core/models/color';

export interface AddEditColorData {
  color: Color | null;
  isAdding: boolean;
}
