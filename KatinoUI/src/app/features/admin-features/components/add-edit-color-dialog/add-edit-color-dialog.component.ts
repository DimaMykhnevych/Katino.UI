import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { AddEditColorData } from '../../models/add-edit-color-data';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ColorService } from '../../services/color.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { catchError, takeUntil } from 'rxjs/operators';
import { Color } from 'src/app/core/models/color';
import { UpdateColor } from '../../models/update-color';

@Component({
  selector: 'app-add-edit-color-dialog',
  templateUrl: './add-edit-color-dialog.component.html',
  styleUrls: ['./add-edit-color-dialog.component.scss'],
})
export class AddEditColorDialogComponent implements OnInit, OnDestroy {
  private _destroy$: Subject<void> = new Subject<void>();

  public form: FormGroup = this._builder.group({});

  public data: AddEditColorData;
  public isUpdatingData: boolean = false;
  public selectedColor: string = '#000000';

  constructor(
    @Inject(MAT_DIALOG_DATA) data: AddEditColorData,
    private _builder: FormBuilder,
    private _dialogRef: MatDialogRef<AddEditColorDialogComponent>,
    private _colorService: ColorService,
    private _toastr: ToastrService,
    private _translate: TranslateService
  ) {
    this.data = data;
  }

  public ngOnInit(): void {
    this.initializeForm();
    this.setupColorSync();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onAddEditClick(): void {
    if (this.data.isAdding) {
      this.addColor();
    } else {
      this.updateColor();
    }
  }

  public onColorPickerChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const color = input.value;
    this.selectedColor = color;
    this.hexCode?.setValue(color.toUpperCase(), { emitEvent: false });
  }

  private setupColorSync(): void {
    const initialHex = this.hexCode?.value;
    if (initialHex) {
      this.selectedColor = this.normalizeHexCode(initialHex);
    }

    this.hexCode?.valueChanges
      .pipe(takeUntil(this._destroy$))
      .subscribe((value: string) => {
        if (value && this.isValidHexCode(value)) {
          this.selectedColor = this.normalizeHexCode(value);
        }
      });
  }

  private normalizeHexCode(hex: string): string {
    hex = hex.trim();

    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }

    return hex.toUpperCase();
  }

  private isValidHexCode(hex: string): boolean {
    const hexPattern = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexPattern.test(hex);
  }

  private addColor(): void {
    this.isUpdatingData = true;
    this._colorService
      .addColor(this.form.value)
      .pipe(
        catchError((error) => {
          return this.onCatchError(true);
        })
      )
      .subscribe((color: Color) => {
        if (color.id) {
          this.onColorAdded(color);
        }
      });
  }

  private updateColor(): void {
    this.isUpdatingData = true;
    const updateModel: UpdateColor = {
      color: {
        id: this.data.color!.id,
        name: this.name?.value,
        hexCode: this.hexCode?.value,
      },
    };
    this._colorService
      .updateColor(updateModel)
      .pipe(
        catchError((error) => {
          return this.onCatchError(false);
        })
      )
      .subscribe((color: Color) => {
        if (color.id) {
          this.onColorUpdated(color);
        }
      });
  }

  private onColorAdded(color: Color): void {
    this.isUpdatingData = false;

    this._translate.get('toastrs.colorAdded').subscribe((resp: string) => {
      this.showSuccess(resp);
    });

    this._dialogRef.close(color);
  }

  private onColorUpdated(color: Color): void {
    this.isUpdatingData = false;

    this._translate.get('toastrs.colorUpdated').subscribe((resp: string) => {
      this.showSuccess(resp);
    });

    this._dialogRef.close(color);
  }

  private onCatchError(isAddingError: boolean): Observable<any> {
    this.isUpdatingData = false;

    if (isAddingError) {
      this._translate
        .get('toastrs.colorAddedError')
        .subscribe((resp: string) => {
          this.showError(resp);
        });
    } else {
      this._translate
        .get('toastrs.colorUpdatedError')
        .subscribe((resp: string) => {
          this.showError(resp);
        });
    }

    return of({});
  }

  private showSuccess(text: string): void {
    this._toastr.success(`${text}`);
  }

  private showError(text: string): void {
    this._toastr.error(`${text}`);
  }

  private initializeForm(): void {
    this.form = this._builder.group({
      name: new FormControl(this.data.color?.name, [Validators.required]),
      hexCode: new FormControl(this.data.color?.hexCode, [Validators.required]),
    });
  }

  get name() {
    return this.form.get('name');
  }

  get hexCode() {
    return this.form.get('hexCode');
  }
}
