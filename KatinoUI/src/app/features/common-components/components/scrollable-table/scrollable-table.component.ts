import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-scrollable-table',
  templateUrl: './scrollable-table.component.html',
  styleUrls: ['./scrollable-table.component.scss'],
})
export class ScrollableTableComponent implements AfterViewInit, OnDestroy {
  @Input() isLoading = false;
  @Input() hasMoreData = false;
  @Output() loadMore = new EventEmitter<void>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;

  private _destroy$ = new Subject<void>();

  ngAfterViewInit(): void {
    fromEvent(this.scrollContainer.nativeElement, 'scroll')
      .pipe(debounceTime(150), takeUntil(this._destroy$))
      .subscribe(() => this.checkScroll());
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private checkScroll(): void {
    if (this.isLoading || !this.hasMoreData) return;
    const el = this.scrollContainer.nativeElement;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
      this.loadMore.emit();
    }
  }
}
