import { MeasurementType } from './measurement-type';

export interface GetProductVariantMeasurement {
  id: string;
  measurementTypeId: string;
  value: number;
  measurementType: MeasurementType;
}
