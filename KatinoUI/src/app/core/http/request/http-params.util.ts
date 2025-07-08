import { HttpParams } from '@angular/common/http';
import { isNil } from 'lodash';

export function convertToHttpParams<T = object>(params: T): HttpParams {
  return Object.keys(params).reduce(
    (previousValue: HttpParams, key: string) =>
      !isNil(params[key])
        ? previousValue.append(key, params[key])
        : previousValue,
    new HttpParams()
  );
}
