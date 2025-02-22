import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TelegramMembersService } from '@/services/telegram-members'
import * as settings from '@/config/settings'

vi.mock('@/config/settings', () => ({
  telegramMembersConfig: {
    token: 'test-token',
    baseUrl: 'https://tg-members.mtla.me'
  }
}))

describe('TelegramMembersService', () => {
  let service: TelegramMembersService
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.restoreAllMocks()
    fetchMock = vi.fn()
    global.fetch = fetchMock as unknown as typeof global.fetch
    service = new TelegramMembersService()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should throw error if token is not set', () => {
    vi.spyOn(settings, 'telegramMembersConfig', 'get').mockReturnValue({
      token: '',
      baseUrl: 'https://tg-members.mtla.me'
    })
    expect(() => new TelegramMembersService()).toThrow('TELEGRAM_MEMBERS_TOKEN is required')
  })

  it('should get chat members', async () => {
    const mockMembers = [{ id: 1, username: 'test' }]
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, title: 'test', members: mockMembers })
    } as Response)

    const result = await service.getChatMembers(123)
    expect(result).toEqual(mockMembers)
  })

  it('should get user chats', async () => {
    const mockChats = [{ id: 1, title: 'test', members: [] }]
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockChats)
    } as Response)

    const result = await service.getUserChats(123)
    expect(result).toEqual(mockChats)
  })

  it('should handle fetch errors', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    } as Response)

    await expect(service.getChatMembers(123))
      .rejects
      .toThrow('Failed to get chat members: Not Found')
  })
}) 