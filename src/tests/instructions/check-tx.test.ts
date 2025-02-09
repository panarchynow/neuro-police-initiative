import { describe, it, expect, vi } from 'vitest'
import { CheckTxInstruction } from '../../instructions/check-tx'
import { StellarService } from '../../services/stellar'
import { PaymentRecord } from '../../services/stellar'

vi.mock('../../services/stellar')

describe('CheckTxInstruction', () => {
  const stellar = new StellarService()
  const instruction = new CheckTxInstruction(stellar)

  const mockPayment = (override: Partial<PaymentRecord> = {}): PaymentRecord => ({
    asset_type: 'native',
    asset_code: undefined,
    asset_issuer: undefined,
    from: 'from_account',
    to: 'to_account',
    created_at: '2024-01-01T00:00:00Z',
    ...override
  })

  it('should validate required params', async () => {
    const result = await instruction.execute({} as any)
    expect(result.success).toBe(false)
    expect(result.message).toBe('Missing required parameter: account')
  })

  it('should find XLM transaction', async () => {
    vi.spyOn(stellar, 'getTransactions').mockResolvedValueOnce([
      mockPayment()
    ])

    const result = await instruction.execute({
      account: 'account1',
      asset: 'XLM',
      since: '2024-01-01T00:00:00Z'
    })

    expect(result.success).toBe(true)
    expect(result.message).toBe('Transaction found')
  })

  it('should find token transaction', async () => {
    vi.spyOn(stellar, 'getTransactions').mockResolvedValueOnce([
      mockPayment({
        asset_type: 'credit_alphanum4',
        asset_code: 'TEST',
        asset_issuer: 'issuer1'
      })
    ])

    const result = await instruction.execute({
      account: 'account1',
      asset: 'TEST',
      issuer: 'issuer1',
      since: '2024-01-01T00:00:00Z'
    })

    expect(result.success).toBe(true)
    expect(result.message).toBe('Transaction found')
  })

  it('should find incoming transaction', async () => {
    vi.spyOn(stellar, 'getTransactions').mockResolvedValueOnce([
      mockPayment({
        to: 'account1'
      })
    ])

    const result = await instruction.execute({
      account: 'account1',
      asset: 'XLM',
      direction: 'in',
      since: '2024-01-01T00:00:00Z'
    })

    expect(result.success).toBe(true)
    expect(result.message).toBe('Transaction found')
  })

  it('should find outgoing transaction', async () => {
    vi.spyOn(stellar, 'getTransactions').mockResolvedValueOnce([
      mockPayment({
        from: 'account1'
      })
    ])

    const result = await instruction.execute({
      account: 'account1',
      asset: 'XLM',
      direction: 'out',
      since: '2024-01-01T00:00:00Z'
    })

    expect(result.success).toBe(true)
    expect(result.message).toBe('Transaction found')
  })

  it('should find transaction with counterparty', async () => {
    vi.spyOn(stellar, 'getTransactions').mockResolvedValueOnce([
      mockPayment({
        from: 'account1',
        to: 'account2'
      })
    ])

    const result = await instruction.execute({
      account: 'account1',
      asset: 'XLM',
      counterparty: 'account2',
      since: '2024-01-01T00:00:00Z'
    })

    expect(result.success).toBe(true)
    expect(result.message).toBe('Transaction found')
  })

  it('should find incoming transaction with counterparty', async () => {
    vi.spyOn(stellar, 'getTransactions').mockResolvedValueOnce([
      mockPayment({
        from: 'account2',
        to: 'account1'
      })
    ])

    const result = await instruction.execute({
      account: 'account1',
      asset: 'XLM',
      direction: 'in',
      counterparty: 'account2',
      since: '2024-01-01T00:00:00Z'
    })

    expect(result.success).toBe(true)
    expect(result.message).toBe('Transaction found')
  })

  it('should find outgoing transaction with counterparty', async () => {
    vi.spyOn(stellar, 'getTransactions').mockResolvedValueOnce([
      mockPayment({
        from: 'account1',
        to: 'account2'
      })
    ])

    const result = await instruction.execute({
      account: 'account1',
      asset: 'XLM',
      direction: 'out',
      counterparty: 'account2',
      since: '2024-01-01T00:00:00Z'
    })

    expect(result.success).toBe(true)
    expect(result.message).toBe('Transaction found')
  })

  it('should not find transaction with wrong asset', async () => {
    vi.spyOn(stellar, 'getTransactions').mockResolvedValueOnce([
      mockPayment({
        asset_type: 'credit_alphanum4',
        asset_code: 'WRONG',
        asset_issuer: 'issuer1'
      })
    ])

    const result = await instruction.execute({
      account: 'account1',
      asset: 'TEST',
      issuer: 'issuer1',
      since: '2024-01-01T00:00:00Z'
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('No matching transaction found')
  })

  it('should not find transaction with wrong direction', async () => {
    vi.spyOn(stellar, 'getTransactions').mockResolvedValueOnce([
      mockPayment({
        from: 'account1',
        to: 'account2'
      })
    ])

    const result = await instruction.execute({
      account: 'account1',
      asset: 'XLM',
      direction: 'in',
      since: '2024-01-01T00:00:00Z'
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('No matching transaction found')
  })

  it('should not find transaction with wrong counterparty', async () => {
    vi.spyOn(stellar, 'getTransactions').mockResolvedValueOnce([
      mockPayment({
        from: 'account1',
        to: 'account2'
      })
    ])

    const result = await instruction.execute({
      account: 'account1',
      asset: 'XLM',
      counterparty: 'account3',
      since: '2024-01-01T00:00:00Z'
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('No matching transaction found')
  })
}) 