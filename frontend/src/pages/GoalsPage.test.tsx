import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import GoalsPage from './GoalsPage'

const store = vi.hoisted(() => ({
  goals: [{ id: -1, title: 'مراجعة محفوظة دون اتصال', description: null, target: 10, current: 2, target_type: 'hours', deadline: null, completed: false, created_at: '', updated_at: '', is_local_only: true }],
  isLoading: false,
  error: 'تعذر الاتصال بالخادم. تظهر الأهداف المحفوظة على هذا الجهاز.',
  fetchGoals: vi.fn(), createGoal: vi.fn(), updateGoal: vi.fn(), deleteGoal: vi.fn(),
}))

vi.mock('@/stores/goalsStore', () => ({ useGoalsStore: () => store }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('@/theme/ThemeContext', () => ({ useTheme: () => ({ theme: { colors: { accent: '#6380ff', secondary: '#9870ff', text: '#ffffff', textMuted: '#bbbbbb', textDark: '#999999', error: '#ff4444', border: '#333333', success: '#22aa66', warning: '#eeaa44' } } }) }))

describe('offline goals page', () => {
  beforeEach(() => { cleanup(); vi.clearAllMocks() })

  it('shows saved goals alongside the offline notice and keeps completion usable', () => {
    render(<GoalsPage />)
    expect(screen.getByRole('status').textContent).toContain('تعذر الاتصال')
    expect(screen.getByText('مراجعة محفوظة دون اتصال')).toBeTruthy()
    expect(screen.getByText('2/10 goals.goalType_hours')).toBeTruthy()
    expect(store.fetchGoals).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByTitle('goals.complete'))
    expect(store.updateGoal).toHaveBeenCalledWith(-1, { completed: true, current: 10 })
  })
})
