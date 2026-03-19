import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';

export interface PhotoItem {
  photoUrl: string;
}

@Component({
  selector: 'app-photo-overlay',
  templateUrl: './photo-overlay.component.html',
  styleUrls: ['./photo-overlay.component.scss'],
})
export class PhotoOverlayComponent implements OnChanges {
  @Input() photos: PhotoItem[] = [];
  @Input() currentIndex: number = 0;
  @Input() visible: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();

  public isLoading: boolean = false;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.isLoading = true;
      this.preloadAdjacent();
    }

    if (changes['currentIndex'] && !changes['currentIndex'].firstChange) {
      this.isLoading = true;
    }
  }

  get selectedImageUrl(): string {
    return this.photos[this.currentIndex]?.photoUrl || '';
  }

  get hasMultiplePhotos(): boolean {
    return this.photos.length > 1;
  }

  get photoCounter(): string {
    return `${this.currentIndex + 1} / ${this.photos.length}`;
  }

  public onImageLoad(): void {
    this.isLoading = false;
    this.preloadAdjacent();
  }

  public onImageError(): void {
    this.isLoading = false;
  }

  public onClose(): void {
    this.close.emit();
  }

  public previousPhoto(event: Event): void {
    event.stopPropagation();
    if (this.currentIndex > 0 && !this.isLoading) {
      this.isLoading = true;
      this.currentIndex--;
      this.indexChange.emit(this.currentIndex);
    }
  }

  public nextPhoto(event: Event): void {
    event.stopPropagation();
    if (this.currentIndex < this.photos.length - 1 && !this.isLoading) {
      this.isLoading = true;
      this.currentIndex++;
      this.indexChange.emit(this.currentIndex);
    }
  }

  private preloadAdjacent(): void {
    [this.currentIndex - 1, this.currentIndex + 1].forEach((i) => {
      if (i >= 0 && i < this.photos.length) {
        const img = new Image();
        img.src = this.photos[i].photoUrl;
      }
    });
  }
}
