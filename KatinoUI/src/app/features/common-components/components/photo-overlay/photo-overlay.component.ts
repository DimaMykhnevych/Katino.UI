import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface PhotoItem {
  photoUrl: string;
}

@Component({
  selector: 'app-photo-overlay',
  templateUrl: './photo-overlay.component.html',
  styleUrls: ['./photo-overlay.component.scss'],
})
export class PhotoOverlayComponent {
  @Input() photos: PhotoItem[] = [];
  @Input() currentIndex: number = 0;
  @Input() visible: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();

  get selectedImageUrl(): string {
    return this.photos[this.currentIndex]?.photoUrl || '';
  }

  get hasMultiplePhotos(): boolean {
    return this.photos.length > 1;
  }

  get photoCounter(): string {
    return `${this.currentIndex + 1} / ${this.photos.length}`;
  }

  public onClose(): void {
    this.close.emit();
  }

  public previousPhoto(event: Event): void {
    event.stopPropagation();
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.indexChange.emit(this.currentIndex);
    }
  }

  public nextPhoto(event: Event): void {
    event.stopPropagation();
    if (this.currentIndex < this.photos.length - 1) {
      this.currentIndex++;
      this.indexChange.emit(this.currentIndex);
    }
  }
}
