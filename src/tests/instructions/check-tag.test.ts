import { describe, it, expect, vi } from 'vitest'
import { CheckTagInstruction } from '../../instructions/check-tag'
import { StellarService } from '../../services/stellar'

vi.mock('../../services/stellar')

describe('CheckTagInstruction', () => {
  const stellar = new StellarService()
  const instruction = new CheckTagInstruction(stellar)

  it('should validate required params', async () => {
    const result = await instruction.execute({} as any)
    expect(result.success).toBe(false)
    expect(result.message).toBe('Missing required parameter: account')
  })

  it('should fail if first account has no tag', async () => {
    vi.spyOn(stellar, 'getDataValue').mockResolvedValueOnce(null)

    const result = await instruction.execute({
      account: 'account1',
      key: 'key1'
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('has no tag')
  })

  it('should fail if second account has no tag', async () => {
    vi.spyOn(stellar, 'getDataValue')
      .mockResolvedValueOnce('account2')
      .mockResolvedValueOnce(null)

    const result = await instruction.execute({
      account: 'account1',
      key: 'key1'
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('has no tag')
  })

  it('should fail if accounts are not paired', async () => {
    vi.spyOn(stellar, 'getDataValue')
      .mockResolvedValueOnce('account2')
      .mockResolvedValueOnce('account3')

    const result = await instruction.execute({
      account: 'account1',
      key: 'key1'
    })

    expect(result.success).toBe(false)
    expect(result.message).toContain('not paired')
  })

  it('should pass if accounts are paired', async () => {
    vi.spyOn(stellar, 'getDataValue')
      .mockResolvedValueOnce('account2')
      .mockResolvedValueOnce('account1')

    const result = await instruction.execute({
      account: 'account1',
      key: 'key1'
    })

    expect(result.success).toBe(true)
    expect(result.message).toBe('Tag check passed')
  })

  it('should use pairKey if provided', async () => {
    const getDataValue = vi.spyOn(stellar, 'getDataValue')
      .mockResolvedValueOnce('account2')
      .mockResolvedValueOnce('account1')

    await instruction.execute({
      account: 'account1',
      key: 'key1',
      pairKey: 'key2'
    })

    expect(getDataValue).toHaveBeenCalledWith('account2', 'key2')
  })
}) 