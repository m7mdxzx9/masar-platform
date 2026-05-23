import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, Trash2, Search, Code2, Loader2, BookmarkPlus, X } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useSnippetsStore } from '@/stores/snippetsStore'
import { useNavigate } from 'react-router-dom'

export default function CodeLibraryPage() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { snippets, isLoading, fetchSnippets, deleteSnippet } = useSnippetsStore()
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [languageFilter, setLanguageFilter] = useState('')

  useEffect(() => {
    fetchSnippets()
  }, [])

  const handleCopy = async (code: string, id: number) => {
    await navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    fetchSnippets({ search: val || undefined, language: languageFilter || undefined })
  }

  const filtered = snippets.filter((s) => {
    if (languageFilter && s.language !== languageFilter) return false
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
          <Code2 size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>مكتبة الكود</h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>المقتطفات البرمجية المحفوظة</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: theme.colors.textMuted }} />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            placeholder="ابحث في المكتبة..."
            className="w-full px-12 py-3 rounded-2xl text-sm outline-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
        </div>
        <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}
          className="px-4 py-3 rounded-2xl text-sm outline-none"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }}>
          <option value="">الكل</option>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <BookmarkPlus size={80} className="mb-4" style={{ color: theme.colors.textDark }} />
          <p className="text-xl font-bold" style={{ color: theme.colors.text }}>المكتبة فارغة</p>
          <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>اذهب إلى المختبر الذكي واحفظ مقتطفاتك البرمجية</p>
          <button onClick={() => navigate('/labs')}
            className="mt-4 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            الذهاب إلى المختبر
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((snippet, idx) => (
          <motion.div key={snippet.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
            className="rounded-2xl overflow-hidden backdrop-blur-[20px] shadow-2xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
            <div className="flex items-center justify-between p-4 bg-black/20" style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
              <div className="flex items-center gap-3">
                <Code2 className="w-4 h-4" style={{ color: theme.colors.accent }} />
                <span className="font-bold text-sm" style={{ color: theme.colors.text }}>{snippet.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ color: '#fff', backgroundColor: theme.colors.accent + '40' }}>
                  {snippet.language}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleCopy(snippet.code, snippet.id)} className="p-2 rounded-lg transition-all hover:bg-white/10" title="نسخ" style={{ color: theme.colors.textMuted }}>
                  {copiedId === snippet.id ? <Check size={14} style={{ color: theme.colors.success }} /> : <Copy size={14} />}
                </button>
                <button onClick={() => { if (confirm('حذف هذا المقتطف؟')) deleteSnippet(snippet.id) }}
                  className="p-2 rounded-lg transition-all hover:bg-white/10 hover:text-red-400" title="حذف" style={{ color: theme.colors.textMuted }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <pre className="p-4 overflow-auto text-xs leading-relaxed max-h-[200px]" dir="ltr"
              style={{ color: theme.colors.textMuted, backgroundColor: 'rgba(0,0,0,0.4)' }}>
              {snippet.code}
            </pre>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
