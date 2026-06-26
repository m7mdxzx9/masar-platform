import { useState, useRef } from 'react'
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, CheckSquare, Table, Eye, EyeOff, Save, X } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import MarkdownRenderer from './MarkdownRenderer'

interface WYSIWYGNoteEditorProps {
  initialTitle: string
  initialContent: string
  onSave: (title: string, content: string) => void
  onCancel: () => void
}

export default function WYSIWYGNoteEditor({
  initialTitle,
  initialContent,
  onSave,
  onCancel
}: WYSIWYGNoteEditorProps) {
  const { theme } = useTheme()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selected = text.substring(start, end)
    const replacement = before + selected + after

    setContent(text.substring(0, start) + replacement + text.substring(end))
    
    // Focus back and set selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 50)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Ctrl+B for Bold
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault()
      insertMarkdown('**', '**')
    }
    // Ctrl+I for Italic
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault()
      insertMarkdown('*', '*')
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full p-4 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.colors.border}` }}>
      {/* Title input */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="عنوان الملاحظة..."
        className="w-full bg-white/5 text-white rounded-xl px-4 py-3 font-bold outline-none border transition-colors focus:border-indigo-500"
        style={{ borderColor: theme.colors.border, direction: 'rtl' }}
      />

      {/* Editor Toolbar (WYSIWYG controls) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-black/40 border" style={{ borderColor: theme.colors.border }}>
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => insertMarkdown('**', '**')}
            title="عريض (Ctrl+B)"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => insertMarkdown('*', '*')}
            title="مائل (Ctrl+I)"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Italic size={16} />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button
            onClick={() => insertMarkdown('# ', '')}
            title="عنوان رئيسي 1"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Heading1 size={16} />
          </button>
          <button
            onClick={() => insertMarkdown('## ', '')}
            title="عنوان فرعي 2"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Heading2 size={16} />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button
            onClick={() => insertMarkdown('* ', '')}
            title="قائمة نقطية"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => insertMarkdown('1. ', '')}
            title="قائمة مرقمة"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ListOrdered size={16} />
          </button>
          <button
            onClick={() => insertMarkdown('- [ ] ', '')}
            title="قائمة مهام"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <CheckSquare size={16} />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button
            onClick={() => insertMarkdown('\n| العنوان 1 | العنوان 2 |\n| :--- | :--- |\n| قيمة 1 | قيمة 2 |\n')}
            title="إدراج جدول"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Table size={16} />
          </button>
        </div>

        <button
          onClick={() => setIsPreview(!isPreview)}
          title={isPreview ? "عرض التعديل" : "عرض المعاينة"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          {isPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {isPreview ? 'تعديل' : 'معاينة'}
        </button>
      </div>

      {/* Editor Main Area */}
      <div className="min-h-[200px] w-full rounded-xl overflow-hidden relative">
        {isPreview ? (
          <div className="p-4 bg-black/20 border min-h-[200px] rounded-xl overflow-y-auto leading-relaxed" style={{ borderColor: theme.colors.border }}>
            {content.trim() ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-white/40 text-xs text-right">لا يوجد محتوى للمعاينة...</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="اكتب ملاحظاتك بصيغة Markdown..."
            rows={8}
            className="w-full p-4 bg-white/5 text-white rounded-xl text-sm outline-none resize-y border transition-colors focus:border-indigo-500 font-mono"
            style={{ borderColor: theme.colors.border, direction: 'rtl' }}
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/10 flex items-center gap-1"
          style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}
        >
          <X size={14} /> إلغاء
        </button>
        <button
          onClick={() => onSave(title, content)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105 flex items-center gap-1"
          style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
        >
          <Save size={14} /> حفظ الملاحظة
        </button>
      </div>
    </div>
  )
}
