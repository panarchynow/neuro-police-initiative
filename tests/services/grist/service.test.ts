import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GristService } from '../../../src/services/grist/service'
import { MTLGrist } from '../../../src/services/grist/types'
import * as settings from '../../../src/config/settings'

vi.mock('../../../src/config/settings', () => ({
  gristConfig: {
    token: 'test-token',
    baseUrl: 'https://test.getgrist.com/api/docs'
  }
}))

describe('GristService', () => {
  let service: GristService
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.restoreAllMocks()
    fetchMock = vi.fn()
    global.fetch = fetchMock as unknown as typeof global.fetch
    service = new GristService()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should throw error if token is not set', () => {
    vi.spyOn(settings, 'gristConfig', 'get').mockReturnValue({
      token: '',
      baseUrl: 'https://test.getgrist.com/api/docs'
    })
    expect(() => new GristService()).toThrow('GRIST_TOKEN is not set')
  })

  it('should fetch data from Grist', async () => {
    const mockResponse = {
      records: [
        { id: 1, fields: { name: 'test' } }
      ]
    }

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response)

    const result = await service.fetchData(MTLGrist.USERS)
    expect(result).toEqual([{ id: 1, name: 'test' }])
  })

  it('should put data to Grist', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({})
    } as Response)

    const result = await service.putData(MTLGrist.USERS, { name: 'test' })
    expect(result).toBe(true)
  })

  it('should patch data in Grist', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({})
    } as Response)

    const result = await service.patchData(MTLGrist.USERS, { name: 'test' })
    expect(result).toBe(true)
  })

  it('should handle fetch errors', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    } as Response)

    await expect(service.fetchData(MTLGrist.USERS))
      .rejects
      .toThrow('Grist request failed: 500 Internal Server Error')
  })
}) 