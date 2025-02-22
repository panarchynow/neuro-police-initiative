import { telegramMembersConfig } from '@/config/settings'

interface TelegramMembersConfig {
  baseUrl: string
  token: string
}

export interface TelegramUser {
  id: number
  username?: string
  firstName?: string
  lastName?: string
}

export interface TelegramChat {
  id: number
  title: string
  members: TelegramUser[]
}

export class TelegramMembersService {
  private readonly config: TelegramMembersConfig

  constructor (config?: Partial<TelegramMembersConfig>) {
    this.config = {
      baseUrl: config?.baseUrl ?? telegramMembersConfig.baseUrl,
      token: config?.token ?? telegramMembersConfig.token
    }

    if (this.config.token === '') {
      throw new Error('TELEGRAM_MEMBERS_TOKEN is required')
    }
  }

  async getChatMembers (chatId: number): Promise<TelegramUser[]> {
    const response = await fetch(`${this.config.baseUrl}/chats/${chatId}`, {
      headers: {
        Authorization: `Bearer ${this.config.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get chat members: ${response.statusText}`)
    }

    const data = await response.json() as TelegramChat
    return data.members
  }

  async getUserChats (userId: number): Promise<TelegramChat[]> {
    const response = await fetch(`${this.config.baseUrl}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${this.config.token}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get user chats: ${response.statusText}`)
    }

    return await response.json() as TelegramChat[]
  }
} 