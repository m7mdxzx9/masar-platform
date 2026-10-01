import { describe, expect, it } from 'vitest'
import { apiClient } from './api'
describe('API error handling', () => {
  it('rejects failed writes so local fallback can run instead of claiming success', async () => {
    const error = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' })
    await expect(apiClient.post('/notes', { title: 'test' }, { adapter: async () => { throw error } })).rejects.toBe(error)
  })
  it('does not turn an unavailable health check into healthy data', async () => {
    await expect(apiClient.get('/health', { adapter: async () => { throw new Error('unavailable') } })).rejects.toThrow('unavailable')
  })
})
