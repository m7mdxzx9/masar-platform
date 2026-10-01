import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  StickyNote,
  Target,
  BrainCircuit,
  TrendingUp,
  Activity,
  Timer,
  FileCode,
  GraduationCap,
  RefreshCw,
  ArrowUpLeft,
  CheckCircle2,
} from "lucide-react";
import { apiClient } from "@/services/api";

interface Overview {
  subjects: number;
  notes: number;
  courses: number;
  goals: number;
  snippets: number;
  focus_minutes_7d: number;
  completed_goals: number;
}
interface Progress {
  total_skills_tracked: number;
  total_attempts: number;
  accuracy_percent: number;
  mastery_distribution: Record<string, number>;
}
interface Focus {
  total_sessions: number;
  avg_session_minutes: number;
  daily_minutes: Record<string, number>;
  focus_minutes_7d?: number;
}
interface ActivityEvent {
  type: string;
  action: string;
  title: string;
  timestamp: string;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const results = await Promise.allSettled([
      apiClient.get<Overview>("/analytics/overview", { signal }),
      apiClient.get<Progress>("/analytics/progress", { signal }),
      apiClient.get<Focus>("/analytics/focus", { signal }),
      apiClient.get<{ events: ActivityEvent[] }>("/analytics/activity", { signal }),
    ]);
    if (signal?.aborted) return;
    const [o, p, f, a] = results;
    setOverview(o.status === "fulfilled" ? o.value.data : null);
    setProgress(p.status === "fulfilled" ? p.value.data : null);
    setFocus(f.status === "fulfilled" ? f.value.data : null);
    setActivity(a.status === "fulfilled" ? a.value.data.events || [] : null);
    setError(results.some((result) => result.status === "rejected"));
    setLoading(false);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const week = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - 6 + index);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    return {
      label: day.toLocaleDateString("ar", { weekday: "short" }),
      minutes: focus?.daily_minutes?.[key] || 0,
    };
  });
  const max = Math.max(30, ...week.map((day) => day.minutes));
  const masteryNames: Record<string, string> = {
    beginner: "مبتدئ",
    intermediate: "متوسط",
    advanced: "متقدم",
    mastered: "متقن",
  };
  const statCards = [
    { label: "المواد الدراسية", value: overview?.subjects, icon: BookOpen, path: "subjects" },
    { label: "ملاحظاتك", value: overview?.notes, icon: StickyNote, path: "notes" },
    { label: "الأهداف", value: overview?.goals, icon: Target, path: "goals" },
    { label: "الدورات", value: overview?.courses, icon: GraduationCap, path: "courses" },
    { label: "مقتطفات الكود", value: overview?.snippets, icon: FileCode, path: "code-library" },
    { label: "أهداف مكتملة", value: overview?.completed_goals, icon: CheckCircle2, path: "goals" },
  ];

  return (
    <div className="page-stack analytics-page" aria-busy={loading}>
      <div className="page-heading">
        <div>
          <span className="eyebrow">كل خطوة تستحق أن تراها</span>
          <h1>
            تقدمك، بوضوح<span className="heading-dot">.</span>
          </h1>
          <p>نظرة على وقتك ومعرفتك والأهداف التي تقترب منها.</p>
        </div>
        <button className="secondary-action" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          تحديث
        </button>
      </div>
      {error && (
        <div role="status" className="connection-notice">
          تعذر تحميل بعض الإحصاءات. القيم غير المتاحة تظهر بعلامة —. يمكنك تحديث الصفحة عند استعادة
          الاتصال.
        </div>
      )}
      <div className="analytics-stats">
        {statCards.map((stat) => (
          <Link to={`/${stat.path}`} className="stat-card" key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <stat.icon size={19} />
            </div>
            <strong>{loading ? "…" : (stat.value ?? "—")}</strong>
            <small>
              عرض التفاصيل <ArrowUpLeft size={12} />
            </small>
          </Link>
        ))}
      </div>
      <div className="analytics-overview">
        <section className="surface-panel analytics-focus">
          <div className="section-heading">
            <h2>
              <BarChart3 size={20} />
              وقت يستثمر فيك
            </h2>
            <span className="subtle">آخر 7 أيام</span>
          </div>
          <div className="focus-headline">
            <strong>
              {loading ? "…" : (focus?.focus_minutes_7d ?? overview?.focus_minutes_7d ?? "—")}
            </strong>
            <div>
              <span>دقيقة تركيز</span>
              <small>الممارسة اليومية تصنع تقدمًا مستمرًا</small>
            </div>
          </div>
          {focus ? (
            <div
              className="study-chart"
              role="img"
              aria-label={week.map((day) => `${day.label}: ${day.minutes} دقيقة`).join("، ")}
            >
              {week.map((day, index) => (
                <div className="chart-column" key={index}>
                  <span>{day.minutes}</span>
                  <div className="chart-track">
                    <div style={{ height: `${Math.max(2, (day.minutes / max) * 100)}%` }} />
                  </div>
                  <small>{day.label}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="analytics-chart-empty">
              <BarChart3 size={30} />
              <p>{loading ? "جاري تحميل سجل التركيز…" : "سجل التركيز غير متاح حاليًا"}</p>
            </div>
          )}
          <div className="analytics-focus-footer">
            <div>
              <strong>{focus?.total_sessions ?? "—"}</strong>
              <span>جلسة مسجلة</span>
            </div>
            <div>
              <strong>{focus?.avg_session_minutes ?? "—"}</strong>
              <span>متوسط الدقائق للجلسة</span>
            </div>
            <button
              className="primary-action"
              onClick={() => window.dispatchEvent(new Event("masar-open-focus"))}
            >
              <Timer size={16} />
              وقت للتركيز
            </button>
          </div>
        </section>
        <section className="surface-panel analytics-progress">
          <div className="section-heading">
            <h2>
              <BrainCircuit size={20} />
              معرفة تنمو
            </h2>
            <TrendingUp size={18} className="heading-icon" />
          </div>
          <div
            className="accuracy-ring"
            style={
              {
                "--accuracy": `${Math.min(100, Math.max(0, progress?.accuracy_percent || 0)) * 3.6}deg`,
              } as CSSProperties
            }
          >
            <div>
              <strong>{progress ? `${progress.accuracy_percent}%` : "—"}</strong>
              <span>دقة الإجابات</span>
            </div>
          </div>
          <div className="learning-counters">
            <div>
              <strong>{progress?.total_skills_tracked ?? "—"}</strong>
              <span>مهارة متعقبة</span>
            </div>
            <div>
              <strong>{progress?.total_attempts ?? "—"}</strong>
              <span>محاولة تعلم</span>
            </div>
          </div>
          <Link className="analytics-text-link" to="/quiz-generator">
            اختبر ما تعلمته <ArrowUpLeft size={15} />
          </Link>
        </section>
      </div>
      <div className="analytics-bottom">
        <section className="surface-panel">
          <div className="section-heading">
            <h2>
              <Activity size={19} />
              أثر خطواتك
            </h2>
            <span className="subtle">النشاط الأخير</span>
          </div>
          {activity?.length ? (
            <ul className="activity-timeline">
              {activity.slice(0, 6).map((event, index) => (
                <li key={index}>
                  <span className="activity-icon">
                    {event.type === "note" ? <StickyNote size={17} /> : <Target size={17} />}
                  </span>
                  <div>
                    <strong>{event.title}</strong>
                    <small>{event.action}</small>
                  </div>
                  <time>
                    {event.timestamp && !Number.isNaN(Date.parse(event.timestamp))
                      ? new Date(event.timestamp).toLocaleDateString("ar", {
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <Activity size={30} />
              <h3>{activity ? "خطوتك التالية بداية الأثر" : "لا يتوفر سجل النشاط الآن"}</h3>
              <p>{activity ? "ملاحظاتك وإنجازاتك ستظهر هنا." : "سيظهر نشاطك بعد تحميل بياناتك."}</p>
            </div>
          )}
        </section>
        <section className="surface-panel">
          <div className="section-heading">
            <h2>
              <Target size={19} />
              رحلة الإتقان
            </h2>
            <Link to="/courses">
              دوراتك <ArrowUpLeft size={15} />
            </Link>
          </div>
          {progress?.mastery_distribution && Object.keys(progress.mastery_distribution).length ? (
            <div className="mastery-bars">
              {Object.entries(progress.mastery_distribution).map(([level, count]) => {
                const total = Object.values(progress.mastery_distribution).reduce(
                  (sum, value) => sum + value,
                  0,
                );
                return (
                  <div key={level}>
                    <div>
                      <span>{masteryNames[level] || level}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Target size={30} />
              <h3>تعلّم، جرّب، أتقن</h3>
              <p>{progress ? "ابدأ الاختبارات لتتبع مستوى إتقانك." : "لم يُحمّل سجل الإتقان بعد."}</p>
              <Link to="/courses">
                استكشف مسارات التعلم <ArrowUpLeft size={15} />
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
