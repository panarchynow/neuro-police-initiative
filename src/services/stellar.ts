import * as StellarSdk from '@stellar/stellar-sdk'
import { logger } from '../utils/logger'

export interface TokenBalance {
  asset_type: string
  asset_code?: string
  asset_issuer?: string
  balance: string
}

export interface PaymentRecord {
  asset_type: string
  asset_code?: string
  asset_issuer?: string
  from: string
  to: string
  created_at: string
}

export class StellarService {
  private readonly server: StellarSdk.Horizon.Server
  private readonly network: string

  constructor (isTestnet: boolean = true) {
    this.network = isTestnet ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC
    const url = isTestnet
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org'

    this.server = new StellarSdk.Horizon.Server(url)
    StellarSdk.Config.setDefault()
    logger.info(`Using Stellar ${this.network} network`)
  }

  async getAccountBalances (accountId: string): Promise<TokenBalance[]> {
    try {
      const account = await this.server.loadAccount(accountId)
      return account.balances
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error, `Failed to get balances for account ${accountId}`)
        throw new Error(`Stellar error: ${error.message}`)
      }
      throw error
    }
  }

  async getBalance (accountId: string, assetCode: string, assetIssuer?: string): Promise<string> {
    const balances = await this.getAccountBalances(accountId)
    const asset = assetCode === 'XLM' 
      ? StellarSdk.Asset.native()
      : typeof assetIssuer === 'string'
        ? new StellarSdk.Asset(assetCode, assetIssuer)
        : undefined

    const balance = balances.find(b => {
      if (asset === undefined) {
        return b.asset_code === assetCode
      }

      if (asset.isNative()) {
        return b.asset_type === 'native'
      }

      return b.asset_code === asset.getCode() && 
        b.asset_issuer === asset.getIssuer()
    })

    if (typeof balance === 'undefined') {
      throw new Error(`Asset ${assetCode} not found for account ${accountId}`)
    }

    return balance.balance
  }

  async getDataValue (accountId: string, key: string): Promise<string | null> {
    try {
      const account = await this.server.loadAccount(accountId)
      return account.data_attr[key] 
        ? Buffer.from(account.data_attr[key], 'base64').toString()
        : null
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error, `Failed to get data value for account ${accountId} and key ${key}`)
        throw new Error(`Stellar error: ${error.message}`)
      }
      throw error
    }
  }

  async getTransactions (accountId: string, since: Date): Promise<PaymentRecord[]> {
    try {
      const result: PaymentRecord[] = []
      let lastCursor: string | undefined
      let page = 1

      logger.debug({ accountId, since }, 'Starting transaction search')

      while (true) {
        logger.debug({ page, lastCursor }, 'Loading transactions page')

        const payments = await this.server
          .payments()
          .forAccount(accountId)
          .limit(100)
          .order('desc')
          .cursor(lastCursor ?? 'now')
          .call()

        const records = payments.records
          .filter(payment => {
            const createdAt = new Date(payment.created_at)
            return createdAt >= since && 'type' in payment && payment.type === 'payment'
          })
          .map(payment => {
            const p = payment as any
            return {
              asset_type: p.asset_type,
              asset_code: p.asset_code,
              asset_issuer: p.asset_issuer,
              from: p.from,
              to: p.to,
              created_at: p.created_at
            }
          })

        result.push(...records)

        logger.debug({
          page,
          total: result.length,
          pageSize: records.length
        }, 'Page loaded')

        // Если нет следующей страницы или последняя транзакция старше since, останавливаемся
        if (!payments.records.length || new Date(payments.records[payments.records.length - 1].created_at) < since) {
          break
        }

        lastCursor = payments.records[payments.records.length - 1].paging_token
        page++
      }

      logger.debug({ total: result.length }, 'Transaction search completed')

      return result
    } catch (error) {
      if (error instanceof Error) {
        logger.error(error, `Failed to get transactions for account ${accountId}`)
        throw new Error(`Stellar error: ${error.message}`)
      }
      throw error
    }
  }
}
