import { useState, useEffect } from "react";
import { Plus, Trash2, Check, Compass, Timer } from "lucide-react";
import { useFocusStore } from "@/stores/focusStore";
interface Task {
  id: string;
  title: string;
  done: boolean;
  date: string;
}
const key = "masar-daily-planner-v1";
function dayKey() {
  return new Date().toLocaleDateString("en-CA");
}
export default function PlannerPage() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(data)
        ? data.filter(
            (task) =>
              typeof task?.id === "string" &&
              typeof task.title === "string" &&
              typeof task.done === "boolean" &&
              typeof task.date === "string",
          )
        : [];
    } catch {
      return [];
    }
  });
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"today" | "all">("today");
  useEffect(() => {
    const refresh = () => {
      try {
        const next = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(next)) setTasks(next);
      } catch {
        /* preserve current tasks */
      }
    };
    window.addEventListener("masar-cloud-applied", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("masar-cloud-applied", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const save = (next: Task[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setTasks(next);
      setError("");
    } catch {
      setError("تعذر حفظ الخطة على هذا الجهاز. تحقق من مساحة التخزين.");
    }
  };
  const visible = tasks.filter((task) => filter === "all" || task.date === dayKey());
  const done = visible.filter((task) => task.done).length;
  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">إنجاز بخطوات واضحة</span>
          <h1>خطة اليوم</h1>
          <p>اختر أهم أعمالك، امنحها وقتًا، واحتفل بكل خطوة.</p>
        </div>
        <Compass size={40} className="heading-icon" />
      </div>
      <div className="planner-summary">
        <div>
          <strong>
            {done} / {visible.length}
          </strong>
          <p>مهمة مكتملة</p>
        </div>
        <div className="progress-track">
          <span style={{ width: `${visible.length ? (done / visible.length) * 100 : 0}%` }} />
        </div>
        <small>تُحفظ خطتك محليًا على هذا المتصفح.</small>
      </div>
      <section className="surface-panel">
        <form
          className="planner-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            save([
              ...tasks,
              { id: crypto.randomUUID(), title: title.trim(), done: false, date: dayKey() },
            ]);
            setTitle("");
          }}
        >
          <input
            aria-label="مهمة جديدة"
            placeholder="ما الخطوة التي تريد إنجازها اليوم؟"
            value={title}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
          />
          <button className="primary-action" disabled={!title.trim()}>
            <Plus size={18} />
            إضافة مهمة
          </button>
        </form>
        {error && <p role="alert">{error}</p>}
        <div className="filter-tabs">
          <button aria-pressed={filter === "today"} onClick={() => setFilter("today")}>
            اليوم
          </button>
          <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
            كل المهام
          </button>
        </div>
        {visible.length ? (
          <ul className="planner-list">
            {visible.map((task) => (
              <li key={task.id}>
                <button
                  className={`task-check ${task.done ? "checked" : ""}`}
                  aria-label={`${task.done ? "إلغاء إكمال" : "إكمال"} ${task.title}`}
                  aria-pressed={task.done}
                  onClick={() =>
                    save(
                      tasks.map((item) =>
                        item.id === task.id ? { ...item, done: !item.done } : item,
                      ),
                    )
                  }
                >
                  {task.done && <Check size={17} />}
                </button>
                <span className={task.done ? "task-done" : ""}>
                  {task.title}
                  <small>{task.date}</small>
                </span>
                <button
                  className="icon-button"
                  aria-label={`التركيز على ${task.title}`}
                  onClick={() => {
                    const focus = useFocusStore.getState();
                    focus.setActiveTask(task.id, task.title);
                    window.dispatchEvent(new Event("masar-open-focus"));
                  }}
                >
                  <Timer size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`حذف ${task.title}`}
                  onClick={() => save(tasks.filter((item) => item.id !== task.id))}
                >
                  <Trash2 size={17} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <Compass size={34} />
            <h3>يوم جديد، فرصة جديدة</h3>
            <p>ابدأ بمهمة واحدة قابلة للإنجاز.</p>
          </div>
        )}
      </section>
    </div>
  );
}
