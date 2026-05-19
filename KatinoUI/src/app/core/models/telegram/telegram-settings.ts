import { TelegramChatConfig } from './telegram-chat-config';

export interface TelegramSettings {
  isConfigured: boolean;
  botTokenMasked?: string;
  chatConfigs: TelegramChatConfig[];
}
