import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'src/app/layout/material';
import { TagAutocompleteComponent } from './tag-autocomplete.component';

@NgModule({
  declarations: [TagAutocompleteComponent],
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, TranslateModule],
  exports: [TagAutocompleteComponent],
})
export class TagAutocompleteModule {}
