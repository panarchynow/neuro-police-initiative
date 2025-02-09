import { describe, it, expect, vi } from 'vitest'
import { CheckTokenInstruction } from '../../instructions/check-token'
import { StellarService } from '../../services/stellar'

vi.mock('../../services/stellar', () => ({
  StellarService: vi.fn().mockImplementation(() => ({
    getBalance: vi.fn().mockImplementation(async (accountId: string) => {
      if (accountId === 'error') {
        return await Promise.reject(new Error('Account not found'))
      }
      return await Promise.resolve(accountId === 'insufficient' ? '50.0' : '150.0')
    }),
    getAccountBalances: vi.fn().mockResolvedValue([])
  }))
}))

describe('CheckTokenInstruction', () => {
  const mockStellar = new (vi.mocked(StellarService))()

  const instruction = new CheckTokenInstruction(mockStellar)

  it('should fail when required params are missing', async () => {
    const result = await instruction.execute({})
    expect(result.success).toBe(false)
    expect(result.message).toContain('Missing required parameter')
  })

  it('should pass when balance is sufficient', async () => {
    const result = await instruction.execute({
      account: 'sufficient',
      asset: 'TEST',
      minAmount: '100'
    })

    expect(result.success).toBe(true)
    expect(result.message).toBe('Token check passed')
    expect(result.details).toEqual({
      account: 'sufficient',
      asset: 'TEST',
      balance: '150.0',
      required: '100'
    })
  })

  it('should fail when balance is insufficient', async () => {
    const result = await instruction.execute({
      account: 'insufficient',
      asset: 'TEST',
      minAmount: '100'
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('insufficient balance')
  })

  it('should handle Stellar errors', async () => {
    const result = await instruction.execute({
      account: 'error',
      asset: 'TEST',
      minAmount: '100'
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Account not found')
  })
})
