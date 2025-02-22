import { TelegramMembersService } from '@/services/telegram-members'
import { logger } from '@/utils/logger'

export class ManagementOperative {
  private readonly service: TelegramMembersService
  private readonly chatId = -1001798357244

  constructor (service?: TelegramMembersService) {
    this.service = service ?? new TelegramMembersService()
  }

  async getMembers (): Promise<string[]> {
    try {
      const members = await this.service.getChatMembers(this.chatId)
      return members.map(member => member.username ?? `id:${member.id}`)
    } catch (error) {
      logger.error({ error, chatId: this.chatId }, 'Failed to get management members')
      throw error
    }
  }

  static async cli (): Promise<void> {
    try {
      const operative = new ManagementOperative()
      const members = await operative.getMembers()
      console.log('Management members:', members.join(', '))
    } catch (error) {
      console.error('Failed to get management members:', error)
      process.exit(1)
    }
  }
} 