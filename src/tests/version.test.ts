import { describe, it, expect } from 'vitest'
import { version } from '../package.json'

describe('Version', () => {
  it('should match package.json version', () => {
    expect(version).toBe('0.1.0')
  })
}) 