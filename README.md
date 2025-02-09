# Neuro Police Initiative

## Инструкции

### check-token

Проверяет баланс токена на аккаунте в сети Stellar.

```bash
# Проверить баланс XLM
bun start check-token -a GABC... -t XLM -m 100

# Проверить баланс другого токена
bun start check-token -a GABC... -t TEST -m 100 -i ISSUER_ID

# Проверить точное значение
bun start check-token -a GABC... -t XLM -m 100 -c eq
```

#### Параметры

- `-a, --account` - ID аккаунта в сети Stellar
- `-t, --token` - Код токена (XLM для нативного токена)
- `-m, --min-amount` - Минимальное/требуемое количество токенов
- `-i, --issuer` - ID эмитента токена (не нужен для XLM)
- `-c, --comparison` - Тип сравнения (gte/lte/eq)
