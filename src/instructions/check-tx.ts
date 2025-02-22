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

interface TransactionDetails {
  hash: string
  created_at: string
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
      let lastTransaction: TransactionDetails | undefined

      const found = transactions.some(tx => {
        const isAssetMatch = tx.asset_type === 'native'
          ? asset === 'XLM'
          : tx.asset_code === asset && (!issuer || tx.asset_issuer === issuer)

        if (!isAssetMatch) return false

        if (direction === 'in') {
          if (tx.to === account && (!counterparty || tx.from === counterparty)) {
            lastTransaction = { hash: tx.hash, created_at: tx.created_at }
            return true
          }
          return false
        }

        if (direction === 'out') {
          if (tx.from === account && (!counterparty || tx.to === counterparty)) {
            lastTransaction = { hash: tx.hash, created_at: tx.created_at }
            return true
          }
          return false
        }

        if (!counterparty || tx.from === counterparty || tx.to === counterparty) {
          lastTransaction = { hash: tx.hash, created_at: tx.created_at }
          return true
        }

        return false
      })

      logger.debug({
        account,
        asset,
        issuer,
        direction,
        since,
        counterparty,
        found,
        lastTransaction
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
          counterparty,
          lastTransaction
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