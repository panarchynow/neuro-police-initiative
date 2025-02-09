import { BaseInstruction, InstructionParams, InstructionResult } from '../core/instruction'
import { StellarService } from '../services/stellar'
import { logger } from '../utils/logger'

export interface CheckTokenParams extends InstructionParams {
  account: string
  asset: string
  minAmount: string
  issuer?: string
  comparison?: 'gte' | 'lte' | 'eq'
}

export class CheckTokenInstruction extends BaseInstruction {
  name = 'check-token'
  description = 'Checks if an account holds required amount of specific token'
  requiredParams = ['account', 'asset', 'minAmount']

  constructor (private readonly stellar: StellarService) {
    super()
  }

  private compareAmount (actual: string, expected: string, comparison: string = 'gte'): boolean {
    const actualNum = parseFloat(actual)
    const expectedNum = parseFloat(expected)

    switch (comparison) {
      case 'gte': return actualNum >= expectedNum
      case 'lte': return actualNum <= expectedNum
      case 'eq': return actualNum === expectedNum
      default: return actualNum >= expectedNum
    }
  }

  async execute (params: CheckTokenParams): Promise<InstructionResult> {
    const validationError = this.validateParams(params)
    if (validationError !== null) {
      return {
        success: false,
        message: validationError
      }
    }

    const { account, asset, minAmount, issuer, comparison } = params

    try {
      const balance = await this.stellar.getBalance(account, asset, issuer)
      const hasRequiredAmount = this.compareAmount(balance, minAmount, comparison)

      logger.debug({
        account,
        asset,
        balance,
        required: minAmount,
        comparison
      }, 'Token balance check result')

      return {
        success: hasRequiredAmount,
        message: hasRequiredAmount
          ? 'Token check passed'
          : `Account has insufficient balance: ${balance} ${asset}`,
        details: {
          account,
          asset,
          balance,
          required: minAmount
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
