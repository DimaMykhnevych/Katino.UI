import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AddCrmSettingsCommand } from 'src/app/core/models/crm-settings/add-crm-settings-command';
import { UpdateCrmSettingsCommand } from 'src/app/core/models/crm-settings/update-crm-settings-command';
import { CrmUserSettings } from 'src/app/core/models/crm-user-settings';
import { NpCityResponse } from 'src/app/core/models/nova-post/np-city-response';
import { NpWarehouse } from 'src/app/core/models/nova-post/np-warehouse';
import { TelegramBotInfo } from 'src/app/core/models/telegram/telegram-bot-info';
import { TelegramChat } from 'src/app/core/models/telegram/telegram-chat';
import { TelegramSettings } from 'src/app/core/models/telegram/telegram-settings';
import { NpWarehouseSelectionComponent } from 'src/app/features/common-components/components/np-warehouse-selection/np-warehouse-selection.component';
import { CrmSettingsService } from 'src/app/features/common-services/crm-settings.service';
import { TelegramService } from '../../services/telegram.service';

@Component({
  selector: 'app-crm-settings',
  templateUrl: './crm-settings.component.html',
  styleUrls: ['./crm-settings.component.scss'],
})
export class CrmSettingsComponent implements OnInit, OnDestroy {
  @ViewChild(NpWarehouseSelectionComponent)
  npWarehouseSelection?: NpWarehouseSelectionComponent;

  public npForm?: FormGroup;

  public initialCity: NpCityResponse | null = null;
  public initialWarehouse: NpWarehouse | null = null;

  public hasSettings = false;
  public settingsId: string | null = null;

  public isSubmitting = false;
  public isNpSyncInProgress = false;

  // Telegram
  public telegramSettings: TelegramSettings | null = null;
  public telegramForm!: FormGroup;
  public validatedBotInfo: TelegramBotInfo | null = null;
  public availableChats: TelegramChat[] = [];
  public isEditingToken = false;
  public isEditingChat = false;
  public isLoadingTelegram = false;
  public isValidatingToken = false;
  public isLoadingChats = false;
  public isSavingTelegram = false;
  public isSendingTest = false;

  private _destroy$ = new Subject<void>();

  constructor(
    private _crmUserSettingsService: CrmSettingsService,
    private _telegramService: TelegramService,
    private _toastr: ToastrService,
    private _translate: TranslateService,
    private _fb: FormBuilder,
  ) {}

