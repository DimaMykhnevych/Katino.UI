import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/layout/material';
import { CoreModule } from 'src/app/core/core.module';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SpinnerModule } from 'src/app/layout/spinner/spinner.module';
import { NpWarehouseSelectionComponent } from './components/np-warehouse-selection/np-warehouse-selection.component';
import { PhotoOverlayComponent } from './components/photo-overlay/photo-overlay.component';
import { ScrollableTableComponent } from './components/scrollable-table/scrollable-table.component';

@NgModule({
  declarations: [NpWarehouseSelectionComponent, PhotoOverlayComponent, ScrollableTableComponent],
  imports: [
    CommonModule,
    MaterialModule,
    CoreModule,
    TranslateModule,
    ReactiveFormsModule,
    SpinnerModule,
  ],
  exports: [NpWarehouseSelectionComponent, PhotoOverlayComponent, ScrollableTableComponent],
})
export class CommonComponentsModule {}
