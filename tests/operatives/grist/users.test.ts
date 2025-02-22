import { describe, it, expect, vi } from 'vitest'
import { UsersOperative } from '@/operatives/grist/users'
import { GristService } from '@/services/grist/service'

describe('UsersOperative', () => {
  it('should get Stellar address by Telegram username without @', async () => {
    const mockService = {
      fetchData: vi.fn().mockResolvedValue([
        { Telegram: '@test', Stellar: 'GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST' }
      ])
    } as unknown as GristService

    const operative = new UsersOperative(mockService)
    const address = await operative.getStellarByTelegram('test')

    expect(mockService.fetchData).toHaveBeenCalledWith(expect.anything(), undefined, {
      Telegram: ['@test']
    })
    expect(address).toBe('GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST')
  })

  it('should get Stellar address by Telegram username with @', async () => {
    const mockService = {
      fetchData: vi.fn().mockResolvedValue([
        { Telegram: '@test', Stellar: 'GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST' }
      ])
    } as unknown as GristService

    const operative = new UsersOperative(mockService)
    const address = await operative.getStellarByTelegram('@test')

    expect(mockService.fetchData).toHaveBeenCalledWith(expect.anything(), undefined, {
      Telegram: ['@test']
    })
    expect(address).toBe('GCXLHWVLGYSKPOWALVJ2AWLSU4FVE66FCE2QOD6HHCESJGFWQ3OHTEST')
  })

  it('should return null if user not found', async () => {
    const mockService = {
      fetchData: vi.fn().mockResolvedValue([])
    } as unknown as GristService

    const operative = new UsersOperative(mockService)
    const address = await operative.getStellarByTelegram('test')

    expect(address).toBeNull()
  })

  it('should handle errors', async () => {
    const mockService = {
      fetchData: vi.fn().mockRejectedValue(new Error('Failed to fetch data'))
    } as unknown as GristService

    const operative = new UsersOperative(mockService)
    await expect(operative.getStellarByTelegram('test')).rejects.toThrow('Failed to fetch data')
  })
}) 