import { GristService } from '@/services/grist/service'
import { MTLGrist } from '@/services/grist/types'
import { logger } from '@/utils/logger'

interface PersonalToken {
  code: string
  issuer: string
}

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

  async getPersonalToken (identifier: string): Promise<PersonalToken | null> {
    try {
      const users = await this.service.fetchData(MTLGrist.USERS, undefined, {
        ...(identifier.startsWith('@') || !identifier.includes('G')
          ? { Telegram: [this.formatUsername(identifier)] }
          : { Stellar: [identifier] })
      })

      if (users.length === 0) {
        return null
      }

      const user = users[0]
      const code = user['Own_token'] as string
      const issuer = (user['Alt_issuer'] as string) || user.Stellar as string

      if (!code) {
        return null
      }

      return { code, issuer }
    } catch (error) {
      logger.error({ error, identifier }, 'Failed to get personal token info')
      throw error
    }
  }

  static async cli (): Promise<void> {
    try {
      const command = process.argv[3]
      const identifier = process.argv[4]

      if (!identifier || !['stellar-by-telegram', 'personal-token'].includes(command)) {
        console.error('Usage:\nbun run npi users stellar-by-telegram <username>\nbun run npi users personal-token <username or stellar address>')
        process.exit(1)
      }

      const operative = new UsersOperative()

      if (command === 'stellar-by-telegram') {
        const address = await operative.getStellarByTelegram(identifier)
        if (address) {
          console.log('Stellar address:', address)
        } else {
          console.log('User not found')
          process.exit(1)
        }
      } else {
        const token = await operative.getPersonalToken(identifier)
        if (token) {
          console.log('Personal token:', token)
        } else {
          console.log('Personal token not found')
          process.exit(1)
        }
      }
    } catch (error) {
      console.error('Failed:', error)
      process.exit(1)
    }
  }
} 