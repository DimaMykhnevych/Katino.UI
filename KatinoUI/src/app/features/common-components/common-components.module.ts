import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/layout/material';
import { CoreModule } from 'src/app/core/core.module';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SpinnerModule } from 'src/app/layout/spinner/spinner.module';
import { NpWarehouseSelectionComponent } from './components/np-warehouse-selection/np-warehouse-selection.component';

@NgModule({
  declarations: [NpWarehouseSelectionComponent],
  imports: [
    CommonModule,
    MaterialModule,
    CoreModule,
    TranslateModule,
    ReactiveFormsModule,
    SpinnerModule,
  ],
  exports: [NpWarehouseSelectionComponent],
})
export class CommonComponentsModule {}
