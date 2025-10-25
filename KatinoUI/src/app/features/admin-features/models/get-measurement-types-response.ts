import { MeasurementType } from 'src/app/core/models/measurement-type';

export interface GetMeasurementTypesResponse {
  measurementTypes: MeasurementType[];
  resultsAmount: number;
}
