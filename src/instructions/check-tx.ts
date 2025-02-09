import { BaseInstruction, InstructionParams, InstructionResult } from '../core/instruction'
import { StellarService } from '../services/stellar'
import { logger } from '../utils/logger'

export interface CheckTxParams extends InstructionParams {
  account: string
  asset: string
  issuer?: string
  direction?: 'in' | 'out'
  since: string
  counterparty?: string
}

export class CheckTxInstruction extends BaseInstruction {
  name = 'check-tx'
  description = 'Checks if account has specific token transaction'
  requiredParams = ['account', 'asset', 'since']

  constructor (private readonly stellar: StellarService) {
    super()
  }

  async execute (params: CheckTxParams): Promise<InstructionResult> {
    const validationError = this.validateParams(params)
    if (validationError !== null) {
      return {
        success: false,
        message: validationError
      }
    }

    const { account, asset, issuer, direction, since, counterparty } = params

    try {
      const transactions = await this.stellar.getTransactions(account, new Date(since))
      const found = transactions.some(tx => {
        const isAssetMatch = tx.asset_type === 'native'
          ? asset === 'XLM'
          : tx.asset_code === asset && (!issuer || tx.asset_issuer === issuer)

        if (!isAssetMatch) return false

        if (direction === 'in') {
          return tx.to === account && (!counterparty || tx.from === counterparty)
        }

        if (direction === 'out') {
          return tx.from === account && (!counterparty || tx.to === counterparty)
        }

        return !counterparty || tx.from === counterparty || tx.to === counterparty
      })

      logger.debug({
        account,
        asset,
        issuer,
        direction,
        since,
        counterparty,
        found
      }, 'Transaction check result')

      return {
        success: found,
        message: found
          ? 'Transaction found'
          : 'No matching transaction found',
        details: {
          account,
          asset,
          issuer,
          direction,
          since,
          counterparty
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