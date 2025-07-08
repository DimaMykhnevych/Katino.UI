import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthModule } from './auth/auth.module';

@NgModule({
  declarations: [],
  imports: [CommonModule, AuthModule.forRoot()],
})
export class CoreModule {}
