import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import PlannerPage from './PlannerPage'
beforeEach(() => { cleanup(); localStorage.clear() })
describe('daily planner', () => {
  it('persists tasks and completion across remounts', () => {
    const view = render(<PlannerPage />)
    fireEvent.change(screen.getByLabelText('مهمة جديدة'), { target: { value: 'مراجعة الدرس' } })
    fireEvent.click(screen.getByRole('button', { name: 'إضافة مهمة' }))
    fireEvent.click(screen.getByRole('button', { name: 'إكمال مراجعة الدرس' }))
    view.unmount(); render(<PlannerPage />)
    expect(screen.getByRole('button', { name: 'إلغاء إكمال مراجعة الدرس' }).getAttribute('aria-pressed')).toBe('true')
  })
  it('does not accept whitespace tasks and recovers from invalid storage', () => {
    localStorage.setItem('masar-daily-planner-v1', '{broken')
    render(<PlannerPage />)
    fireEvent.change(screen.getByLabelText('مهمة جديدة'), { target: { value: '   ' } })
    expect(screen.getByRole('button', { name: 'إضافة مهمة' }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByText('يوم جديد، فرصة جديدة')).toBeTruthy()
  })
})
