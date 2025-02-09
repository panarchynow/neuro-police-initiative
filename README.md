# Neuro Police Initiative

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
bun start check-token -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -t XLM -m 100

# Проверить баланс другого токена
bun start check-token -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -t TEST -m 100 -i ISSUER_ID

# Проверить точное значение
bun start check-token -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -t XLM -m 100 -c eq
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
bun start check-tag -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -k friend

# Проверить взаимные теги с разными ключами
bun start check-tag -a GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST -k friend -p buddy
```
