import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EventPeriodService } from './core/services/event-period.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'KatinoUI';
  showConfetti = false;

  constructor(
    private _translate: TranslateService,
    private _eventPeriod: EventPeriodService,
  ) {}

  ngOnInit() {
    let lang = localStorage.getItem('language');
    if (lang === null) {
      lang = 'ua';
      localStorage.setItem('language', lang);
    }

    this._translate.setDefaultLang(lang);
    this._translate.use(lang);

    this.showConfetti = this._eventPeriod.isBirthdayPeriod();
  }
}
