import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EventPeriodService {
  /** Returns true on April 15 and 16 every year (owner's birthday). */
  public isBirthdayPeriod(): boolean {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-based
    const day = now.getDate();
    return month === 4 && (day === 15 || day === 16);
  }
}
