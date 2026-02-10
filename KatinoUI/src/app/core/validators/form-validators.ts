import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class FormValidators {
  public static notInPastDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = control.value;
      if (!v) {
        return null;
      }

      const d = new Date(v);
      if (isNaN(d.getTime())) return { invalidDate: true };

      const selected = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      return selected < today ? { dateInPast: true } : null;
    };
  }
}
