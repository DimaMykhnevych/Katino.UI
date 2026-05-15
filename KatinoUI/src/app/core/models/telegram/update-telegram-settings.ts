export interface UpdateTelegramSettingsCommand {
  botToken?: string;
  chatId?: string;
  notificationsEnabled: boolean;
}
