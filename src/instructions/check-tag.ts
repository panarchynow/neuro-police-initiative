import { BaseInstruction, InstructionParams, InstructionResult } from '../core/instruction'
import { StellarService } from '../services/stellar'
import { logger } from '../utils/logger'

export interface CheckTagParams extends InstructionParams {
  account: string
  key: string
  pairKey?: string
}

export class CheckTagInstruction extends BaseInstruction {
  name = 'check-tag'
  description = 'Checks if two accounts have mutual tags in Manage Data'
  requiredParams = ['account', 'key']

  constructor (private readonly stellar: StellarService) {
    super()
  }

  async execute (params: CheckTagParams): Promise<InstructionResult> {
    const validationError = this.validateParams(params)
    if (validationError !== null) {
      return {
        success: false,
        message: validationError
      }
    }

    const { account, key, pairKey } = params

    try {
      const value = await this.stellar.getDataValue(account, key)
      if (!value) {
        return {
          success: false,
          message: `Account ${account} has no tag with key ${key}`,
          details: { account, key }
        }
      }

      const pairAccount = value
      const pairValue = await this.stellar.getDataValue(pairAccount, pairKey ?? key)

      if (!pairValue) {
        return {
          success: false,
          message: `Pair account ${pairAccount} has no tag with key ${pairKey ?? key}`,
          details: { account, pairAccount, key, pairKey }
        }
      }

      const isPaired = pairValue === account

      logger.debug({
        account,
        pairAccount,
        key,
        pairKey,
        isPaired
      }, 'Tag check result')

      return {
        success: isPaired,
        message: isPaired
          ? 'Tag check passed'
          : `Tag check failed: accounts are not paired`,
        details: {
          account,
          pairAccount,
          key,
          pairKey
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message
        }
      }
      throw error
    }
  }
} 