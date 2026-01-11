import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MaterialModule } from './layout/material';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ToastrModule } from 'ngx-toastr';
import { CoreModule } from './core/core.module';
import { AdminFeaturesModule } from './features/admin-features/admin-features.module';
import { EmailConfirmationModule } from './features/email-confirmation/email-confirmation.module';
import { NavbarModule } from './layout/navbar/navbar.module';
import { SidenavModule } from './layout/sidenav/sidenav.module';
import { SpinnerModule } from './layout/spinner/spinner.module';
import { DialogsModule } from './layout/dialogs/dialogs.module';
import { CommonComponentsModule } from './features/common-components/common-components.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (http: HttpClient) =>
          new TranslateHttpLoader(http, './assets/i18n/', '.json'),
        deps: [HttpClient],
      },
    }),
    ToastrModule.forRoot(),
    CoreModule,
    AdminFeaturesModule,
    EmailConfirmationModule,
    NavbarModule,
    SidenavModule,
    SpinnerModule,
    DialogsModule,
    CommonComponentsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
