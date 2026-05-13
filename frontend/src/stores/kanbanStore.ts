import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { KanbanColumn } from '@/types';

interface KanbanStore {
  columns: KanbanColumn[];
  moveTask: (taskId: string, from: string, to: string) => void;
}

const initial: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'المهام',
    color: 'bg-masar-cyan',
    tasks: [
      { id: 't1', title: 'قراءة فصل NN', description: 'قراءة فصل الشبكات العصبية', tag: 'دراسة', tagColor: 'bg-masar-cyan', elapsed: 0 },
    ],
  },
  { id: 'inprogress', title: 'قيد التنفيذ', color: 'bg-masar-warning', tasks: [] },
  { id: 'done', title: 'منجز', color: 'bg-masar-success', tasks: [] },
];

export const useKanbanStore = create<KanbanStore>()(
  persist(
    (set) => ({
      columns: initial,
      moveTask: (taskId, from, to) =>
        set((s) => {
          const cols = [...s.columns];
          const fromCol = cols.find((c) => c.id === from);
          const toCol = cols.find((c) => c.id === to);
          if (!fromCol || !toCol) return s;
          const task = fromCol.tasks.find((t) => t.id === taskId);
          if (!task) return s;
          fromCol.tasks = fromCol.tasks.filter((t) => t.id !== taskId);
          toCol.tasks.push(task);
          return { columns: cols };
        }),
    }),
    { name: 'masar-kanban' }
  )
);
