import { TelegramNotificationTypeDto } from '../../enums/telegram-notification-type';

export interface TelegramChatConfig {
  chatId?: string;
  chatName?: string;
  notificationType: TelegramNotificationTypeDto;
  notificationsEnabled: boolean;
}
