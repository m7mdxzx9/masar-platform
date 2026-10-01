import { describe, expect, it } from 'vitest'
import { allPages, searchPages } from './navigation'
describe('navigation search', () => {
  it('finds Arabic labels independent of hamza and diacritics', () => { expect(searchPages('الاهداف').map(page => page.path)).toContain('goals'); expect(searchPages('خُطَّة').map(page => page.path)).toContain('planner') })
  it('searches descriptions and English routes', () => { expect(searchPages('اكتب وشغل').map(page => page.path)).toEqual(['labs']); expect(searchPages('FLASHCARDS').map(page => page.path)).toEqual(['flashcards']) })
  it('returns no matches for unknown query and all pages for blank query', () => { expect(searchPages('zzz-no-match')).toHaveLength(0); expect(searchPages('')).toHaveLength(allPages.length) })
  it('has unique paths for every discoverable page', () => { expect(new Set(allPages.map(page => page.path)).size).toBe(allPages.length) })
})
