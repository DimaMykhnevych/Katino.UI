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
    let lang = localStorage.getItem('language');
    if (lang === null) {
      lang = 'ua';
      localStorage.setItem('language', lang);
    }

    this._translate.setDefaultLang(lang);
    this._translate.use(lang);
  }
}
