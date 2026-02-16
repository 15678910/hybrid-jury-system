import { describe, it, expect } from 'vitest'
import { cleanTitle, formatDate } from './news'

describe('news utilities', () => {
  describe('cleanTitle', () => {
    it('should remove source from title', () => {
      const title = 'Breaking News - CNN'
      expect(cleanTitle(title)).toBe('Breaking News')
    })

    it('should handle titles without source', () => {
      const title = 'Simple Title'
      expect(cleanTitle(title)).toBe('Simple Title')
    })

    it('should handle multiple dashes', () => {
      const title = 'First Part - Second Part - Source'
      expect(cleanTitle(title)).toBe('First Part - Second Part')
    })
  })

  describe('formatDate', () => {
    it('should return "방금 전" for recent dates', () => {
      const now = new Date()
      expect(formatDate(now.toISOString())).toBe('방금 전')
    })

    it('should return hours ago for dates within 24 hours', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      expect(formatDate(twoHoursAgo.toISOString())).toBe('2시간 전')
    })

    it('should return days ago for dates within a week', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      expect(formatDate(threeDaysAgo.toISOString())).toBe('3일 전')
    })

    it('should return "Invalid Date" for invalid date string', () => {
      expect(formatDate('invalid')).toBe('Invalid Date')
    })
  })
})
