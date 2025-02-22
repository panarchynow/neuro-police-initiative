export interface GristConfig {
  token: string
  baseUrl: string
}

export interface TelegramMembersConfig {
  token: string
  baseUrl: string
}

export const gristConfig: GristConfig = {
  token: process.env.GRIST_TOKEN ?? '',
  baseUrl: 'https://montelibero.getgrist.com/api/docs'
}

export const telegramMembersConfig: TelegramMembersConfig = {
  token: process.env.TELEGRAM_MEMBERS_TOKEN ?? '',
  baseUrl: 'https://tg-members.mtla.me'
} 