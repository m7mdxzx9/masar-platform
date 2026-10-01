import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpLeft, Sparkles, BookOpen, StickyNote, Timer, Target, FlaskConical, Layers, CalendarDays, Compass, RefreshCw, CheckCircle2 } from 'lucide-react'
import { healthAPI, focusAPI } from '@/services/api'
import { useNotesStore } from '@/stores/notesStore'
import { useSubjectsStore } from '@/stores/subjectsStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useGoalsStore } from '@/stores/goalsStore'
import { useFocusStore } from '@/stores/focusStore'
import { allPages } from '@/data/navigation'
const tools = [
  { path: 'study-assistant', label: 'مساعد الدراسة', description: 'من المحتوى المعقد إلى فهم أعمق.', icon: Sparkles, color: 'violet' },
  { path: 'labs', label: 'مختبر البرمجة', description: 'جرّب فكرتك، واكتب أول سطر.', icon: FlaskConical, color: 'blue' },
  { path: 'flashcards', label: 'بطاقات المراجعة', description: 'مراجعة قصيرة، معرفة تدوم.', icon: Layers, color: 'amber' },
  { path: 'notes', label: 'ملاحظاتك', description: 'احتفظ بما تتعلم، بطريقتك.', icon: StickyNote, color: 'green' },
]
export default function DashboardPage() {
  const notes = useNotesStore(state => state.notes) || []
  const subjects = useSubjectsStore(state => state.subjects) || []
  const schedule = useScheduleStore(state => state.gridCourses)
  const goals = useGoalsStore(state => state.goals)
  const stats = useFocusStore(state => state.stats)
  const [connection, setConnection] = useState<'checking' | 'online' | 'offline'>('checking')
  const [daily, setDaily] = useState<Record<string, number>>({})
  const [refreshing, setRefreshing] = useState(false)
  const refresh = async () => {
    setRefreshing(true)
    const results = await Promise.allSettled([healthAPI.check(), focusAPI.heatmap(7), useFocusStore.getState().fetchStats(), useGoalsStore.getState().fetchGoals(), useNotesStore.getState().fetchNotes(), useSubjectsStore.getState().fetchSubjects()])
    const health = results[0]
    setConnection(health.status === 'fulfilled' && (health.value.data as { status?: string }).status === 'healthy' ? 'online' : 'offline')
    const heat = results[1]
    if (heat.status === 'fulfilled') setDaily((heat.value.data as { daily?: Record<string, number> }).daily || {})
    setRefreshing(false)
  }
  useEffect(() => { void refresh() }, [])
  const date = new Date()
  const todayName = date.toLocaleDateString('ar-SA', { weekday: 'long' })
  const todayClasses = schedule.filter(course => course.day?.includes(todayName))
  const week = Array.from({ length: 7 }, (_, index) => { const day = new Date(); day.setDate(day.getDate() - 6 + index); const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`; return { label: day.toLocaleDateString('ar', { weekday: 'short' }), minutes: daily[key] || 0 } })
  const max = Math.max(30, ...week.map(day => day.minutes))
  return <div className="page-stack dashboard">
    <div className="page-heading"><div><span className="eyebrow">{date.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}</span><h1>أهلًا بك، لنصنع يومًا مثمرًا<span className="heading-dot">.</span></h1><p>كل ما تحتاجه للتعلم والتنظيم، في مساحة واحدة.</p></div><button className="secondary-action" onClick={() => void refresh()} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />تحديث</button></div>
    {connection === 'offline' && <div className="connection-notice" role="status">تعذر الاتصال بالخادم. بياناتك المحلية متاحة؛ خدمات الذكاء الاصطناعي والمزامنة تحتاج إلى اتصال بالخادم.<Link to="/more">إعداد الاتصال <ArrowUpLeft size={14} /></Link></div>}
    <section className="dashboard-hero"><div className="hero-copy"><span className="hero-tag"><Sparkles size={14} />تعلم بطريقتك</span><h2>المعرفة تبدأ بفضول.<br />والإنجاز يبدأ بخطوة.</h2><p>حوّل يومك إلى خطة واضحة، وأفكارك إلى معرفة تستفيد منها.</p><div className="hero-actions"><Link to="/planner" className="primary-action">خطط ليومك <ArrowUpLeft size={18} /></Link><Link to="/study-assistant" className="hero-secondary">اسأل مساعد الدراسة <Sparkles size={17} /></Link></div></div><div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-core"><BookOpen size={57} strokeWidth={1.3} /></div><span className="art-satellite art-one"><Sparkles size={25} /></span><span className="art-satellite art-two"><CheckCircle2 size={24} /></span><span className="art-label">تعلم · جرّب · أنجز</span></div></section>
    <div className="stats-grid">{[
      { label: 'موادك الدراسية', value: subjects.length, icon: BookOpen, caption: 'معرفة تستحق الاستكشاف', path: 'subjects' },
      { label: 'ملاحظات محفوظة', value: notes.length, icon: StickyNote, caption: 'أفكارك في متناول يدك', path: 'notes' },
      { label: 'دقائق التركيز اليوم', value: stats?.today_minutes ?? '—', icon: Timer, caption: 'وقت تستثمره في نفسك', path: 'analytics' },
      { label: 'أهداف قيد الإنجاز', value: goals.filter(goal => !goal.completed).length, icon: Target, caption: 'خطوات تقربك مما تريد', path: 'goals' },
    ].map(stat => <Link className="stat-card" key={stat.label} to={`/${stat.path}`}><div><span>{stat.label}</span><stat.icon size={19} /></div><strong>{stat.value}</strong><small>{stat.caption}</small></Link>)}</div>
    <section><div className="section-heading"><h2>أدوات تصنع الفرق</h2><Link to="/more">استكشف الأقسام <ArrowUpLeft size={16} /></Link></div><div className="tool-grid">{tools.map(tool => <Link to={`/${tool.path}`} className="tool-card" key={tool.path}><span className={`tool-icon ${tool.color}`}><tool.icon size={24} /></span><h3>{tool.label}</h3><p>{tool.description}</p><ArrowUpLeft size={18} className="tool-arrow" /></Link>)}</div></section>
    <div className="dashboard-columns"><section className="surface-panel"><div className="section-heading"><h2><Timer size={18} />إيقاع التعلم</h2><span className="subtle">آخر 7 أيام</span></div><div className="study-chart" role="img" aria-label={week.map(day => `${day.label}: ${day.minutes} دقيقة`).join('، ')}>{week.map((day, index) => <div className="chart-column" key={index}><span>{day.minutes}</span><div className="chart-track"><div style={{ height: `${Math.max(2, day.minutes / max * 100)}%` }} /></div><small>{day.label}</small></div>)}</div><div className="panel-footer"><span>{connection === 'online' ? 'دقائق التركيز المسجلة فعليًا' : 'لم يتم تحميل سجل التركيز'}</span><button onClick={() => window.dispatchEvent(new Event('masar-open-focus'))}>ابدأ جلسة تركيز <ArrowUpLeft size={15} /></button></div></section>
    <section className="surface-panel"><div className="section-heading"><h2><CalendarDays size={18} />جدولك اليوم</h2><Link to="/schedule">عرض الجدول <ArrowUpLeft size={15} /></Link></div>{todayClasses.length ? <div className="class-list">{todayClasses.map(course => <Link key={course.id} to="/schedule"><span className="class-marker" /><div><strong>{course.name}</strong><small>{course.room || 'لم تحدد القاعة'}</small></div><span>{course.time}</span></Link>)}</div> : <div className="empty-state"><CalendarDays size={32} /><h3>مساحة ليوم أكثر هدوءًا</h3><p>لا توجد محاضرات في جدولك اليوم.</p><Link to="/schedule">نظم جدولك الدراسي <ArrowUpLeft size={15} /></Link></div>}</section></div>
    <section className="surface-panel discovery-panel"><div><Compass size={27} /><h2>مساحة كاملة، لتقدم متكامل</h2><p>من مراجعة الدروس إلى بناء مشروعك القادم.</p></div><div className="discovery-links">{allPages.filter(page => ['courses', 'english', 'projects', 'quiz-generator', 'kanban', 'goals'].includes(page.path)).map(page => <Link key={page.path} to={`/${page.path}`}><page.icon size={16} />{page.label}<ArrowUpLeft size={13} /></Link>)}</div></section>
  </div>
}
