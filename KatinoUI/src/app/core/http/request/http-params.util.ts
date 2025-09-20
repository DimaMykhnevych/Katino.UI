import { HttpParams } from '@angular/common/http';

export function convertToHttpParams<T = object>(params: T): HttpParams {
  return Object.keys(params as any).reduce(
    (previousValue: HttpParams, key: string) => {
      const value = (params as any)[key];
      return !(value === null || value === undefined)
        ? previousValue.append(key, value.toString())
        : previousValue;
    },
    new HttpParams()
  );
}
