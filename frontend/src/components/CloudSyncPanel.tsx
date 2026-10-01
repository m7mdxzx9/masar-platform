import { useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { Cloud, LogOut, RefreshCw } from "lucide-react";
import {
  getCloudEngine,
  getCloudStatus,
  reconnectCloud,
  subscribeCloud,
} from "@/services/cloud/cloudSync";
import {
  clearCloudSession,
  getCloudConfig,
  getCloudSession,
  saveCloudConfig,
  signInCloud,
} from "@/services/cloud/SupabaseTransport";

const labels: Record<string, string> = {
  disconnected: "غير مرتبط",
  setup: "اختر بداية المزامنة",
  ready: "بانتظار المزامنة",
  syncing: "جارٍ التحقق والمزامنة",
  synced: "آخر مزامنة ناجحة",
  offline: "تعذر الاتصال",
  conflict: "تعارض يحتاج اختيارك",
};
const names: Record<string, string> = {
  "masar-daily-planner-v1": "خطة اليوم",
  "masar-goals": "الأهداف",
  "masar-kanban": "المهام",
  "masar-calendar": "التقويم",
  "masar-subjects-storage": "المواد",
  "masar-notes-storage": "الملاحظات",
  "masar-schedule-storage": "الجدول",
  "masar-vocabulary-storage": "المفردات",
  "masar-progress-storage": "التقدم",
  "masar-lab-code": "كود المختبر",
};
export function CloudSyncStatus() {
  const status = useSyncExternalStore(subscribeCloud, getCloudStatus);
  return (
    <Link
      to="/backup"
      className="cloud-status"
      aria-label={`المزامنة: ${labels[status.state]}`}
      data-state={status.state}
      title={`${labels[status.state]}${status.pending ? ` · ${status.pending} تعديل غير مرسل` : ""}`}
    >
      <Cloud size={17} />
      <span>{labels[status.state]}</span>
    </Link>
  );
}
export default function CloudSyncPanel() {
  const status = useSyncExternalStore(subscribeCloud, getCloudStatus);
  const config = getCloudConfig();
  const session = getCloudSession();
  const [url, setUrl] = useState(config?.url || "");
  const [key, setKey] = useState(config?.key || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <section className="surface-panel cloud-panel">
      <div className="cloud-heading">
        <Cloud size={28} />
        <div>
          <h2>بياناتك على أجهزتك</h2>
          <p>سجّل الدخول بالحساب نفسه من كل جهاز. تُحفظ التعديلات محليًا حتى يؤكد الخادم استلامها.</p>
        </div>
        <span className="cloud-state" data-state={status.state}>
          {labels[status.state]}
        </span>
      </div>
      {(error || status.error) && (
        <p role="alert" className="cloud-error">
          {error || status.error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {!session ? (
        <>
          <details open={!config}>
            <summary>إعداد مشروع المزامنة</summary>
            <p>
              جهّز مشروع Supabase ونفّذ ملف إعداد قاعدة البيانات في المستودع، ثم أنشئ حسابك من لوحة
              المشروع. استخدم المفتاح العام Publishable فقط.
            </p>
            <form
              className="cloud-form"
              onSubmit={(event) => {
                event.preventDefault();
                try {
                  saveCloudConfig(url, key);
                  reconnectCloud();
                  setMessage("حُفظ الإعداد على هذا الجهاز. سجّل الدخول الآن.");
                  setError("");
                } catch (error) {
                  setError(error instanceof Error ? error.message : "تعذر حفظ الإعداد");
                }
              }}
            >
              <label>
                عنوان مشروع Supabase
                <input
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://project.supabase.co"
                  required
                  dir="ltr"
                />
              </label>
              <label>
                Publishable key
                <input
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  placeholder="sb_publishable_…"
                  required
                  dir="ltr"
                  autoComplete="off"
                />
              </label>
              <button type="submit">حفظ إعداد المشروع</button>
            </form>
          </details>
          {config && (
            <form
              className="cloud-form"
              onSubmit={async (event) => {
                event.preventDefault();
                setBusy(true);
                setError("");
                try {
                  await signInCloud(email, password);
                  setPassword("");
                  reconnectCloud();
                  setMessage("تم تسجيل الدخول. اختر البداية المناسبة لهذا الجهاز.");
                } catch (error) {
                  setError(error instanceof Error ? error.message : "تعذر تسجيل الدخول");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                البريد الإلكتروني
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="username"
                  dir="ltr"
                />
              </label>
              <label>
                كلمة المرور
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                />
              </label>
              <button disabled={busy} type="submit">
                {busy ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
              </button>
            </form>
          )}
        </>
      ) : (
        <>
          <div className="cloud-account">
            <span>{session.user.email}</span>
            <button
              type="button"
              onClick={() => {
                clearCloudSession();
                reconnectCloud();
                setMessage("تم تسجيل الخروج. بيانات الجهاز باقية محليًا.");
              }}
            >
              <LogOut size={16} />
              تسجيل الخروج
            </button>
          </div>
          {status.state === "setup" ? (
            <div className="cloud-start">
              <p>
                لجهازك الأول اختر رفع بياناته. على جهاز إضافي اختر تحميل بيانات الحساب. تُحفظ نسخة
                محلية قبل الاستيراد؛ رفع بيانات هذا الجهاز يحل محل النسخ المختلفة من الأقسام نفسها
                في حسابك.
              </p>
              <div className="cloud-actions">
                <button onClick={() => getCloudEngine()?.initialize("upload")}>
                  ابدأ ببيانات هذا الجهاز
                </button>
                <button onClick={() => getCloudEngine()?.initialize("download")}>
                  تحميل بيانات حسابي
                </button>
              </div>
            </div>
          ) : (
            <>
              <p>
                التعديلات غير المرسلة: <strong>{status.pending}</strong>
                {status.lastSynced && (
                  <> · آخر تحقق ناجح: {new Date(status.lastSynced).toLocaleTimeString("ar-SA")}</>
                )}
              </p>
              <button
                type="button"
                disabled={status.state === "syncing"}
                onClick={() => getCloudEngine()?.tick()}
              >
                <RefreshCw size={16} />
                مزامنة الآن
              </button>
            </>
          )}
          {status.conflicts.length > 0 && (
            <div className="cloud-conflict" role="alert">
              <strong>تغيرت البيانات نفسها على جهازين.</strong>
              <p>
                حافظنا على التعديل المحلي. اختر النسخة لهذه الأقسام:{" "}
                {status.conflicts.map((key) => names[key] || "إعدادات المظهر والتعلم").join("، ")}.
                تُحفظ نسخة محلية قبل تطبيق الاختيار.
              </p>
              <div className="cloud-actions">
                <button onClick={() => getCloudEngine()?.resolve("local")}>
                  استخدام تعديلات هذا الجهاز
                </button>
                <button onClick={() => getCloudEngine()?.resolve("remote")}>
                  استخدام نسخة الحساب
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <p className="cloud-scope">
        تشمل المزامنة البيانات النصية المحفوظة: المواد والملاحظات والجدول والمفردات والأهداف والمهام
        وخطة اليوم والتقويم والثيم وكود المختبر وتقدم الدروس. ملفات PDF والتسجيلات الصوتية ومحادثات
        الذكاء الاصطناعي تحتاج خادم الملفات والخدمات. مفاتيح الخدمات وإعدادات الاتصال لا تُنقل بين
        الأجهزة.
      </p>
    </section>
  );
}
