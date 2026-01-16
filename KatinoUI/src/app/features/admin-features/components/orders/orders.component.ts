import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit {
  public form: FormGroup = this._builder.group({});
  public isRetrievingData = false;

  constructor(private _builder: FormBuilder) {}

  public ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.form = this._builder.group({
      orderSearchString: new FormControl(),
    });
  }

  get orderSearchString() {
    return this.form.get('orderSearchString');
  }
}
