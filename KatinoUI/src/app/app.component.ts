import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'KatinoUI';

  constructor(private _translate: TranslateService) {}

  ngOnInit() {
    this._translate.setDefaultLang('ua');
    this._translate.use('ua');
  }
}
