import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject, of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { CheckboxAccount } from 'src/app/core/models/checkbox/checkbox-account';
import { NpApiKey } from 'src/app/core/models/nova-post/np-api-key';
import { Roles } from 'src/app/core/models/roles';
import { CurrentUserService } from 'src/app/core/permission/services';
import { CheckboxAccountService } from 'src/app/features/common-services/checkbox-account.service';
import { NovaPostService } from 'src/app/features/common-services/nova-post.service';
import { UIDialogService } from 'src/app/layout/dialogs/services/ui-dialog.service';

const DEFAULT_TAX_CODE = 8;
const KNOWN_ERRORS = [
  'checkboxAccountInvalid',
  'checkboxAccountDuplicate',
  'checkboxAccountNotFound',
  'npApiKeyNotFound',
  'checkboxValidationUnavailable',
];

// One Checkbox cash register account per Nova Post API key. Owner sees the list, Admin manages it.
@Component({
  selector: 'app-checkbox-accounts',
  templateUrl: './checkbox-accounts.component.html',
  styleUrls: ['./checkbox-accounts.component.scss'],
})
export class CheckboxAccountsComponent implements OnInit, OnDestroy {
  public accounts: CheckboxAccount[] = [];
  public npApiKeys: NpApiKey[] = [];
  public isAdmin = false;
  public isLoading = false;
  public isSaving = false;
  public deactivatingId: string | null = null;

  // form is null while closed; editedAccount is null while adding
  public form: FormGroup | null = null;
  public editedAccount: CheckboxAccount | null = null;

  private _destroy$ = new Subject<void>();

  constructor(
    private _checkboxAccountService: CheckboxAccountService,
    private _novaPostService: NovaPostService,
    private _currentUserService: CurrentUserService,
    private _uiDialogService: UIDialogService,
    private _toastr: ToastrService,
    private _translate: TranslateService,
    private _fb: FormBuilder,
  ) {}

  public ngOnInit(): void {
    this.isAdmin = this._currentUserService.userInfo?.role === Roles.Admin;
    this.loadAccounts();
    if (this.isAdmin) {
      this._novaPostService
        .getNpApiKeys()
        .pipe(
          catchError(() => of([] as NpApiKey[])),
          takeUntil(this._destroy$),
        )
        .subscribe((keys) => (this.npApiKeys = keys));
    }
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public get isAdding(): boolean {
    return !!this.form && !this.editedAccount;
  }

  public onAdd(): void {
    this.editedAccount = null;
    this.form = this._fb.group({
      npApiKeyId: [null, Validators.required],
      licenseKey: [
        '',
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(256),
        ],
      ],
      cashierLogin: ['', [Validators.required, Validators.maxLength(200)]],
      cashierPassword: ['', [Validators.required, Validators.maxLength(200)]],
      taxCode: [
        DEFAULT_TAX_CODE,
        [Validators.required, Validators.min(1), Validators.max(99)],
      ],
    });
  }

  public onEdit(account: CheckboxAccount): void {
    this.editedAccount = account;
    // Secrets are never returned: an empty input keeps the stored value
    this.form = this._fb.group({
      licenseKey: ['', [Validators.minLength(4), Validators.maxLength(256)]],
      cashierLogin: [
        account.cashierLogin,
        [Validators.required, Validators.maxLength(200)],
      ],
      cashierPassword: ['', Validators.maxLength(200)],
      taxCode: [
        account.taxCode,
        [Validators.required, Validators.min(1), Validators.max(99)],
      ],
    });
  }

  public onCancel(): void {
    this.form = null;
    this.editedAccount = null;
  }

  public onSave(): void {
    if (!this.form || this.form.invalid || this.isSaving) return;

    const v = this.form.value;
    const edited = this.editedAccount;
    // On edit, null means "unchanged"
    const request$: Observable<CheckboxAccount> = edited
      ? this._checkboxAccountService.updateAccount(edited.id, {
          licenseKey: v.licenseKey || null,
          cashierLogin:
            v.cashierLogin && v.cashierLogin !== edited.cashierLogin
              ? v.cashierLogin
              : null,
          cashierPassword: v.cashierPassword || null,
          taxCode: v.taxCode !== edited.taxCode ? v.taxCode : null,
        })
      : this._checkboxAccountService.addAccount({
          npApiKeyId: v.npApiKeyId,
          licenseKey: v.licenseKey,
          cashierLogin: v.cashierLogin,
          cashierPassword: v.cashierPassword,
          taxCode: v.taxCode,
        });

    this.isSaving = true;
    request$
      .pipe(
        finalize(() => (this.isSaving = false)),
        takeUntil(this._destroy$),
      )
      .subscribe({
        next: () => {
          this._toastr.success(
            this._translate.instant('checkboxAccounts.saved'),
          );
          this.onCancel();
          this.loadAccounts();
        },
        error: (err: HttpErrorResponse) => this.showError(err),
      });
  }

  public onDeactivate(account: CheckboxAccount): void {
    this._uiDialogService
      .openConfirmationDialog({
        titleKey: 'checkboxAccounts.deactivateTitle',
        contentKey: 'checkboxAccounts.deactivateConfirm',
        contentParams: { owner: account.npApiKeyOwnerFullName },
        confirmButtonTextKey: 'checkboxAccounts.deactivate',
        cancelButtonTextKey: 'common.cancel',
        type: 'danger',
        icon: 'block',
      })
      .afterClosed()
      .subscribe((confirmed: string) => {
        if (confirmed !== 'true') return;

        this.deactivatingId = account.id;
        this._checkboxAccountService
          .deactivateAccount(account.id)
          .pipe(
            finalize(() => (this.deactivatingId = null)),
            takeUntil(this._destroy$),
          )
          .subscribe({
            next: () => {
              if (this.editedAccount?.id === account.id) this.onCancel();
              this.loadAccounts();
            },
            error: (err: HttpErrorResponse) => {
              this.showError(err);
              this.loadAccounts();
            },
          });
      });
  }

  private loadAccounts(): void {
    this.isLoading = true;
    this._checkboxAccountService
      .getAccounts()
      .pipe(
        catchError(() => {
          this._toastr.error(
            this._translate.instant('checkboxAccounts.loadFailed'),
          );
          return of([] as CheckboxAccount[]);
        }),
        finalize(() => (this.isLoading = false)),
        takeUntil(this._destroy$),
      )
      .subscribe((accounts) => (this.accounts = accounts));
  }

  private showError(err: HttpErrorResponse): void {
    const code: string | undefined = err?.error?.error;
    this._toastr.error(
      this._translate.instant(
        code && KNOWN_ERRORS.includes(code)
          ? `checkboxAccounts.errors.${code}`
          : 'checkboxAccounts.errors.unknown',
      ),
    );
  }
}
