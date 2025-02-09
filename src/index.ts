import { Command } from '@commander-js/extra-typings'
import { logger } from './utils/logger'
import { VERSION } from './version'
import { StellarService } from './services/stellar'
import { CheckTokenInstruction } from './instructions/check-token'
import { CheckTagInstruction } from './instructions/check-tag'
import { CheckTxInstruction } from './instructions/check-tx'

const program = new Command()

program
  .name('npi')
  .description('Neuro Police Initiative - Contract Enforcement Tools')
  .version(VERSION)

program
  .command('check-token')
  .description('Check token balance for an account')
  .requiredOption('-a, --account <account>', 'Stellar account ID')
  .requiredOption('-t, --token <token>', 'Token/Asset code')
  .requiredOption('-m, --min-amount <amount>', 'Minimum required amount')
  .option('-i, --issuer <issuer>', 'Token issuer (not needed for XLM)')
  .option('-c, --comparison <comparison>', 'Comparison type: gte, lte, eq', 'gte')
  .action(async (options) => {
    const stellar = new StellarService(true) // Use TESTNET
    const instruction = new CheckTokenInstruction(stellar)

    const result = await instruction.execute({
      account: options.account,
      asset: options.token,
      minAmount: options.minAmount,
      issuer: options.issuer,
      comparison: options.comparison as 'gte' | 'lte' | 'eq'
    })

    if (result.success) {
      logger.info(result.message)
    } else {
      logger.error(result.message)
      process.exit(1)
    }
  })

program
  .command('check-tag')
  .description('Check mutual tags between two accounts')
  .requiredOption('-a, --account <account>', 'First Stellar account ID')
  .requiredOption('-k, --key <key>', 'Tag key to check')
  .option('-p, --pair-key <pairKey>', 'Pair tag key to check on second account')
  .action(async (options) => {
    const stellar = new StellarService(true) // Use TESTNET
    const instruction = new CheckTagInstruction(stellar)

    const result = await instruction.execute({
      account: options.account,
      key: options.key,
      pairKey: options.pairKey
    })

    if (result.success) {
      logger.info(result.message)
    } else {
      logger.error(result.message)
      process.exit(1)
    }
  })

program
  .command('check-tx')
  .description('Check if account has specific token transaction')
  .requiredOption('-a, --account <account>', 'Stellar account ID')
  .requiredOption('-t, --token <token>', 'Token/Asset code')
  .requiredOption('-s, --since <since>', 'Check transactions since (ISO date)')
  .option('-i, --issuer <issuer>', 'Token issuer (not needed for XLM)')
  .option('-d, --direction <direction>', 'Transaction direction: in, out')
  .option('-c, --counterparty <counterparty>', 'Check transactions only with this account')
  .action(async (options) => {
    const stellar = new StellarService(true) // Use TESTNET
    const instruction = new CheckTxInstruction(stellar)

    const result = await instruction.execute({
      account: options.account,
      asset: options.token,
      issuer: options.issuer,
      direction: options.direction as 'in' | 'out' | undefined,
      since: options.since,
      counterparty: options.counterparty
    })

    if (result.success) {
      logger.info(result.message)
    } else {
      logger.error(result.message)
      process.exit(1)
    }
  })

program.parse()
