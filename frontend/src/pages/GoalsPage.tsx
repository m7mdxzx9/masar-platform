import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Target, Plus, Trash2, Loader2, CheckCircle2, Clock, BookOpen, GraduationCap, X, Calendar, Edit3, Trophy, Filter, ArrowUpDown, AlertCircle } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useGoalsStore, Goal } from '@/stores/goalsStore'

const TARGET_TYPES = [
  { id: 'hours', i18nKey: 'goals.hours', icon: Clock },
  { id: 'courses', i18nKey: 'goals.courses', icon: BookOpen },
  { id: 'quizzes', i18nKey: 'goals.quizzes', icon: GraduationCap },
]

type FilterType = 'all' | 'active' | 'completed' | 'overdue'

export default function GoalsPage() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { goals, isLoading, error, fetchGoals, createGoal, updateGoal, deleteGoal } = useGoalsStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', target: 10, target_type: 'hours', deadline: '' })
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortByDeadline, setSortByDeadline] = useState(false)

  useEffect(() => { fetchGoals() }, [])

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setCreating(true)
    try {
      await createGoal({
        title: form.title,
        description: form.description || undefined,
        target: form.target,
        target_type: form.target_type,
        deadline: form.deadline || undefined,
      })
      setForm({ title: '', description: '', target: 10, target_type: 'hours', deadline: '' })
      setShowForm(false)
    } finally { setCreating(false) }
  }

  const toggleComplete = (goal: Goal) => {
    updateGoal(goal.id, { completed: !goal.completed, current: !goal.completed ? goal.target : 0 })
  }

  const filteredGoals = useMemo(() => {
    let result = [...goals]
    const now = new Date()

    switch (filter) {
      case 'active':
        result = result.filter(g => !g.completed)
        break
      case 'completed':
        result = result.filter(g => g.completed)
        break
      case 'overdue':
        result = result.filter(g => !g.completed && g.deadline && new Date(g.deadline) < now)
        break
    }

    if (sortByDeadline) {
      result.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      })
    }

    return result
  }, [goals, filter, sortByDeadline])

  const activeGoals = filteredGoals.filter(g => !g.completed)
  const completedGoals = filteredGoals.filter(g => g.completed)
  const allCompleted = goals.length > 0 && goals.every(g => g.completed)

  const getTargetIcon = (type: string) => {
    const found = TARGET_TYPES.find(t => t.id === type)
    return found?.icon || Target
  }
  const getTargetLabel = (type: string) => {
    if (type === 'hours') return t('goals.goalType_hours')
    if (type === 'courses') return t('goals.goalType_courses')
    if (type === 'quizzes') return t('goals.goalType_quizzes')
    return type
  }

  const CircularProgress = ({ pct, size = 48 }: { pct: number; size?: number }) => {
    const strokeWidth = 4
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (pct / 100) * circumference
    const color = pct > 75 ? theme.colors.success : pct > 40 ? theme.colors.warning : theme.colors.accent
    return (
      <svg width={size} height={size} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill={color} fontSize="10" fontWeight="bold">{pct}%</text>
      </svg>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <Target size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>{t('goals.title')}</h1>
            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>{t('goals.subtitle', { active: goals.filter(g => !g.completed).length, completed: goals.filter(g => g.completed).length })}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
          <Plus size={18} />{t('goals.createGoal')}
        </button>
      </div>

      {/* Filters & Sort */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}` }}>
          {(['all', 'active', 'completed', 'overdue'] as FilterType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? 'text-white shadow-md' : ''}`}
              style={{
                background: filter === f ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'transparent',
                color: filter === f ? '#fff' : theme.colors.textMuted,
              }}>
              {t(`goals.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
            </button>
          ))}
        </div>
        <button onClick={() => setSortByDeadline(!sortByDeadline)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/5"
          style={{ color: sortByDeadline ? theme.colors.accent : theme.colors.textMuted, border: `1px solid ${sortByDeadline ? theme.colors.accent + '40' : theme.colors.border}` }}>
          <ArrowUpDown size={12} />
          {t('goals.sortByDeadline')}
        </button>
      </div>

      {isLoading && goals.length === 0 ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} /></div>
      ) : error ? (
        <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: `${theme.colors.error}15`, color: theme.colors.error, border: `1px solid ${theme.colors.error}30` }}>{error}</div>
      ) : allCompleted ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Trophy size={64} className="mb-4" style={{ color: theme.colors.success }} />
          <p className="text-xl font-bold" style={{ color: theme.colors.text }}>{t('goals.allCompleted')}</p>
          <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>{t('goals.allCompletedDesc')}</p>
          <button onClick={() => setShowForm(true)} className="mt-6 px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>{t('goals.createGoal')}</button>
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Target size={64} className="mb-4" style={{ color: theme.colors.textDark }} />
          <p className="text-xl font-bold" style={{ color: theme.colors.text }}>{t('goals.noGoals')}</p>
          <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>{t('goals.noGoalsDesc')}</p>
          <button onClick={() => setShowForm(true)} className="mt-6 px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>{t('goals.createGoal')}</button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Overdue warning */}
          {filter === 'all' && goals.filter(g => !g.completed && g.deadline && new Date(g.deadline) < new Date()).length > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: `${theme.colors.error}15`, border: `1px solid ${theme.colors.error}30`, color: theme.colors.error }}>
              <AlertCircle size={18} />
              <span className="text-sm font-bold">{t('goals.overdue')}: {goals.filter(g => !g.completed && g.deadline && new Date(g.deadline) < new Date()).length}</span>
            </div>
          )}

          {activeGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4" style={{ color: theme.colors.text }}>{t('goals.active')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeGoals.map((goal, idx) => {
                  const Icon = getTargetIcon(goal.target_type)
                  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0
                  const isOverdue = goal.deadline && new Date(goal.deadline) < new Date()
                  return (
                    <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                      className="rounded-2xl p-6 backdrop-blur-[20px] shadow-lg"
                      style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${isOverdue ? theme.colors.error + '40' : 'rgba(255,255,255,0.06)'}` }}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <CircularProgress pct={pct} />
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm truncate" style={{ color: theme.colors.text }}>{goal.title}</h3>
                            {goal.description && <p className="text-xs mt-0.5 truncate" style={{ color: theme.colors.textMuted }}>{goal.description}</p>}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => toggleComplete(goal)} className="p-2 rounded-lg hover:bg-white/10 transition-all" title={t('goals.complete')} style={{ color: theme.colors.success }}>
                            <CheckCircle2 size={16} />
                          </button>
                          <button onClick={() => deleteGoal(goal.id)} className="p-2 rounded-lg hover:bg-white/10 transition-all" style={{ color: theme.colors.error }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-2" style={{ color: theme.colors.textMuted }}>
                        <span>{goal.current}/{goal.target} {getTargetLabel(goal.target_type)}</span>
                        <span className="font-bold" style={{ color: theme.colors.accent }}>{pct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${theme.colors.secondary}, ${theme.colors.accent})` }} />
                      </div>
                      {goal.deadline && (
                        <div className="flex items-center gap-1 mt-3 text-[10px]" style={{ color: isOverdue ? theme.colors.error : theme.colors.textDark }}>
                          <Calendar size={10} />
                          <span>{t('goals.deadlineLabel')}: {new Date(goal.deadline).toLocaleDateString('ar-SA')}</span>
                          {isOverdue && <span className="font-bold mr-1">({t('goals.overdue')})</span>}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: theme.colors.success }}>
                <Trophy size={18} />{t('goals.completed')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedGoals.map((goal, idx) => (
                  <motion.div key={goal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
                    className="rounded-2xl p-5 flex items-center gap-4" style={{ backgroundColor: `${theme.colors.success}10`, border: `1px solid ${theme.colors.success}30` }}>
                    <CheckCircle2 size={24} style={{ color: theme.colors.success }} />
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: theme.colors.text }}>{goal.title}</p>
                      <p className="text-xs" style={{ color: theme.colors.textMuted }}>{t('goals.completedLabel')}</p>
                    </div>
                    <button onClick={() => toggleComplete(goal)} className="p-2 rounded-lg hover:bg-white/10 transition-all mr-auto" style={{ color: theme.colors.textMuted }}>
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeGoals.length === 0 && completedGoals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 opacity-50">
              <Filter size={48} className="mb-3" style={{ color: theme.colors.textDark }} />
              <p className="text-sm font-bold" style={{ color: theme.colors.text }}>{t('common.noResults')}</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-md mx-4 rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>{t('goals.newGoal')}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/10" style={{ color: theme.colors.textMuted }}><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: theme.colors.textMuted }}>{t('goals.goalTitle')}</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('goals.exampleTitle')}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: theme.colors.textMuted }}>{t('goals.description')}</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: theme.colors.textMuted }}>{t('goals.targetType')}</label>
                <div className="flex gap-2">
                  {TARGET_TYPES.map((targetType) => {
                    const Icon = targetType.icon
                    return (
                      <button key={targetType.id} onClick={() => setForm({ ...form, target_type: targetType.id })}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${form.target_type === targetType.id ? 'text-white shadow-lg' : ''}`}
                        style={{
                          background: form.target_type === targetType.id ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.03)',
                          color: form.target_type === targetType.id ? '#fff' : theme.colors.textMuted,
                          border: form.target_type === targetType.id ? 'none' : `1px solid ${theme.colors.border}`,
                        }}>
                        <Icon size={14} />{t(targetType.i18nKey)}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: theme.colors.textMuted }}>{t('goals.target')}</label>
                <input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} min={1}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: theme.colors.textMuted }}>{t('goals.deadlineOptional')}</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:bg-white/5"
                  style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>{t('goals.cancel')}</button>
                <button onClick={handleCreate} disabled={!form.title.trim() || creating}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('goals.create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
