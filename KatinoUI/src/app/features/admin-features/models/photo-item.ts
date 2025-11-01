export interface PhotoItem {
  id?: string;
  file?: File;
  photoUrl: string;
  displayOrder: number;
  isExisting: boolean;
  markedForDeletion?: boolean;
}
