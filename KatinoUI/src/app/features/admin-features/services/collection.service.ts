import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppSettings } from 'src/app/core/settings';
import { Collection } from 'src/app/core/models/collection/collections';
import { AddCollectionRequest } from 'src/app/core/models/collection/add-collection-request';
import { UpdateCollectionRequest } from 'src/app/core/models/collection/update-collection-request';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  constructor(private _http: HttpClient) {}

  public getCollections(search?: string): Observable<Collection[]> {
    let url = `${AppSettings.apiHost}/Collection`;
    if (search) {
      url = `${AppSettings.apiHost}/Collection?Name=${search}`;
    }
    return this._http.get<Collection[]>(url);
  }

  public addCollection(
    collection: AddCollectionRequest,
  ): Observable<Collection> {
    return this._http.post<Collection>(
      `${AppSettings.apiHost}/Collection`,
      collection,
    );
  }

  public updateCollection(
    collection: UpdateCollectionRequest,
  ): Observable<Collection> {
    return this._http.put<Collection>(
      `${AppSettings.apiHost}/Collection/${collection.collectionId}/products`,
      collection.productIds,
    );
  }

  public deleteCollection(collectionId: string): Observable<boolean> {
    return this._http.delete<boolean>(
      `${AppSettings.apiHost}/Collection/${collectionId}`,
    );
  }
}
