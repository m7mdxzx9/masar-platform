import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useTheme, DesignStyle } from '../theme/ThemeContext'
import { setCustomBackendUrl, API_BASE_URL } from '../services/api'
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  BookOpen,
  BookMarked,
  StickyNote,
  FlaskConical,
  BrainCircuit,
  Trophy,
  BookmarkPlus,
  Rocket,
  KanbanSquare,
  Lightbulb,
  ClipboardList,
  Target,
  Globe,
  HardDrive,
  BarChart3,
  Cloud,
  Library,
  Palette,
  Layers,
  Check,
  Server,
  Settings,
  ArrowLeft,
  ChevronLeft
} from 'lucide-react'

interface LinkItem {
  to: string
  labelAr: string
  labelEn: string
  descAr: string
  descEn: string
  icon: any
}

interface Category {
  id: string
  nameAr: string
  nameEn: string
  links: LinkItem[]
}

export default function MorePage() {
  const { theme, setTheme, themes, designStyle, setDesignStyle } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isAr = i18n.language === 'ar'

  const [backendUrl, setBackendUrl] = useState(API_BASE_URL)
  const [urlSaved, setUrlSaved] = useState(false)

  const categories: Category[] = [
    {
      id: 'academic',
      nameAr: 'الدراسة والمذاكرة',
      nameEn: 'Academics & Study',
      links: [
        { to: '/dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', descAr: 'ملخص الأداء والمستوى الدراسي والتنبيهات اليومية', descEn: 'Overview of academic progress, statistics and daily alerts', icon: LayoutDashboard },
        { to: '/calendar', labelAr: 'التقويم الدراسي', labelEn: 'Academic Calendar', descAr: 'استيراد ومزامنة جداول وتواريخ الاختبارات والمحاضرات', descEn: 'Import and synchronize lectures and exam dates', icon: Calendar },
        { to: '/schedule', labelAr: 'الجدول الأسبوعي', labelEn: 'Weekly Schedule', descAr: 'ترتيب وتوزيع الحصص والمحاضرات الأسبوعية بسحب وإفلات', descEn: 'Arrange classes and weekly lectures via drag-and-drop', icon: GraduationCap },
        { to: '/subjects', labelAr: 'المواد الدراسية', labelEn: 'Subjects & Files', descAr: 'إدارة ملفات ومحتويات المواد وفهرستها بالذكاء الاصطناعي', descEn: 'Manage university subjects, lecture files and indexing', icon: BookMarked },
        { to: '/notes', labelAr: 'الملاحظات الذكية', labelEn: 'Smart Notes', descAr: 'حفظ وتدوين ملاحظات نصية وتسجيلات صوتية ومراجعتها', descEn: 'Record audio lectures, type study notes and summarize them', icon: StickyNote },
      ]
    },
    {
      id: 'ai',
      nameAr: 'مختبر الذكاء الاصطناعي',
      nameEn: 'AI Lab Tools',
      links: [
        { to: '/study-assistant', labelAr: 'المساعد الدراسي', labelEn: 'Study Assistant', descAr: 'محادثة الملفات، تلخيص المحاضرات الطويلة والإجابة على الأسئلة', descEn: 'Chat with PDF files, summarize lectures and answer questions', icon: Lightbulb },
        { to: '/lessons', labelAr: 'الدروس التفاعلية', labelEn: 'Interactive Lessons', descAr: 'شرح معزز بالذكاء لأساسيات ونظريات الذكاء الاصطناعي', descEn: 'AI-guided lessons covering AI engineering and algorithms', icon: Library },
        { to: '/labs', labelAr: 'المختبر الذكي', labelEn: 'Smart Lab', descAr: 'بيئة تشغيل وبناء أكواد بايثون كاملة داخل المتصفح', descEn: 'Write and execute Python code in-browser via Pyodide WASM', icon: FlaskConical },
        { to: '/agents', labelAr: 'وكلاء الذكاء الاصطناعي', labelEn: 'AI Agents Chat', descAr: 'استشارة ومحاورة مجموعة من الوكلاء المتخصصين', descEn: 'Consult and chat with role-based specialized AI agents', icon: BrainCircuit },
        { to: '/quiz-generator', labelAr: 'مولد الاختبارات', labelEn: 'Quiz Generator', descAr: 'صناعة كويزات وتقييم فوري لمستواك بالذكاء الاصطناعي', descEn: 'Generate tests from files and get Bayesian adaptive results', icon: ClipboardList },
        { to: '/flashcards', labelAr: 'البطاقات التعليمية', labelEn: 'Flashcards', descAr: 'إنشاء بطاقات استذكار ذكية لسرعة الحفظ والمراجعة', descEn: 'Create interactive flashcards for active recall study', icon: BrainCircuit },
      ]
    },
    {
      id: 'productivity',
      nameAr: 'الإنتاجية والمهام',
      nameEn: 'Productivity & Tasks',
      links: [
        { to: '/courses', labelAr: 'الدورات التعليمية', labelEn: 'AI Courses Path', descAr: 'مسارات تعلم متكاملة لعلوم وهندسة الذكاء الاصطناعي', descEn: 'Structured learning pathways for machine learning', icon: BookOpen },
        { to: '/challenges', labelAr: 'تحديات الألعاب', labelEn: 'Gamified Challenges', descAr: 'سباق حروف وألعاب ذكية لتعلم البرمجة وهندسة الأوامر', descEn: 'Play coding games, keyword racing, and earn ranks', icon: Trophy },
        { to: '/projects', labelAr: 'مولد المشاريع', labelEn: 'Project Generator', descAr: 'توليد مشاريع برمجية متدرجة لملف إنجازك المهني', descEn: 'Generate portfolio-ready project milestones with AI', icon: Rocket },
        { to: '/kanban', labelAr: 'لوحة كانبان للمهام', labelEn: 'Kanban Board', descAr: 'تنظيم وإدارة المهام الدراسية وتتبع تقدمها اليومي', descEn: 'Organize study tasks, set pomodoro timers and boards', icon: KanbanSquare },
        { to: '/goals', labelAr: 'الأهداف الشخصية', labelEn: 'Study Goals', descAr: 'تحديد أهداف دراسية ومراقبة تقدمها لإنجاز مستهدفاتك', descEn: 'Track your study hour targets, completed courses, and quiz counts', icon: Target },
        { to: '/code-library', labelAr: 'مكتبة الكود', labelEn: 'My Code Library', descAr: 'حفظ وتخزين مقتطفات برمجية هامة للرجوع إليها سريعاً', descEn: 'Save and tag reusable Python code snippets from labs', icon: BookmarkPlus },
      ]
    },
    {
      id: 'system',
      nameAr: 'النظام والنسخ الاحتياطي',
      nameEn: 'System & Sync',
      links: [
        { to: '/backup', labelAr: 'النسخ الاحتياطي', labelEn: 'Database Backup', descAr: 'إنشاء واستعادة نسخ احتياطية شاملة لجميع بياناتك', descEn: 'Export or restore complete database backups locally', icon: HardDrive },
        { to: '/drive', labelAr: 'السحابة وحفظ الملفات', labelEn: 'Google Drive Sync', descAr: 'ربط ومزامنة الملفات والملاحظات مع جوجل درايف سحابياً', descEn: 'Link Google Drive to sync backups and PDF summaries', icon: Cloud },
        { to: '/analytics', labelAr: 'التحليلات والإحصائيات', labelEn: 'Analytics Page', descAr: 'تقارير بيانية مفصلة عن نشاطك وساعات دراستك وتطورك', descEn: 'Detailed graphical analytics about study time and habits', icon: BarChart3 },
      ]
    }
  ]

  const handleLangToggle = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(newLang)
    localStorage.setItem('masar-lang', newLang)
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = newLang
  }

  const handleSaveBackendUrl = () => {
    setCustomBackendUrl(backendUrl)
    setUrlSaved(true)
    setTimeout(() => setUrlSaved(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 text-right" style={{ direction: isAr ? 'rtl' : 'ltr', textAlign: isAr ? 'right' : 'left' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b" style={{ borderColor: `${theme.colors.border}50` }}>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: theme.colors.text }}>
            {isAr ? 'المزيد من الخيارات' : 'More Options'}
          </h1>
          <p className="text-sm" style={{ color: theme.colors.textMuted }}>
            {isAr ? 'تصفح كافة أدوات المنصة، تحكم بالسمات واللغات وإعدادات الخادم' : 'Navigate all sections, customize system themes, languages, and API endpoints'}
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="p-3 rounded-2xl transition-all cursor-pointer border"
          style={{
            borderColor: `${theme.colors.border}80`,
            backgroundColor: `${theme.colors.surface}50`,
            color: theme.colors.textMuted
          }}
          title={isAr ? 'رجوع' : 'Back'}
        >
          <ArrowLeft size={18} className={isAr ? '' : 'rotate-180'} />
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Navigation Section (Left/Right depending on language, occupies 2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {categories.map((cat) => (
            <div key={cat.id} className="space-y-4">
              <h2 className="text-sm font-bold tracking-wider uppercase px-2" style={{ color: theme.colors.accent }}>
                {isAr ? cat.nameAr : cat.nameEn}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cat.links.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="group flex gap-4 p-4 rounded-2xl transition-all border shadow-sm"
                      style={{
                        backgroundColor: `${theme.colors.surface}40`,
                        borderColor: theme.colors.border
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${theme.colors.surfaceHover}50`
                        e.currentTarget.style.borderColor = theme.colors.accent
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${theme.colors.surface}40`
                        e.currentTarget.style.borderColor = theme.colors.border
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: `${theme.colors.accent}15`,
                          color: theme.colors.accent
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm mb-1 group-hover:text-white transition-colors" style={{ color: theme.colors.text }}>
                          {isAr ? link.labelAr : link.labelEn}
                        </h3>
                        <p className="text-xs leading-relaxed truncate text-wrap" style={{ color: theme.colors.textMuted }}>
                          {isAr ? link.descAr : link.descEn}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Settings Column (Right/Left depending on language, occupies 1 col) */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold tracking-wider uppercase px-2" style={{ color: theme.colors.accent }}>
            {isAr ? 'إعدادات المنصة' : 'Platform Settings'}
          </h2>

          <div
            className="p-5 rounded-3xl border space-y-6 shadow-lg backdrop-blur-md"
            style={{
              backgroundColor: `${theme.colors.surface}50`,
              borderColor: theme.colors.border
            }}
          >
            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold flex items-center gap-2" style={{ color: theme.colors.textDark }}>
                <Globe size={14} style={{ color: theme.colors.accent }} />
                <span>{isAr ? 'لغة الواجهة' : 'Interface Language'}</span>
              </label>
              <button
                onClick={handleLangToggle}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all cursor-pointer"
                style={{
                  backgroundColor: `${theme.colors.surfaceHover}30`,
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }}
              >
                <span>{isAr ? 'العربية' : 'English'}</span>
                <span className="text-xs" style={{ color: theme.colors.accent }}>
                  {isAr ? 'اضغط للتحويل إلى الإنجليزية' : 'Click to change to Arabic'}
                </span>
              </button>
            </div>

            {/* Design Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold flex items-center gap-2" style={{ color: theme.colors.textDark }}>
                <Layers size={14} style={{ color: theme.colors.accent }} />
                <span>{isAr ? 'طراز تصميم الواجهة' : 'Interface Design Style'}</span>
              </label>
              <div
                className="grid grid-cols-3 gap-1 p-1 rounded-xl"
                style={{ backgroundColor: `${theme.colors.surfaceHover}50` }}
              >
                {[
                  { id: 'classic', nameAr: 'كلاسيك', nameEn: 'Classic' },
                  { id: 'brutalist', nameAr: 'وحشي', nameEn: 'Brutalist' },
                  { id: 'glass', nameAr: 'زجاجي', nameEn: 'Glassmorphism' }
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setDesignStyle(style.id as DesignStyle)}
                    className="text-[11px] py-2 px-1 rounded-lg font-bold transition-all cursor-pointer text-center select-none"
                    style={{
                      backgroundColor: designStyle === style.id ? theme.colors.accent : 'transparent',
                      color: designStyle === style.id ? '#0A0E17' : theme.colors.textMuted,
                      boxShadow: designStyle === style.id ? `0 2px 8px ${theme.colors.accent}40` : 'none',
                    }}
                  >
                    {isAr ? style.nameAr : style.nameEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Themes Color Palette Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold flex items-center gap-2" style={{ color: theme.colors.textDark }}>
                <Palette size={14} style={{ color: theme.colors.accent }} />
                <span>{isAr ? 'مظهر الألوان المخصص' : 'Custom Color Theme'}</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="flex items-center gap-2.5 p-2 rounded-xl border text-right cursor-pointer transition-all"
                    style={{
                      backgroundColor: theme.id === t.id ? `${theme.colors.accent}10` : 'transparent',
                      borderColor: theme.id === t.id ? theme.colors.accent : theme.colors.border,
                      color: theme.id === t.id ? theme.colors.accent : theme.colors.textMuted
                    }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: t.colors.accent,
                        boxShadow: `0 0 6px ${t.colors.accent}80`
                      }}
                    />
                    <span className="text-xs truncate">{isAr ? t.nameAr : t.name}</span>
                    {theme.id === t.id && (
                      <Check size={10} className="mr-auto" style={{ color: theme.colors.accent }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Laptop App Connection & Backend Server URL */}
            <div className="space-y-2 pt-2 border-t" style={{ borderColor: `${theme.colors.border}80` }}>
              <label className="text-xs font-bold flex items-center gap-2" style={{ color: theme.colors.textDark }}>
                <Server size={14} style={{ color: theme.colors.accent }} />
                <span>{isAr ? 'الاتصال مع خادم اللابتوب' : 'Laptop Server Endpoint'}</span>
              </label>
              <p className="text-[10px] leading-normal mb-2" style={{ color: theme.colors.textMuted }}>
                {isAr
                  ? 'بشكل تلقائي يتصل التطبيق بالخادم المحلي أو السحابي، يمكنك تعيين رابط الخادم يدوياً لربطه مع اللابتوب.'
                  : 'By default, the platform detects localhost or cloud server. You can specify a custom endpoint to link with your laptop.'}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="http://localhost:8000/api/v1"
                  className="flex-1 text-xs px-3 py-2.5 rounded-xl border outline-none font-mono"
                  style={{
                    backgroundColor: `${theme.colors.surfaceHover}20`,
                    borderColor: theme.colors.border,
                    color: theme.colors.text,
                    textAlign: 'left',
                    direction: 'ltr'
                  }}
                />
                <button
                  onClick={handleSaveBackendUrl}
                  className="px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0"
                  style={{
                    backgroundColor: theme.colors.accent,
                    color: '#0A0E17'
                  }}
                >
                  {urlSaved ? (isAr ? 'تم' : 'Saved') : (isAr ? 'حفظ' : 'Save')}
                </button>
              </div>
            </div>

            {/* Connection Status Details */}
            <div
              className="flex items-center gap-3 p-3.5 rounded-2xl text-[11px]"
              style={{
                backgroundColor: `${theme.colors.surfaceHover}20`,
                color: theme.colors.textMuted
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" style={{ boxShadow: '0 0 8px rgba(34,197,94,0.6)' }} />
              <div>
                <p className="font-bold text-white/90">{isAr ? 'المزامنة السحابية نشطة' : 'Database Sync Active'}</p>
                <p className="opacity-70 mt-0.5">{isAr ? 'يتم حفظ البيانات ومزامنتها تلقائياً مع اللابتوب' : 'Data is automatically mirrored with your desktop app'}</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
