import { useState } from 'react'
import { useKanbanStore, type KanbanTask } from '@/stores/kanbanStore'
import { useFocusStore } from '@/stores/focusStore'
import { Play } from 'lucide-react'

const COLUMNS: { key: KanbanTask['status']; label: string; color: string }[] = [
  { key: 'done', label: '✅ مكتمل', color: 'border-green-500' },
  { key: 'review', label: '👀 مراجعة', color: 'border-yellow-500' },
  { key: 'in_progress', label: '🔄 قيد التنفيذ', color: 'border-blue-500' },
  { key: 'todo', label: '📋 للتنفيذ', color: 'border-gray-500' },
]

const PRIORITIES: { value: KanbanTask['priority']; label: string; color: string }[] = [
  { value: 'low', label: 'منخفض', color: 'bg-gray-600' },
  { value: 'medium', label: 'متوسط', color: 'bg-yellow-600' },
  { value: 'high', label: 'عالي', color: 'bg-red-600' },
]

export default function KanbanPage() {
  const { tasks, addTask, moveTask, deleteTask } = useKanbanStore()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<KanbanTask['priority']>('medium')

  const handleAdd = () => {
    if (!title.trim()) return
    addTask({ title, description, status: 'todo', priority, tags: [] })
    setTitle('')
    setDescription('')
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">📌 لوحة كانبان</h1>
          <p className="text-gray-400 text-sm">نظّم مهامك الدراسية</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + مهمة جديدة
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان المهمة"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="الوصف (اختياري)"
            rows={2}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none resize-none"
          />
          <div className="flex gap-2 items-center">
            <span className="text-gray-400 text-sm">الأولوية:</span>
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => setPriority(p.value)}
                className={`px-3 py-1 rounded text-xs text-white ${p.color} ${priority === p.value ? 'ring-2 ring-white' : 'opacity-60'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd}
            disabled={!title.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm"
          >
            إضافة
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key)
          return (
            <div key={col.key} className={`bg-gray-800 rounded-xl p-4 border-t-4 ${col.color}`}>
              <h3 className="text-white font-semibold mb-3">
                {col.label} <span className="text-gray-500 text-sm">({colTasks.length})</span>
              </h3>
              <div className="space-y-2 min-h-[100px]">
                {colTasks.map((task) => (
                  <div key={task.id} className="bg-gray-700 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-white text-sm font-medium">{task.title}</span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-500 hover:text-red-400 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    {task.description && (
                      <p className="text-gray-400 text-xs">{task.description}</p>
                    )}
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="flex items-center gap-1 text-[11px] text-red-400" title="جلسات التركيز المكتملة">
                        <span>🍅</span>
                        <span className="font-bold">{task.pomodorosCompleted || 0}</span>
                      </span>
                      <button
                        onClick={() => {
                          const focusStore = useFocusStore.getState()
                          focusStore.setActiveTask(task.id, task.title)
                          focusStore.setSessionType('focus')
                          focusStore.setIsActive(true)
                          focusStore.setIsPaused(false)
                        }}
                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-red-950/40 text-red-400 hover:bg-red-900/40 border border-red-500/20 font-bold transition-all"
                      >
                        <Play size={10} fill="currentColor" />
                        <span>تركيز</span>
                      </button>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {COLUMNS.filter((c) => c.key !== task.status).map((c) => (
                        <button
                          key={c.key}
                          onClick={() => moveTask(task.id, c.key)}
                          className="text-[10px] bg-gray-600 hover:bg-gray-500 text-gray-300 px-2 py-0.5 rounded"
                        >
                          → {c.label.replace(/[^\u0600-\u06FF\s]/g, '').trim()}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
