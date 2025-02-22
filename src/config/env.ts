import { config as dotenv } from 'dotenv'

dotenv()

export const config = {
  telegramMembers: {
    token: process.env.TELEGRAM_MEMBERS_TOKEN ?? '',
    baseUrl: process.env.TELEGRAM_MEMBERS_BASE_URL ?? 'https://tg-members.mtla.me'
  }
} 