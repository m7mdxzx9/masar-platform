import React from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { useKanbanStore } from '@/stores/kanbanStore';
import { KanbanTask, KanbanColumn } from '@/types';
import { Button, Badge } from '@/components/ui';

function TaskCard({ task, isDragging }: { task: KanbanTask; isDragging?: boolean }) {
  return (
    <div className={`p-3 rounded-xl bg-masar-surface/50 border cursor-grab ${isDragging ? 'border-masar-cyan/30 shadow-lg' : 'border-masar-border/30'}`}>
      <div className="flex items-start gap-2">
        <GripVertical size={16} className="text-masar-text-dark mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-masar-text mb-1">{task.title}</h4>
          <p className="text-xs text-masar-text-muted mb-2">{task.description}</p>
          <div className="flex items-center gap-2">
            <Badge variant="default" size="sm">{task.tag}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableTask({ task, columnId }: { task: KanbanTask; columnId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id, data: { columnId } });
  const style = { transform: CSS.Translate.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  );
}

export default function KanbanPage() {
  const { columns, moveTask } = useKanbanStore();

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const fromColumn = columns.find((col) => col.tasks.some((t) => t.id === activeId));
    const toColumn = columns.find((col) => col.id === overId);
    if (fromColumn) {
      moveTask(activeId, fromColumn.id, toColumn?.id || fromColumn.id);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">إدارة المهام</h1>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <ColumnComponent key={column.id} column={column} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function ColumnComponent({ column }: { column: KanbanColumn }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-masar-text flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.color}`} />
          {column.title}
        </h3>
        <Badge variant="default" size="sm">{column.tasks.length}</Badge>
      </div>
      <div className="space-y-3 min-h-[200px] rounded-xl border border-dashed border-masar-border/30 p-3">
        <SortableContext items={column.tasks.map((t) => t.id)}>
          {column.tasks.map((task) => (
            <SortableTask key={task.id} task={task} columnId={column.id} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
