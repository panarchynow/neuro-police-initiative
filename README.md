# Neuro Police Initiative

Набор инструментов для энфорсмента контрактов для волюнтаристских сообществ.

## Установка

```bash
# Клонируем репозиторий
git clone https://github.com/montelibero-org/neuro-police
cd neuro-police

# Устанавливаем зависимости
bun install

# Создаем .env файл и добавляем необходимые токены
cp .env.example .env
```

## Использование

### CLI

```bash
# Проверить баланс токена
bun run npi check-token -a ACCOUNT -t TOKEN -m MIN_AMOUNT

# Проверить теги
bun run npi check-tag -a ACCOUNT -k KEY

# Проверить транзакции
bun run npi check-tx -a ACCOUNT -t TOKEN -s "2024-01-01"

# Получить список участников Распределенного правления
bun run npi management-members
```

### Программный интерфейс

```typescript
import { ManagementOperative } from '@/operatives/telegram/management'

const operative = new ManagementOperative()
const members = await operative.getMembers()
```

## Переменные окружения

```bash
# Stellar
HORIZON_URL=https://horizon-testnet.stellar.org
NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# Grist
GRIST_TOKEN=your_grist_token

# Telegram Members
TELEGRAM_MEMBERS_TOKEN=your_telegram_token
```

## Разработка

```bash
# Запуск тестов
bun test

# Запуск линтера
bun run lint

# Сборка
bun run build
```

## Инструкции

### check-token

Проверяет баланс токена на аккаунте в сети Stellar.

#### Параметры

- `-a, --account` - ID аккаунта в сети Stellar
- `-t, --token` - Код токена (XLM для нативного токена)
- `-m, --min-amount` - Минимальное/требуемое количество токенов
- `-i, --issuer` - ID эмитента токена (не нужен для XLM)
- `-c, --comparison` - Тип сравнения (gte/lte/eq)

#### Пример

```bash
# Проверить баланс XLM
bun run npi check-token -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -t XLM -m 100

# Проверить баланс другого токена
bun run npi check-token -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -t TEST -m 100 -i ISSUER_ID

# Проверить точное значение
bun run npi check-token -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -t XLM -m 100 -c eq
```

### check-tag

Проверяет наличие взаимных тегов между двумя аккаунтами в Stellar. Первый аккаунт должен иметь тег с указанным ключом, значением которого является второй аккаунт. Второй аккаунт должен иметь тег с тем же (или указанным парным) ключом, значением которого является первый аккаунт.

#### Параметры

- `-a, --account` - Первый аккаунт для проверки
- `-k, --key` - Ключ тега для проверки
- `-p, --pair-key` - Парный ключ тега для проверки на втором аккаунте (опционально)

#### Пример

```bash
# Проверить взаимные теги с одинаковым ключом
bun run npi check-tag -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -k friend

# Проверить взаимные теги с разными ключами
bun run npi check-tag -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -k friend -p buddy
```

### check-tx

Проверяет наличие транзакций с определенным токеном за указанный период. Можно проверить как входящие, так и исходящие транзакции, а также транзакции с определенным аккаунтом.

#### Параметры

- `-a, --account` - ID аккаунта в сети Stellar
- `-t, --token` - Код токена (XLM для нативного токена)
- `-s, --since` - Дата начала проверки в ISO формате
- `-i, --issuer` - ID эмитента токена (не нужен для XLM)
- `-d, --direction` - Направление транзакции (in - входящие, out - исходящие)
- `-c, --counterparty` - Проверять транзакции только с этим аккаунтом

#### Пример

```bash
# Проверить все транзакции с XLM за последний час
bun run npi check-tx -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -t XLM -s $(date -v-1H -u +"%Y-%m-%dT%H:%M:%SZ")

# Проверить входящие транзакции с токеном
bun run npi check-tx -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -t TEST -i ISSUER_ID -s 2024-01-01T00:00:00Z -d in

# Проверить исходящие транзакции с токеном
bun run npi check-tx -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -t TEST -i ISSUER_ID -s 2024-01-01T00:00:00Z -d out

# Проверить транзакции с определенным аккаунтом
bun run npi check-tx -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -t XLM -s 2024-01-01T00:00:00Z -c GBXXX...
```

## CLI

### grist

Работа с данными из Grist.

#### Команды

##### fetch

Получает данные из таблицы.

###### Параметры

- `-t, --table` - Имя таблицы из списка доступных (USERS)
- `-s, --sort` - Поле для сортировки (опционально)
- `-f, --filter` - Поле для фильтрации (опционально)
- `-v, --value` - Значения для фильтрации, можно указать несколько через пробел (опционально)

###### Пример

```bash
# Получить данные из таблицы
bun run npi grist fetch -t USERS

# С сортировкой по полю Stellar
bun run npi grist fetch -t USERS -s Stellar

# С фильтром по полю
bun run npi grist fetch -t USERS -f Stellar -v GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST

# С фильтром по нескольким значениям
bun run npi grist fetch -t USERS -f Balance -v 100 200 300

# С сортировкой и фильтром
bun run npi grist fetch -t USERS -s Stellar -f Balance -v 100
```

##### put

Обновляет данные в таблице.

###### Параметры

- `-t, --table` - Имя таблицы из списка доступных (USERS)
- `-d, --data` - JSON данные для обновления

###### Пример

```bash
# Обновить данные
bun run npi grist put -t USERS -d '{"name": "test"}'
```

##### patch

Частично обновляет данные в таблице.

###### Параметры

- `-t, --table` - Имя таблицы из списка доступных (USERS)
- `-d, --data` - JSON данные для обновления

###### Пример

```bash
# Частично обновить данные
bun run npi grist patch -t USERS -d '{"name": "test"}'
```

#### Настройка

Для работы нужно создать файл `.env` с токеном:

```bash
GRIST_TOKEN=your_token_here
```

#### Доступные таблицы

- `USERS` - пользователи

### users

Работа с пользователями.

#### Команды

##### stellar-by-telegram

Получает Stellar адрес пользователя по его Telegram юзернейму. Можно указывать юзернейм как с @, так и без.

###### Параметры

- `username` - Telegram username пользователя (с @ или без)

###### Пример

```bash
# Получить Stellar адрес пользователя (с @)
bun run npi users stellar-by-telegram @username

# Получить Stellar адрес пользователя (без @)
bun run npi users stellar-by-telegram username
```
