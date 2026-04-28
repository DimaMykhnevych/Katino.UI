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
import {
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import { OrderTag } from 'src/app/core/models/order/order-tag';
import { OrderTagService } from 'src/app/features/admin-features/services/order-tag.service';

@Component({
  selector: 'app-tag-autocomplete',
  templateUrl: './tag-autocomplete.component.html',
  styleUrls: ['./tag-autocomplete.component.scss'],
})
export class TagAutocompleteComponent implements OnInit, OnDestroy {
  @Input() set initialTags(tags: OrderTag[]) {
    this.selectedValues = tags.map((t) => t.value);
  }

  @Output() tagsChanged = new EventEmitter<string[]>();

  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;
  @ViewChild('autoTrigger') autoTrigger!: MatAutocompleteTrigger;

  public readonly separatorKeysCodes = [ENTER, COMMA];
  public tagCtrl = new FormControl('');
  public filteredTags: OrderTag[] = [];
  public selectedValues: string[] = [];

  private _destroy$ = new Subject<void>();

  constructor(private _orderTagService: OrderTagService) {}

  public ngOnInit(): void {
    this.tagCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((search) =>
          this._orderTagService
            .getOrderTags(search ?? '', true)
            .pipe(catchError(() => of([] as OrderTag[]))),
        ),
        takeUntil(this._destroy$),
      )
      .subscribe((tags) => {
        this.filteredTags = tags.filter(
          (t) => !this.selectedValues.includes(t.value),
        );
        if (this.filteredTags.length === 0) {
          this.autoTrigger?.closePanel();
        }
      });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.selectedValues.includes(value)) {
      this.selectedValues = [...this.selectedValues, value];
      this.tagsChanged.emit([...this.selectedValues]);
    }
    event.chipInput?.clear();
    this.tagCtrl.setValue('');
  }

  public remove(value: string): void {
    this.selectedValues = this.selectedValues.filter((v) => v !== value);
    this.tagsChanged.emit([...this.selectedValues]);
  }

  public selected(event: MatAutocompleteSelectedEvent): void {
    const value: string = event.option.value;
    if (!this.selectedValues.includes(value)) {
      this.selectedValues = [...this.selectedValues, value];
      this.tagsChanged.emit([...this.selectedValues]);
    }
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue('');
  }
}