  public ngOnInit(): void {
    this.loadSettings();
    this.loadTelegramSettings();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  public onNpFormReady(form: FormGroup): void {
    this.npForm = form;
  }

  public get canSaveOrUpdate(): boolean {
    return (
      !!this.npForm &&
      this.npForm.valid &&
      !this.npForm.pristine &&
      !this.isSubmitting &&
      !this.isNpSyncInProgress
    );
  }

  public onSaveOrUpdate(): void {
    if (!this.npForm || this.npForm.invalid) return;

    const city = this.npForm.get('city')?.value as NpCityResponse | null;
    const warehouse = this.npForm.get('warehouse')?.value as NpWarehouse | null;

    if (!city || !warehouse) return;

    this.isSubmitting = true;

    if (!this.hasSettings) {
      const payload: AddCrmSettingsCommand = {
        userSettings: {
          npCity: { present: city.present, deliveryCity: city.deliveryCity },
          npWarehouseId: warehouse.id,
        },
      };

      this._crmUserSettingsService
        .createCrmSettings(payload)
        .pipe(
          catchError(() => {
            this.isSubmitting = false;
            return of(null);
          }),
          takeUntil(this._destroy$)
        )
        .subscribe((ok: boolean | null) => {
          if (!ok) {
            this.isSubmitting = false;
            return;
          }
          this.loadSettingsAfterSave();
        });

      return;
    }

    const payload: UpdateCrmSettingsCommand = {
      userSettings: {
        id: this.settingsId!,
        npCity: { present: city.present, deliveryCity: city.deliveryCity },
        npWarehouseId: warehouse.id,
      },
    };

    this._crmUserSettingsService
      .updateCrmSettings(payload)
      .pipe(
        catchError(() => {
          this.isSubmitting = false;
          return of(null);
        }),
        takeUntil(this._destroy$)
      )
      .subscribe((ok: boolean | null) => {
        if (!ok) {
          this.isSubmitting = false;
          return;
        }
        this.loadSettingsAfterSave();
      });
  }

  public onDelete(): void {
    if (!this.settingsId) return;

    this.isSubmitting = true;

    this._crmUserSettingsService
      .deleteCrmSettings(this.settingsId)
      .pipe(
        catchError(() => {
          this.isSubmitting = false;
          return of(null);
        }),
        takeUntil(this._destroy$)
      )
      .subscribe(() => {
        this.isSubmitting = false;

        this.hasSettings = false;
        this.settingsId = null;
        this.initialCity = null;
        this.initialWarehouse = null;

        this.npWarehouseSelection?.resetToInitial();
      });
  }

  public onReset(): void {
    this.npWarehouseSelection?.resetToInitial();
  }

  public onSyncInProgressChanged(isInProgress: boolean): void {
    this.isNpSyncInProgress = isInProgress;
  }

  // ─── Telegram ────────────────────────────────────────────────────────────────

  public get isConfigured(): boolean {
    return this.telegramSettings?.isConfigured ?? false;
  }

  public get canValidateToken(): boolean {
    return !!this.telegramForm?.get('botToken')?.value && !this.isValidatingToken;
  }

  public get canFindChats(): boolean {
    if (this.isLoadingChats) return false;
    // In State B editing chat without changing token: allow — backend uses stored token
    if (this.isConfigured && this.isEditingChat && !this.isEditingToken) return true;
    return this.validatedBotInfo !== null;
  }

  public get canSaveTelegram(): boolean {
    if (this.isSavingTelegram) return false;

    if (!this.isConfigured) {
      return this.validatedBotInfo !== null && !!this.telegramForm?.get('chatId')?.value;
    }

    if (this.isEditingToken && !this.validatedBotInfo) return false;

    const chatId = this.isEditingChat
      ? this.telegramForm?.get('chatId')?.value
      : this.telegramSettings?.chatId;
    return !!chatId;
  }

  public loadTelegramSettings(): void {
    this.isLoadingTelegram = true;
    this._telegramService
      .getTelegramSettings()
      .pipe(
        catchError(() => of(null)),
        takeUntil(this._destroy$),
      )
      .subscribe((settings: TelegramSettings | null) => {
        this.isLoadingTelegram = false;
        this.telegramSettings = settings;
        this.initTelegramForm(settings);
      });
  }

  public onValidateBot(): void {
    const token = this.telegramForm.get('botToken')?.value;
    if (!token) return;

    this.isValidatingToken = true;
    this.validatedBotInfo = null;

    this._telegramService
      .validateBotToken(token)
      .pipe(
        catchError((err) => {
          const msg = err?.error?.message ?? this._t('telegram.toastr.validateError');
          this._toastr.error(msg);
          this.isValidatingToken = false;
          return of(null);
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((info: TelegramBotInfo | null) => {
        this.isValidatingToken = false;
        if (info) {
          this.validatedBotInfo = info;
        }
      });
  }

  public onLoadChats(): void {
    // In State B editing chat without new token, pass empty string — backend uses stored token
    const token: string = this.telegramForm.get('botToken')?.value ?? '';

    // In State A, require validated bot before loading chats
    if (!this.isConfigured && !this.validatedBotInfo) return;

    this.isLoadingChats = true;
    this._telegramService
      .getChats(token)
      .pipe(
        catchError(() => {
          this.isLoadingChats = false;
          this._toastr.error(this._t('telegram.toastr.loadChatsError'));
          return of([] as TelegramChat[]);
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((chats: TelegramChat[]) => {
        this.isLoadingChats = false;
        this.availableChats = chats;
        if (chats.length === 0) {
          this._toastr.warning(this._t('telegram.toastr.noChatsWarning'));
        } else {
          this.telegramForm.get('chatId')?.enable();
        }
      });
  }

  public onSaveTelegram(): void {
    const notificationsEnabled = !!this.telegramForm.get('notificationsEnabled')?.value;

    const chatId = this.isConfigured && !this.isEditingChat
      ? this.telegramSettings?.chatId
      : this.telegramForm.get('chatId')?.value?.toString();

    const botToken = !this.isConfigured || (this.isEditingToken && this.validatedBotInfo)
      ? (this.telegramForm.get('botToken')?.value ?? null)
      : null;

    this.isSavingTelegram = true;

    this._telegramService
      .updateTelegramSettings({ botToken, chatId, notificationsEnabled })
      .pipe(
        catchError(() => {
          this.isSavingTelegram = false;
          this._toastr.error(this._t('telegram.toastr.saveError'));
          return of(null);
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((ok: boolean | null) => {
        this.isSavingTelegram = false;
        if (ok === null) return;
        this._toastr.success(this._t('telegram.toastr.saveSuccess'));
        this.isEditingToken = false;
        this.isEditingChat = false;
        this.validatedBotInfo = null;
        this.availableChats = [];
        this.loadTelegramSettings();
      });
  }

  public onSendTestMessage(): void {
    this.isSendingTest = true;

    this._telegramService
      .sendTestMessage()
      .pipe(
        catchError(() => {
          this.isSendingTest = false;
          this._toastr.error(this._t('telegram.toastr.testError'));
          return of(null);
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((ok: boolean | null) => {
        this.isSendingTest = false;
        if (ok === null) return;
        this._toastr.success(this._t('telegram.toastr.testSuccess'));
      });
  }

  public onChangeToken(): void {
    this.isEditingToken = true;
    this.validatedBotInfo = null;
    this.telegramForm.get('botToken')?.setValue('');
  }

  public onChangeChat(): void {
    this.isEditingChat = true;
    this.availableChats = [];
    this.telegramForm.get('chatId')?.setValue('');
    this.telegramForm.get('chatId')?.disable();
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private initTelegramForm(settings: TelegramSettings | null): void {
    this.telegramForm = this._fb.group({
      botToken: [''],
      chatId: [{ value: settings?.chatId ?? '', disabled: true }],
      notificationsEnabled: [settings?.notificationsEnabled ?? false],
    });
  }

  private loadSettingsAfterSave(): void {
    this._crmUserSettingsService
      .getCrmSettings()
      .pipe(
        catchError(() => {
          this.isSubmitting = false;
          return of(null);
        }),
        takeUntil(this._destroy$)
      )
      .subscribe((resp: CrmUserSettings | null) => {
        this.isSubmitting = false;
        if (!resp) return;

        this.applyLoadedSettings(resp);
        this.npWarehouseSelection?.resetToInitial();
      });
  }

  private loadSettings(): void {
    this._crmUserSettingsService
      .getCrmSettings()
      .pipe(
        catchError(() => of(null)),
        takeUntil(this._destroy$)
      )
      .subscribe((resp: CrmUserSettings | null) => {
        if (!resp) return;
        this.applyLoadedSettings(resp);
        this.npWarehouseSelection?.resetToInitial();
      });
  }

  private applyLoadedSettings(resp: CrmUserSettings): void {
    this.hasSettings = !!resp?.id;
    this.settingsId = resp?.id ?? null;

    this.initialCity = resp.npCity ?? null;
    this.initialWarehouse = resp.npWarehouse ?? null;
  }

  private _t(key: string): string {
    return this._translate.instant(key);
  }
}
