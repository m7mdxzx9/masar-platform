import { SyncEngine } from "./SyncEngine";
import { browserWorkspace, DB_KEYS } from "./browserWorkspace";
import { indexedDbStorage } from "../indexedDBStorage";
import { getCloudConfig, getCloudSession, SupabaseTransport } from "./SupabaseTransport";
let engine: SyncEngine | null = null;
let started = false;
let unsubscribe: (() => void) | null = null;
const listeners = new Set<() => void>();
export const subscribeCloud = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const disconnected = {
  state: "disconnected" as const,
  pending: 0,
  conflicts: [] as string[],
  lastSynced: null,
  error: null,
};
export const getCloudStatus = () => engine?.getStatus() || disconnected;
export const getCloudEngine = () => engine;
function notify() {
  listeners.forEach((listener) => listener());
}
export function reconnectCloud() {
  unsubscribe?.();
  engine = null;
  const config = getCloudConfig(),
    session = getCloudSession();
  if (config && session) {
    const { local, journal } = browserWorkspace(
      `${new URL(config.url).hostname}:${session.user.id}`,
    );
    engine = new SyncEngine(local, new SupabaseTransport(config, session.user.id), journal);
    unsubscribe = engine.subscribe(notify);
    engine.tick();
  }
  notify();
}
export function startCloudSync() {
  if (started) return;
  started = true;
  window.addEventListener("masar-cloud-applied", async (event) => {
    const keys = (event as CustomEvent<string[]>).detail;
    const refresh = async (
      name: string,
      store: { persist: { rehydrate: () => void | Promise<void> }; setState: (state: any) => void },
      empty: Record<string, unknown>,
    ) => {
      if (!keys.includes(name)) return;
      const raw = DB_KEYS.includes(name)
        ? await indexedDbStorage.getItem(name)
        : localStorage.getItem(name);
      if (raw === null) store.setState(empty);
      await store.persist.rehydrate();
    };
    await Promise.all([
      import("@/stores/subjectsStore").then((module) =>
        refresh("masar-subjects-storage", module.useSubjectsStore, {
          subjects: [],
          subjectOrder: [],
          currentSubject: null,
        }),
      ),
      import("@/stores/notesStore").then((module) =>
        refresh("masar-notes-storage", module.useNotesStore, { notes: [] }),
      ),
      import("@/stores/scheduleStore").then((module) =>
        refresh("masar-schedule-storage", module.useScheduleStore, {
          courses: [],
          gridCourses: [],
        }),
      ),
      import("@/stores/vocabularyStore").then((module) =>
        refresh("masar-vocabulary-storage", module.useVocabularyStore, { words: [] }),
      ),
      import("@/stores/progressStore").then((module) =>
        refresh("masar-progress-storage", module.useProgressStore, { skills: {}, stats: null }),
      ),
      import("@/stores/goalsStore").then((module) =>
        refresh("masar-goals", module.useGoalsStore, { goals: [] }),
      ),
      import("@/stores/kanbanStore").then((module) =>
        refresh("masar-kanban", module.useKanbanStore, { tasks: [] }),
      ),
      import("@/stores/calendarStore").then((module) =>
        refresh("masar-calendar-storage", module.useCalendarStore, {
          icalUrl: "",
          events: [],
          lastFetched: null,
        }),
      ),
    ]);
  });
  reconnectCloud();
  setInterval(() => {
    if (document.visibilityState === "visible") engine?.tick();
  }, 3000);
  window.addEventListener("online", () => engine?.tick());
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") engine?.tick();
  });
}
