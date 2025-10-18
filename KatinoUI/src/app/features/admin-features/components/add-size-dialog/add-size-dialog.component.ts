import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { SizeService } from '../../services/size.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef } from '@angular/material/dialog';
import { catchError } from 'rxjs/operators';
import { Size } from 'src/app/core/models/size';

@Component({
  selector: 'app-add-size-dialog',
  templateUrl: './add-size-dialog.component.html',
  styleUrls: ['./add-size-dialog.component.scss'],
})
export class AddSizeDialogComponent implements OnInit, OnDestroy {
  private _destroy$: Subject<void> = new Subject<void>();

  public form: FormGroup = this._builder.group({});

  public isAddingData: boolean = false;

  constructor(
    private _builder: FormBuilder,
    private _dialogRef: MatDialogRef<AddSizeDialogComponent>,
    private _sizeService: SizeService,
    private _toastr: ToastrService,
    private _translate: TranslateService
  ) {}

  public ngOnInit(): void {
    this.initializeForm();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onAddClick(): void {
    this.addSize();
  }

  private addSize(): void {
    this.isAddingData = true;
    this._sizeService
      .addSize(this.form.value)
      .pipe(
        catchError((error) => {
          return this.onCatchError();
        })
      )
      .subscribe((size: Size) => {
        if (size.id) {
          this.onSizeAdded(size);
        }
      });
  }

  private onSizeAdded(size: Size): void {
    this.isAddingData = false;

    this._translate.get('toastrs.sizeAdded').subscribe((resp: string) => {
      this.showSuccess(resp);
    });

    this._dialogRef.close(size);
  }

  private onCatchError(): Observable<any> {
    this.isAddingData = false;

    this._translate.get('toastrs.sizeAddedError').subscribe((resp: string) => {
      this.showError(resp);
    });

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
      name: new FormControl('', [Validators.required]),
    });
  }

  get name() {
    return this.form.get('name');
  }
}
