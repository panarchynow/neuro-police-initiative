import { describe, it, expect } from 'vitest'
import { VERSION } from '../version'

describe('Version', () => {
  it('should match package.json version', () => {
    expect(VERSION).toBe('0.1.0')
  })
})
