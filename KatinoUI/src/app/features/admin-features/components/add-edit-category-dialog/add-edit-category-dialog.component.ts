import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Observable, of, Subject } from 'rxjs';
import { AddEditCategoryData } from '../../models/add-edit-category-data';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CategoryService } from '../../services/category.service';
import { catchError } from 'rxjs/operators';
import { Category } from 'src/app/core/models/category';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { UpdateCategory } from '../../models/update-category';

@Component({
  selector: 'app-add-edit-category-dialog',
  templateUrl: './add-edit-category-dialog.component.html',
  styleUrls: ['./add-edit-category-dialog.component.scss'],
})
export class AddEditCategoryDialogComponent implements OnInit, OnDestroy {
  private _destroy$: Subject<void> = new Subject<void>();

  public form: FormGroup = this._builder.group({});

  public data: AddEditCategoryData;
  public isRetrievingData: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: AddEditCategoryData,
    private _builder: FormBuilder,
    private _dialogRef: MatDialogRef<AddEditCategoryDialogComponent>,
    private _categoryService: CategoryService,
    private _toastr: ToastrService,
    private _translate: TranslateService
  ) {
    this.data = data;
  }

  public ngOnInit(): void {
    this.initializeForm();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onAddEditClick(): void {
    if (this.data.isAdding) {
      this.addCategory();
    } else {
      this.updateCategory();
    }
  }

  private addCategory(): void {
    this.isRetrievingData = true;
    this._categoryService
      .addCategory(this.form.value)
      .pipe(
        catchError((error) => {
          return this.onCatchError(true);
        })
      )
      .subscribe((category: Category) => {
        if (category.id) {
          this.onCategoryAdded(category);
        }
      });
  }

  private updateCategory(): void {
    this.isRetrievingData = true;
    const updateModel: UpdateCategory = {
      category: {
        id: this.data.category!.id,
        name: this.name?.value,
        description: this.description?.value,
      },
    };
    this._categoryService
      .updateCategory(updateModel)
      .pipe(
        catchError((error) => {
          return this.onCatchError(false);
        })
      )
      .subscribe((category: Category) => {
        if (category.id) {
          this.onCategoryUpdated(category);
        }
      });
  }

  private onCategoryAdded(category: Category): void {
    this.isRetrievingData = false;

    this._translate.get('toastrs.categoryAdded').subscribe((resp: string) => {
      this.showSuccess(resp);
    });

    this._dialogRef.close(category);
  }

  private onCategoryUpdated(category: Category): void {
    this.isRetrievingData = false;

    this._translate.get('toastrs.categoryUpdated').subscribe((resp: string) => {
      this.showSuccess(resp);
    });

    this._dialogRef.close(category);
  }

  private onCatchError(isAddingError: boolean): Observable<any> {
    this.isRetrievingData = false;

    if (isAddingError) {
      this._translate
        .get('toastrs.categoryAddedError')
        .subscribe((resp: string) => {
          this.showError(resp);
        });
    } else {
      this._translate
        .get('toastrs.categoryUpdatedError')
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
      name: new FormControl(this.data.category?.name, [Validators.required]),
      description: new FormControl(this.data.category?.description),
    });
  }

  get name() {
    return this.form.get('name');
  }

  get description() {
    return this.form.get('description');
  }
}
