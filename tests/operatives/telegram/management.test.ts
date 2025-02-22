import { describe, it, expect, vi } from 'vitest'
import { ManagementOperative } from '@/operatives/telegram/management'
import { TelegramMembersService } from '@/services/telegram-members'

describe('ManagementOperative', () => {
  it('should get members', async () => {
    const mockService = {
      getChatMembers: vi.fn().mockResolvedValue([
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' },
        { id: 3 }
      ])
    } as unknown as TelegramMembersService

    const operative = new ManagementOperative(mockService)
    const members = await operative.getMembers()

    expect(mockService.getChatMembers).toHaveBeenCalledWith(-1001798357244)
    expect(members).toEqual(['user1', 'user2', 'id:3'])
  })

  it('should handle errors', async () => {
    const mockService = {
      getChatMembers: vi.fn().mockRejectedValue(new Error('Failed to get members'))
    } as unknown as TelegramMembersService

    const operative = new ManagementOperative(mockService)
    await expect(operative.getMembers()).rejects.toThrow('Failed to get members')
  })
}) 