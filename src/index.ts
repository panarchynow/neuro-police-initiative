import { Command } from '@commander-js/extra-typings'
import { logger } from './utils/logger'

const program = new Command()

program
  .name('npi')
  .description('Neuro Police Initiative - Contract Enforcement Tools')
  .version('0.1.0')

program
  .command('version')
  .description('Show version information')
  .action(() => {
    logger.info('Neuro Police Initiative v0.1.0')
  })

program.parse() 