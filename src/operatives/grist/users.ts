import { GristService } from '@/services/grist/service'
import { MTLGrist } from '@/services/grist/types'
import { logger } from '@/utils/logger'

export class UsersOperative {
  private readonly service: GristService

  constructor (service?: GristService) {
    this.service = service ?? new GristService()
  }

  private formatUsername (username: string): string {
    return username.startsWith('@') ? username : `@${username}`
  }

  async getStellarByTelegram (username: string): Promise<string | null> {
    try {
      const formattedUsername = this.formatUsername(username)
      const users = await this.service.fetchData(MTLGrist.USERS, undefined, {
        Telegram: [formattedUsername]
      })

      if (users.length === 0) {
        return null
      }

      return users[0].Stellar as string
    } catch (error) {
      logger.error({ error, username }, 'Failed to get Stellar address by Telegram username')
      throw error
    }
  }

  static async cli (): Promise<void> {
    try {
      const username = process.argv[4]
      if (!username) {
        console.error('Usage: bun run npi users stellar-by-telegram <username>')
        process.exit(1)
      }

      const operative = new UsersOperative()
      const address = await operative.getStellarByTelegram(username)

      if (address) {
        console.log('Stellar address:', address)
      } else {
        console.log('User not found')
        process.exit(1)
      }
    } catch (error) {
      console.error('Failed to get Stellar address:', error)
      process.exit(1)
    }
  }
} 