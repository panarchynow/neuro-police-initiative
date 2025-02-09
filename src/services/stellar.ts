import * as StellarSdk from '@stellar/stellar-sdk'
import { logger } from '../utils/logger'

export interface TokenBalance {
  asset_type: string
  asset_code?: string
  asset_issuer?: string
  balance: string
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
}
