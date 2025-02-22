import { BaseProtocol, ProtocolResult } from '@/core/protocol'
import { ManagementOperative } from '@/operatives/telegram/management'
import { UsersOperative } from '@/operatives/grist/users'
import { CheckTxInstruction } from '@/instructions/check-tx'
import { CheckTagInstruction } from '@/instructions/check-tag'
import { StellarService } from '@/services/stellar'
import { logger } from '@/utils/logger'

interface Violation {
  username: string
  stellar?: string
  reason: string[]
}

interface Verification {
  username: string
  stellar: string
  basis: {
    type: 'expert' | 'token_payment'
    details: {
      transactionHash?: string
      date?: string
      tokensAmount?: string
      monthsCovered?: number
      paymentFrom?: string
    }
  }
}

export class DecentralizedManagementMembership extends BaseProtocol {
  name = 'decentralized-management-membership'
  description = 'Checks if users have rights to be in management chat'

  private readonly management: ManagementOperative
  private readonly users: UsersOperative
  private readonly checkTx: CheckTxInstruction
  private readonly checkTag: CheckTagInstruction
  private readonly stellar: StellarService

  private readonly associationAccount = 'GCNVDZIHGX473FEI7IXCUAEXUJ4BGCKEMHF36VYP5EMS7PX2QBLAMTLA'
  private readonly tokensPerMonth = 4

  private expertTags: Map<string, string> = new Map()

  constructor () {
    super()
    this.stellar = new StellarService()
    this.management = new ManagementOperative()
    this.users = new UsersOperative()
    this.checkTx = new CheckTxInstruction(this.stellar)
    this.checkTag = new CheckTagInstruction(this.stellar)
  }

  private async loadExpertTags (): Promise<void> {
    try {
      const data = await this.stellar.getAllData(this.associationAccount)
      const expertTagPattern = /^Expert\d+$/

      for (const [key, value] of Object.entries(data)) {
        if (expertTagPattern.test(key)) {
          this.expertTags.set(key, value)
        }
      }

      logger.debug({ expertTags: Object.fromEntries(this.expertTags) }, 'Expert tags loaded')
    } catch (error) {
      logger.error({ error }, 'Failed to load expert tags')
      throw error
    }
  }

  private isExpert (account: string): boolean {
    return Array.from(this.expertTags.values()).includes(account)
  }

  private async checkTokenPayments (account: string, token: { code: string, issuer: string }): Promise<{ 
    success: boolean
    amount?: string
    monthsCovered?: number
    lastTransaction?: { hash: string, created_at: string, from: string }
  }> {
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const transactions = await this.stellar.getTransactions(account, yearAgo)

    // Фильтруем транзакции с нужным токеном, теперь проверяем только to
    const relevantTransactions = transactions
      .filter(tx => 
        tx.asset_code === token.code &&
        tx.asset_issuer === token.issuer &&
        tx.to === this.associationAccount
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (relevantTransactions.length === 0) {
      return { success: false }
    }

    // Считаем общую сумму токенов
    const totalAmount = await this.stellar.sumPayments(relevantTransactions)
    const monthsCovered = Math.floor(Number(totalAmount) / this.tokensPerMonth)
    const lastPayment = relevantTransactions[0]
    const monthsSinceLastPayment = Math.floor((Date.now() - new Date(lastPayment.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000))

    // Проверяем достаточно ли токенов для покрытия месяцев с последнего платежа
    const success = monthsCovered >= monthsSinceLastPayment

    return {
      success,
      amount: totalAmount,
      monthsCovered,
      lastTransaction: {
        hash: lastPayment.hash,
        created_at: lastPayment.created_at,
        from: lastPayment.from
      }
    }
  }

  async execute (): Promise<ProtocolResult> {
    try {
      await this.loadExpertTags()
      const members = await this.management.getMembers()
      const violations: Violation[] = []
      const verifications: Verification[] = []

      for (const username of members) {
        logger.debug({ username }, 'Checking member')

        const stellar = await this.users.getStellarByTelegram(username)
        if (!stellar) {
          violations.push({
            username,
            reason: ['No Stellar account found']
          })
          continue
        }

        // Check expert tag first
        const isExpert = this.isExpert(stellar)
        logger.debug({ username, stellar, isExpert }, 'Expert check completed')

        if (isExpert) {
          verifications.push({
            username,
            stellar,
            basis: {
              type: 'expert',
              details: {}
            }
          })
          continue
        }

        // If not expert, check token payments
        const token = await this.users.getPersonalToken(username)
        if (!token) {
          violations.push({
            username,
            stellar,
            reason: ['No expert tag and no personal token found']
          })
          continue
        }

        const paymentCheck = await this.checkTokenPayments(stellar, token)

        if (!paymentCheck.success) {
          violations.push({
            username,
            stellar,
            reason: [
              'No expert tag found',
              paymentCheck.amount
                ? `Insufficient token payments: ${paymentCheck.amount} tokens cover only ${paymentCheck.monthsCovered} months`
                : 'No token payments found in last year'
            ]
          })
          continue
        }

        verifications.push({
          username,
          stellar,
          basis: {
            type: 'token_payment',
            details: {
              transactionHash: paymentCheck.lastTransaction?.hash,
              date: paymentCheck.lastTransaction?.created_at,
              tokensAmount: paymentCheck.amount,
              monthsCovered: paymentCheck.monthsCovered,
              paymentFrom: paymentCheck.lastTransaction?.from !== stellar 
                ? paymentCheck.lastTransaction?.from 
                : undefined
            }
          }
        })

        logger.debug({ username, stellar, isExpert, paymentCheck }, 'Member check completed')
      }

      return {
        success: violations.length === 0,
        message: violations.length === 0
          ? 'All members have valid rights'
          : `Found ${violations.length} violations`,
        details: { violations, verifications }
      }
    } catch (error) {
      logger.error({ error }, 'Protocol execution failed')
      throw error
    }
  }

  static async cli (): Promise<void> {
    try {
      const protocol = new DecentralizedManagementMembership()
      const result = await protocol.execute()
      
      if (result.success) {
        console.log('✅ All members have valid rights')
      } else {
        console.log('❌ Found violations:')
        const violations = result.details.violations as Violation[]
        violations.forEach(v => {
          console.log(`\n${v.username} ${v.stellar ?? ''}:`)
          v.reason.forEach(r => console.log(`  - ${r}`))
        })
      }

      console.log('\nVerified members:')
      const verifications = result.details.verifications as Verification[]
      verifications.forEach(v => {
        console.log(`\n${v.username} ${v.stellar}:`)
        if (v.basis.type === 'expert') {
          console.log('  ✓ Expert tag found')
        } else {
          console.log('  ✓ Token payment found')
          console.log(`    Transaction: ${v.basis.details.transactionHash}`)
          console.log(`    Date: ${v.basis.details.date}`)
          console.log(`    Amount: ${v.basis.details.tokensAmount} tokens`)
          console.log(`    Months covered: ${v.basis.details.monthsCovered}`)
          if (v.basis.details.paymentFrom) {
            console.log(`    Paid by: ${v.basis.details.paymentFrom}`)
          }
        }
      })
    } catch (error) {
      console.error('Failed:', error)
      process.exit(1)
    }
  }
} 