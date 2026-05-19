import { TelegramChatConfig } from './telegram-chat-config';

export interface UpdateTelegramSettingsCommand {
  botToken?: string;
  chatConfigs: TelegramChatConfig[];
}
