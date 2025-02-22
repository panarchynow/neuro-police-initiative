import { Command } from '@commander-js/extra-typings'
import { logger } from './utils/logger'
import { VERSION } from './version'
import { StellarService } from './services/stellar'
import { CheckTokenInstruction } from './instructions/check-token'
import { CheckTagInstruction } from './instructions/check-tag'
import { CheckTxInstruction } from './instructions/check-tx'
import { config } from 'dotenv'
import { GristService } from './services/grist/service'
import { MTLGrist } from './services/grist/types'
import { ManagementOperative } from './operatives/telegram/management'
import { UsersOperative } from './operatives/grist/users'
import { DecentralizedManagementMembership } from './protocols/montelibero/management'

// Загружаем переменные окружения
config()

const program = new Command()
const gristService = new GristService()

program
  .name('npi')
  .description('Neuro Police Initiative - Contract Enforcement Tools')
  .version(VERSION)
  .option('-d, --debug', 'Enable debug logs')
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().debug) {
      logger.level = 'debug'
      logger.debug('Debug logs enabled')
    }
  })

program
  .command('check-token')
  .description('Check token balance for an account')
  .requiredOption('-a, --account <account>', 'Stellar account ID')
  .requiredOption('-t, --token <token>', 'Token/Asset code')
  .requiredOption('-m, --min-amount <amount>', 'Minimum required amount')
  .option('-i, --issuer <issuer>', 'Token issuer (not needed for XLM)')
  .option('-c, --comparison <comparison>', 'Comparison type: gte, lte, eq', 'gte')
  .action(async (options) => {
    const stellar = new StellarService()
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
    const stellar = new StellarService()
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
    const stellar = new StellarService()
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

const grist = program
  .command('grist')
  .description('Работа с данными из Grist')

grist
  .command('fetch')
  .description('Получить данные из таблицы Grist')
  .requiredOption('-t, --table <table>', 'Имя таблицы из списка доступных')
  .option('-s, --sort <field>', 'Поле для сортировки')
  .option('-f, --filter <field>', 'Поле для фильтрации')
  .option('-v, --value <values...>', 'Значения для фильтрации')
  .action(async (options) => {
    try {
      const tableConfig = MTLGrist[options.table as keyof typeof MTLGrist]
      if (!tableConfig) {
        logger.error('Неизвестная таблица. Доступные таблицы:')
        logger.error(Object.keys(MTLGrist).join('\n'))
        process.exit(1)
      }

      const filter = options.filter && options.value
        ? { [options.filter]: options.value }
        : undefined

      const data = await gristService.fetchData(tableConfig, options.sort, filter)
      logger.info(JSON.stringify(data, null, 2))
    } catch (error) {
      logger.error('Ошибка:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

grist
  .command('put')
  .description('Обновить данные в таблице Grist')
  .requiredOption('-t, --table <table>', 'Имя таблицы из списка доступных')
  .requiredOption('-d, --data <data>', 'JSON данные для обновления')
  .action(async (options) => {
    try {
      const tableConfig = MTLGrist[options.table as keyof typeof MTLGrist]
      if (!tableConfig) {
        logger.error('Неизвестная таблица. Доступные таблицы:')
        logger.error(Object.keys(MTLGrist).join('\n'))
        process.exit(1)
      }

      const jsonData = JSON.parse(options.data)
      await gristService.putData(tableConfig, jsonData)
      logger.info('Данные успешно обновлены')
    } catch (error) {
      logger.error('Ошибка:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

grist
  .command('patch')
  .description('Частично обновить данные в таблице Grist')
  .requiredOption('-t, --table <table>', 'Имя таблицы из списка доступных')
  .requiredOption('-d, --data <data>', 'JSON данные для обновления')
  .action(async (options) => {
    try {
      const tableConfig = MTLGrist[options.table as keyof typeof MTLGrist]
      if (!tableConfig) {
        logger.error('Неизвестная таблица. Доступные таблицы:')
        logger.error(Object.keys(MTLGrist).join('\n'))
        process.exit(1)
      }

      const jsonData = JSON.parse(options.data)
      await gristService.patchData(tableConfig, jsonData)
      logger.info('Данные успешно обновлены')
    } catch (error) {
      logger.error('Ошибка:', error instanceof Error ? error.message : error)
      process.exit(1)
    }
  })

program
  .command('management-members')
  .description('Get members of Decentralized Management chat')
  .action(ManagementOperative.cli)

const protocols = program
  .command('protocols')
  .description('Запуск протоколов')

protocols
  .command('management')
  .description('Проверить основания участия в Распределенном правлении')
  .action(DecentralizedManagementMembership.cli)

const users = program
  .command('users')
  .description('Работа с пользователями')

users
  .command('stellar-by-telegram')
  .description('Получить Stellar адрес по Telegram юзернейму')
  .argument('<username>', 'Telegram username')
  .action(async (username) => {
    try {
      const operative = new UsersOperative()
      const address = await operative.getStellarByTelegram(username)

      if (address) {
        logger.info({ address }, 'Stellar address found')
      } else {
        logger.error('User not found')
        process.exit(1)
      }
    } catch (error) {
      logger.error({ error }, 'Failed to get Stellar address')
      process.exit(1)
    }
  })

users
  .command('personal-token')
  .description('Получить информацию о персональном токене пользователя')
  .argument('<identifier>', 'Telegram username или Stellar адрес')
  .action(async (identifier) => {
    try {
      const operative = new UsersOperative()
      const token = await operative.getPersonalToken(identifier)

      if (token) {
        logger.info({ token }, 'Personal token found')
      } else {
        logger.error('Personal token not found')
        process.exit(1)
      }
    } catch (error) {
      logger.error({ error }, 'Failed to get personal token')
      process.exit(1)
    }
  })

program.parse()
