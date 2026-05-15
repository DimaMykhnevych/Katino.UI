import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TelegramBotInfo } from 'src/app/core/models/telegram/telegram-bot-info';
import { TelegramChat } from 'src/app/core/models/telegram/telegram-chat';
import { TelegramSettings } from 'src/app/core/models/telegram/telegram-settings';
import { UpdateTelegramSettingsCommand } from 'src/app/core/models/telegram/update-telegram-settings';
import { AppSettings } from 'src/app/core/settings';

@Injectable({
  providedIn: 'root',
})
export class TelegramService {
  constructor(private _http: HttpClient) {}

  public getTelegramSettings(): Observable<TelegramSettings> {
    return this._http.get<TelegramSettings>(
      `${AppSettings.apiHost}/Telegram/settings`,
    );
  }

  public updateTelegramSettings(
    command: UpdateTelegramSettingsCommand,
  ): Observable<boolean> {
    return this._http.put<boolean>(
      `${AppSettings.apiHost}/Telegram/settings`,
      command,
    );
  }

  public validateBotToken(token: string): Observable<TelegramBotInfo> {
    return this._http.get<TelegramBotInfo>(
      `${AppSettings.apiHost}/Telegram/validate-bot?token=${token}`,
    );
  }

  public getChats(token: string): Observable<TelegramChat[]> {
    return this._http.get<TelegramChat[]>(
      `${AppSettings.apiHost}/Telegram/chats?token=${token}`,
    );
  }

  public sendTestMessage(): Observable<boolean> {
    return this._http.post<boolean>(
      `${AppSettings.apiHost}/Telegram/test-message`,
      {},
    );
  }
}
