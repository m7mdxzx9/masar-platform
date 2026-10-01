import { RevisionConflict, type Snapshot, type SyncTransport, type Workspace } from "./SyncEngine";
export interface CloudConfig {
  url: string;
  key: string;
}
export interface CloudSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: { id: string; email?: string };
}
const CONFIG_KEY = "masar-cloud-config";
const SESSION_KEY = "masar-cloud-session";
export function getCloudConfig(): CloudConfig | null {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) || "null");
  } catch {
    return null;
  }
}
export function getCloudSession(): CloudSession | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}
export function saveCloudConfig(url: string, key: string) {
  const parsed = new URL(url.trim());
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/")
    throw new Error("أدخل عنوان مشروع Supabase الأساسي باستخدام HTTPS.");
  key = key.trim();
  let legacyAnon = false;
  try {
    legacyAnon = JSON.parse(atob(key.split(".")[1])).role === "anon";
  } catch {
    /* publishable key */
  }
  if (!key.startsWith("sb_publishable_") && !legacyAnon)
    throw new Error("استخدم Publishable key أو anon فقط. المفتاح السري لا يوضع في الموقع.");
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ url: parsed.origin, key }));
  localStorage.removeItem(SESSION_KEY);
}
export function clearCloudSession() {
  localStorage.removeItem(SESSION_KEY);
}
function storeSession(data: any): CloudSession {
  if (!data.access_token || !data.refresh_token || !data.user?.id)
    throw new Error("تعذر تأكيد جلسة الحساب.");
  const session: CloudSession = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    user: { id: data.user.id, email: data.user.email },
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}
async function request(config: CloudConfig, path: string, init: RequestInit = {}, token?: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${config.url}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        apikey: config.key,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
    const body = await response.json();
    if (!response.ok) {
      if (body.code === "40001") throw new RevisionConflict("تغيرت البيانات على جهاز آخر.");
      if (response.status === 401 || response.status === 403)
        throw new Error(
          "تعذر تسجيل الدخول أو انتهت الجلسة. تحقق من الحساب وصلاحيات قاعدة البيانات.",
        );
      if (body.code === "PGRST202" || body.code === "PGRST205" || body.code === "42P01")
        throw new Error("قاعدة المزامنة غير مجهزة. نفّذ ملف personal-sync.sql في Supabase.");
      throw new Error("تعذر إكمال الطلب. تحقق من بيانات المشروع واتصالك.");
    }
    return body;
  } catch (error) {
    if (
      error instanceof TypeError ||
      (error instanceof DOMException && error.name === "AbortError")
    )
      throw new Error("تعذر الاتصال بالسحابة. بقيت التعديلات محفوظة على هذا الجهاز.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
export async function signInCloud(email: string, password: string) {
  const config = getCloudConfig();
  if (!config) throw new Error("احفظ إعدادات المشروع أولًا.");
  return storeSession(
    await request(config, "/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    }),
  );
}
export class SupabaseTransport implements SyncTransport {
  private refreshing: Promise<CloudSession> | null = null;
  constructor(
    private config: CloudConfig,
    private userId: string,
  ) {}
  private async session() {
    const session = getCloudSession();
    if (!session || session.user.id !== this.userId)
      throw new Error("سجّل الدخول لمزامنة هذا الحساب.");
    if (session.expires_at > Date.now() + 60000) return session;
    if (!this.refreshing)
      this.refreshing = request(this.config, "/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      })
        .then(storeSession)
        .finally(() => {
          this.refreshing = null;
        });
    return this.refreshing;
  }
  async read(): Promise<Workspace> {
    const session = await this.session();
    const rows = await request(
      this.config,
      `/rest/v1/masar_workspaces?select=revision,data&user_id=eq.${encodeURIComponent(this.userId)}`,
      {},
      session.access_token,
    );
    return rows[0] ? { revision: rows[0].revision, data: rows[0].data } : { revision: 0, data: {} };
  }
  async commit(revision: number, data: Snapshot): Promise<Workspace> {
    const session = await this.session();
    const rows = await request(
      this.config,
      "/rest/v1/rpc/masar_sync_commit",
      {
        method: "POST",
        body: JSON.stringify({ expected_revision: revision, workspace_data: data }),
      },
      session.access_token,
    );
    if (!rows[0] || rows[0].revision <= revision) throw new Error("لم يؤكد الخادم حفظ التعديلات.");
    return { revision: rows[0].revision, data: rows[0].data };
  }
}
