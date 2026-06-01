import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, EMPTY } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { Collection } from 'src/app/core/models/collection/collections';
import { CollectionService } from 'src/app/features/admin-features/services/collection.service';

@Component({
  selector: 'app-collections',
  templateUrl: './collections.component.html',
  styleUrls: ['./collections.component.scss'],
})
export class CollectionsComponent implements OnInit, OnDestroy {
  public collections: Collection[] = [];
  public isLoading = false;
  public isCreating = false;

  public createForm: FormGroup = this._fb.group({
    name: ['', [Validators.required]],
    description: [''],
  });

  private _destroy$ = new Subject<void>();

  constructor(
    private _collectionService: CollectionService,
    private _fb: FormBuilder,
    private _toastr: ToastrService,
    private _translate: TranslateService,
  ) {}

  public ngOnInit(): void {
    this.loadCollections();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onCreate(): void {
    if (this.createForm.invalid) return;
    this.isCreating = true;
    this._collectionService
      .addCollection(this.createForm.value)
      .pipe(
        catchError(() => {
          this._toastr.error(this._t('collections.toastr.collectionCreateFailed'));
          return EMPTY;
        }),
        finalize(() => (this.isCreating = false)),
        takeUntil(this._destroy$),
      )
      .subscribe(() => {
        this.createForm.reset();
        this._toastr.success(this._t('collections.toastr.collectionCreated'));
        this.loadCollections();
      });
  }

  public onCollectionDeleted(collectionId: string): void {
    this.collections = this.collections.filter((c) => c.id !== collectionId);
  }

  public onCollectionUpdated(updated: Collection): void {
    const idx = this.collections.findIndex((c) => c.id === updated.id);
    if (idx !== -1) {
      this.collections = [
        ...this.collections.slice(0, idx),
        updated,
        ...this.collections.slice(idx + 1),
      ];
    }
  }

  public trackById(_: number, item: Collection): string {
    return item.id;
  }

  private loadCollections(): void {
    this.isLoading = true;
    this._collectionService
      .getCollections()
      .pipe(
        catchError(() => EMPTY),
        finalize(() => (this.isLoading = false)),
        takeUntil(this._destroy$),
      )
      .subscribe((collections) => {
        this.collections = collections;
      });
  }

  private _t(key: string): string {
    return this._translate.instant(key);
  }
}
