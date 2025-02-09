import { Command } from '@commander-js/extra-typings'
import { logger } from './utils/logger'
import { VERSION } from './version'
import { StellarService } from './services/stellar'
import { CheckTokenInstruction } from './instructions/check-token'

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
      comparison: options.comparison
    })

    if (result.success) {
      logger.info(result.message)
    } else {
      logger.error(result.message)
      process.exit(1)
    }
  })

program.parse()
