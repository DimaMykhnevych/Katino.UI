import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfettiComponent } from './confetti.component';

@NgModule({
  declarations: [ConfettiComponent],
  imports: [CommonModule],
  exports: [ConfettiComponent],
})
export class ConfettiModule {}
