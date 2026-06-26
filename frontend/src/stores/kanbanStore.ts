import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface KanbanTask {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  tags: string[]
  createdAt: string
  pomodorosCompleted?: number
}

interface KanbanState {
  tasks: KanbanTask[]
  addTask: (task: Omit<KanbanTask, 'id' | 'createdAt'>) => void
  updateTask: (id: string, updates: Partial<KanbanTask>) => void
  moveTask: (id: string, status: KanbanTask['status']) => void
  deleteTask: (id: string) => void
  incrementPomodoroCount: (id: string) => void
}

let _counter = 0

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set) => ({
      tasks: [],

      addTask: (task) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              ...task,
              id: `task-${Date.now()}-${++_counter}`,
              createdAt: new Date().toISOString(),
              pomodorosCompleted: 0,
            },
          ],
        })),

      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      moveTask: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        })),

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      incrementPomodoroCount: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, pomodorosCompleted: (t.pomodorosCompleted || 0) + 1 } : t)),
        })),
    }),
    { name: 'masar-kanban' }
  )
)
