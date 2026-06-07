import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import { Collection } from 'src/app/core/models/collection/collections';
import { CollectionService } from 'src/app/features/admin-features/services/collection.service';

@Component({
  selector: 'app-collection-autocomplete',
  templateUrl: './collection-autocomplete.component.html',
  styleUrls: ['./collection-autocomplete.component.scss'],
})
export class CollectionAutocompleteComponent implements OnInit, OnDestroy {
  @Input() label = '';

  @Output() collectionSelected = new EventEmitter<Collection>();

  public searchCtrl = new FormControl('');
  public collections: Collection[] = [];
  public isSearching = false;

  private _destroy$ = new Subject<void>();

  constructor(private _collectionService: CollectionService) {}

  public ngOnInit(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((v) => typeof v === 'string' && v.length >= 2),
        switchMap((value: string) => {
          this.isSearching = true;
          return this._collectionService.getCollections(value).pipe(
            catchError(() => of([] as Collection[])),
            finalize(() => (this.isSearching = false)),
          );
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((collections) => {
        this.collections = collections;
      });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  public displayFn = (c: Collection): string => (c ? c.name : '');

  public onFocus(): void {
    if (this.collections.length === 0 && !this.isSearching) {
      this.isSearching = true;
      this._collectionService
        .getCollections()
        .pipe(
          catchError(() => of([] as Collection[])),
          finalize(() => (this.isSearching = false)),
          takeUntil(this._destroy$),
        )
        .subscribe((collections) => {
          this.collections = collections;
        });
    }
  }

  public onOptionSelected(c: Collection): void {
    this.collectionSelected.emit(c);
    this.searchCtrl.setValue('', { emitEvent: false });
    this.collections = [];
    this.searchInput.nativeElement.blur();
  }
}
