import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { TelegramNotificationTypeDto } from 'src/app/core/enums/telegram-notification-type';
import { TelegramBotInfo } from 'src/app/core/models/telegram/telegram-bot-info';
import { TelegramChat } from 'src/app/core/models/telegram/telegram-chat';
import { TelegramChatConfig } from 'src/app/core/models/telegram/telegram-chat-config';
import { TelegramSettings } from 'src/app/core/models/telegram/telegram-settings';
import { TelegramService } from '../../../services/telegram.service';

@Component({
  selector: 'app-telegram-settings',
  templateUrl: './telegram-settings.component.html',
  styleUrls: ['./telegram-settings.component.scss'],
})
export class TelegramSettingsComponent implements OnInit, OnDestroy {
  public telegramSettings: TelegramSettings | null = null;
  public telegramForm!: FormGroup;
  public validatedBotInfo: TelegramBotInfo | null = null;
  public availableChats: TelegramChat[] = [];
  public isEditingToken = false;
  public isEditingChatIndex: number | null = null;
  public isLoadingTelegram = false;
  public isValidatingToken = false;
  public isLoadingChats = false;
  public isSavingTelegram = false;
  public isSendingTest = false;

  public readonly notificationTypes = [
    TelegramNotificationTypeDto.sewingReport,
    TelegramNotificationTypeDto.orderRejection,
    // TelegramNotificationTypeDto.stockRedistribution,
  ];
  public readonly notificationTypeTranslationKeys = [
    'telegram.notificationType.sewingReport',
    'telegram.notificationType.orderRejection',
    'telegram.notificationType.stockRedistribution',
  ];

  private _destroy$ = new Subject<void>();

  constructor(
    private _telegramService: TelegramService,
    private _toastr: ToastrService,
    private _translate: TranslateService,
    private _fb: FormBuilder,
  ) {}

  public ngOnInit(): void {
    this.loadTelegramSettings();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  // ─── Getters ─────────────────────────────────────────────────────────────────

  public get isConfigured(): boolean {
    return this.telegramSettings?.isConfigured ?? false;
  }

  public get canValidateToken(): boolean {
    return (
      !!this.telegramForm?.get('botToken')?.value && !this.isValidatingToken
    );
  }

  public get canFindChats(): boolean {
    if (this.isLoadingChats) return false;
    if (
      this.isConfigured &&
      this.isEditingChatIndex !== null &&
      !this.isEditingToken
    )
      return true;
    return this.validatedBotInfo !== null;
  }

  public get canSaveTelegram(): boolean {
    if (this.isSavingTelegram) return false;
    if (!this.isConfigured) return this.validatedBotInfo !== null;
    if (this.isEditingToken && !this.validatedBotInfo) return false;
    return true;
  }

  public get chatConfigsArray(): FormArray {
    return this.telegramForm.get('chatConfigs') as FormArray;
  }

  // ─── Public methods ───────────────────────────────────────────────────────────

  public getChatNameDisplay(index: number): string {
    return (
      this.telegramSettings?.chatConfigs.find(
        (c) => c.notificationType === index,
      )?.chatName ?? ''
    );
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
          const msg =
            err?.error?.message ?? this._t('telegram.toastr.validateError');
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
    const token: string = this.telegramForm.get('botToken')?.value ?? '';
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
        } else if (this.isConfigured && this.isEditingChatIndex !== null) {
          this.chatConfigsArray
            .at(this.isEditingChatIndex)
            .get('chatId')
            ?.enable();
        } else {
          this.chatConfigsArray.controls.forEach((ctrl) =>
            ctrl.get('chatId')?.enable(),
          );
        }
      });
  }

  public onSaveTelegram(): void {
    const botToken =
      !this.isConfigured || (this.isEditingToken && this.validatedBotInfo)
        ? (this.telegramForm.get('botToken')?.value ?? null)
        : null;

    const chatConfigs: TelegramChatConfig[] = this.notificationTypes
      .map((type) => {
        const ctrl = this.chatConfigsArray.at(type);
        const notificationsEnabled = ctrl.get('notificationsEnabled')!
          .value as boolean;
        let chatId: string | undefined;
        let chatName: string | undefined;

        if (this.isConfigured && this.isEditingChatIndex !== type) {
          const existing = this.telegramSettings?.chatConfigs.find(
            (c) => c.notificationType === type,
          );
          chatId = existing?.chatId;
          chatName = existing?.chatName;
        } else {
          const rawId: string = ctrl.get('chatId')?.value ?? '';
          chatId = rawId || undefined;
          chatName = this.availableChats.find(
            (c) => c.id.toString() === chatId,
          )?.title;
        }

        return {
          chatId,
          chatName,
          notificationType: type as TelegramNotificationTypeDto,
          notificationsEnabled,
        };
      })
      .filter((c) => !!c.chatId);

    this.isSavingTelegram = true;

    this._telegramService
      .updateTelegramSettings({ botToken, chatConfigs })
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
        this.isEditingChatIndex = null;
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

  public onChangeChat(index: number): void {
    this.isEditingChatIndex = index;
    this.availableChats = [];
    const ctrl = this.chatConfigsArray.at(index).get('chatId');
    ctrl?.setValue('');
    ctrl?.disable();
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private initTelegramForm(settings: TelegramSettings | null): void {
    const configGroups = this.notificationTypes.map((type) => {
      const existing = settings?.chatConfigs?.find(
        (c) => c.notificationType === type,
      );
      return this._fb.group({
        chatId: [{ value: existing?.chatId ?? '', disabled: true }],
        notificationsEnabled: [existing?.notificationsEnabled ?? false],
      });
    });

    this.telegramForm = this._fb.group({
      botToken: [''],
      chatConfigs: this._fb.array(configGroups),
    });
  }

  private _t(key: string): string {
    return this._translate.instant(key);
  }
}
