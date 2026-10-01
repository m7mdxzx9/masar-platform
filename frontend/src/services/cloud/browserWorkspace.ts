import { indexedDbStorage } from "../indexedDBStorage";
import type { Journal, LocalWorkspace, Snapshot } from "./SyncEngine";
export const LOCAL_KEYS = [
  "masar-daily-planner-v1",
  "masar-goals",
  "masar-kanban",
  "masar-calendar-storage",
  "masar-active-theme-id",
  "masar-active-category",
  "masar-active-dir",
  "masar-identity-mode",
  "masar-lang",
  "masar-subject-order",
  "masar_completed_quizzes",
  "masar-lab-code",
];
export const DB_KEYS = [
  "masar-subjects-storage",
  "masar-notes-storage",
  "masar-schedule-storage",
  "masar-vocabulary-storage",
  "masar-progress-storage",
];
const fields: Record<string, string[]> = {
  "masar-goals": ["goals"],
  "masar-kanban": ["tasks"],
  "masar-calendar-storage": ["icalUrl", "lastFetched"],
  "masar-subjects-storage": ["subjects", "subjectOrder"],
  "masar-notes-storage": ["notes"],
  "masar-schedule-storage": ["courses", "gridCourses"],
  "masar-vocabulary-storage": ["words"],
  "masar-progress-storage": ["skills", "stats"],
};
export function normalizedValue(key: string, raw: string | null): string | null {
  if (!raw || !fields[key]) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.state || typeof parsed.state !== "object") return null;
    const state = Object.fromEntries(
      fields[key]
        .filter((field) => field in parsed.state)
        .map((field) => [field, parsed.state[field]]),
    );
    return JSON.stringify({ state, version: parsed.version || 0 });
  } catch {
    return null;
  }
}
export async function collectWorkspace(): Promise<Snapshot> {
  const snapshot: Snapshot = {};
  for (const key of LOCAL_KEYS) snapshot[key] = normalizedValue(key, localStorage.getItem(key));
  for (const key of DB_KEYS)
    snapshot[key] = normalizedValue(key, await indexedDbStorage.getItem(key));
  return snapshot;
}
export async function applyWorkspace(snapshot: Snapshot) {
  const applied: string[] = [];
  for (const [key, raw] of Object.entries(snapshot)) {
    if (LOCAL_KEYS.includes(key)) {
      if (raw === null) localStorage.removeItem(key);
      else localStorage.setItem(key, raw);
      applied.push(key);
    }
    if (DB_KEYS.includes(key)) {
      if (raw === null) await indexedDbStorage.removeItem(key);
      else await indexedDbStorage.setItem(key, raw);
      applied.push(key);
    }
  }
  // Consumers refresh their state without reloading and discarding unrelated drafts.
  window.dispatchEvent(new CustomEvent("masar-cloud-applied", { detail: applied }));
}
export function browserWorkspace(scope: string): {
  local: LocalWorkspace;
  journal: Journal | null;
} {
  const key = `masar-cloud-journal:${scope}`;
  let journal: Journal | null = null;
  try {
    journal = JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    /* new journal */
  }
  return {
    journal,
    local: {
      read: collectWorkspace,
      apply: applyWorkspace,
      save: (next) => localStorage.setItem(key, JSON.stringify(next)),
      backup: (data) =>
        localStorage.setItem(
          "masar-cloud-recovery-backup",
          JSON.stringify({ savedAt: new Date().toISOString(), data }),
        ),
    },
  };
}
