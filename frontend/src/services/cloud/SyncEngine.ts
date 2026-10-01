export type Snapshot = Record<string, string | null>;
export interface Workspace {
  revision: number;
  data: Snapshot;
}
export interface SyncTransport {
  read(): Promise<Workspace>;
  commit(revision: number, data: Snapshot): Promise<Workspace>;
}
export interface Journal {
  base: Workspace;
  seen: Snapshot;
  pending: Snapshot;
}
export interface LocalWorkspace {
  read(): Promise<Snapshot>;
  apply(data: Snapshot): Promise<void>;
  save(journal: Journal): void;
  backup(data: Snapshot): void;
}
export class RevisionConflict extends Error {}
export interface SyncStatus {
  state: "setup" | "ready" | "syncing" | "synced" | "offline" | "conflict";
  pending: number;
  conflicts: string[];
  lastSynced: string | null;
  error: string | null;
}
const value = (data: Snapshot, key: string) => data[key] ?? null;
export class SyncEngine {
  private journal: Journal | null;
  private busy = false;
  private listeners = new Set<() => void>();
  private status: SyncStatus;
  constructor(
    private local: LocalWorkspace,
    private transport: SyncTransport,
    journal: Journal | null = null,
  ) {
    this.journal = journal;
    this.status = {
      state: journal ? "ready" : "setup",
      pending: Object.keys(journal?.pending || {}).length,
      conflicts: [],
      lastSynced: null,
      error: null,
    };
  }
  getStatus = () => this.status;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(next: Partial<SyncStatus>) {
    this.status = {
      ...this.status,
      ...next,
      pending: Object.keys(this.journal?.pending || {}).length,
    };
    this.listeners.forEach((listener) => listener());
  }
  private save() {
    if (this.journal) this.local.save(this.journal);
  }
  private async capture() {
    if (!this.journal) return;
    const current = await this.local.read();
    for (const key of new Set([...Object.keys(current), ...Object.keys(this.journal.seen)])) {
      if (value(current, key) !== value(this.journal.seen, key)) {
        if (value(current, key) === value(this.journal.base.data, key))
          delete this.journal.pending[key];
        else this.journal.pending[key] = value(current, key);
      }
    }
    this.journal.seen = current;
    this.save();
  }
  async initialize(mode: "upload" | "download") {
    if (this.busy || this.journal) return;
    this.busy = true;
    this.update({ state: "syncing", error: null });
    try {
      const current = await this.local.read();
      const remote = await this.transport.read();
      this.local.backup(current);
      if (mode === "download") {
        const replacement: Snapshot = {};
        for (const key of new Set([...Object.keys(current), ...Object.keys(remote.data)]))
          replacement[key] = value(remote.data, key);
        await this.local.apply(replacement);
        this.journal = { base: remote, seen: await this.local.read(), pending: {} };
      } else {
        const pending: Snapshot = {};
        const incoming: Snapshot = {};
        for (const key of new Set([...Object.keys(current), ...Object.keys(remote.data)])) {
          if (value(current, key) === null) incoming[key] = value(remote.data, key);
          else if (value(current, key) !== value(remote.data, key)) pending[key] = current[key];
        }
        await this.local.apply(incoming);
        this.journal = { base: remote, seen: await this.local.read(), pending };
      }
      this.save();
      this.update({ state: "ready" });
    } catch (error) {
      this.update({ state: "setup", error: error instanceof Error ? error.message : "تعذر الربط" });
    } finally {
      this.busy = false;
    }
    if (this.journal) await this.tick();
  }
  async tick() {
    if (this.busy || !this.journal) return;
    this.busy = true;
    try {
      await this.capture(); // Persist unsent changes before any network request.
      this.update({ state: "syncing", error: null });
      const remote = await this.transport.read();
      await this.capture(); // Include edits made while the request was in flight.
      const incoming: Snapshot = {};
      const conflicts: string[] = [];
      for (const key of new Set([
        ...Object.keys(remote.data),
        ...Object.keys(this.journal.base.data),
        ...Object.keys(this.journal.pending),
      ])) {
        const remoteValue = value(remote.data, key);
        if (Object.prototype.hasOwnProperty.call(this.journal.pending, key)) {
          if (remoteValue === this.journal.pending[key]) delete this.journal.pending[key];
          else if (remoteValue !== value(this.journal.base.data, key)) conflicts.push(key);
        } else if (remoteValue !== value(this.journal.base.data, key)) incoming[key] = remoteValue;
      }
      // Conflicts remain durable and do not overwrite either device's version.
      if (conflicts.length) {
        this.update({ state: "conflict", conflicts });
        return;
      }
      if (Object.keys(incoming).length) {
        await this.local.apply(incoming);
        Object.assign(this.journal.seen, incoming);
      }
      this.journal.base = remote;
      this.save();
      if (Object.keys(this.journal.pending).length) {
        const sent = { ...this.journal.pending };
        const result = await this.transport.commit(remote.revision, { ...remote.data, ...sent });
        this.journal.base = result;
        // Capture newer edits before acknowledging this particular payload.
        await this.capture();
        for (const key of Object.keys(sent))
          if (this.journal.pending[key] === sent[key]) delete this.journal.pending[key];
        this.save();
      }
      this.update({
        state: "synced",
        conflicts: [],
        error: null,
        lastSynced: new Date().toISOString(),
      });
    } catch (error) {
      try {
        this.save();
      } catch {
        /* Report storage failure without masking it. */
      }
      this.update({
        state: error instanceof RevisionConflict ? "ready" : "offline",
        error:
          error instanceof RevisionConflict
            ? null
            : typeof error === "object" &&
                error !== null &&
                "name" in error &&
                error.name === "QuotaExceededError"
              ? "مساحة التخزين غير كافية لحفظ سجل المزامنة. صدّر بياناتك ووفّر مساحة قبل المتابعة."
              : error instanceof Error
                ? error.message
                : "تعذر الاتصال. التعديلات محفوظة على هذا الجهاز.",
      });
    } finally {
      this.busy = false;
    }
  }
  async resolve(choice: "local" | "remote") {
    if (this.busy || !this.journal || !this.status.conflicts.length) return;
    this.busy = true;
    try {
      await this.capture();
      const remote = await this.transport.read();
      this.local.backup(await this.local.read());
      if (choice === "remote") {
        const incoming: Snapshot = {};
        for (const key of this.status.conflicts) {
          incoming[key] = value(remote.data, key);
          delete this.journal.pending[key];
        }
        await this.local.apply(incoming);
        Object.assign(this.journal.seen, incoming);
      }
      // Only acknowledge conflict keys; other remote changes still need to be applied by tick.
      for (const key of this.status.conflicts)
        this.journal.base.data[key] = value(remote.data, key);
      this.save();
      this.update({ state: "ready", conflicts: [] });
    } catch (error) {
      this.update({
        state: "offline",
        error: error instanceof Error ? error.message : "تعذر الاتصال",
      });
    } finally {
      this.busy = false;
    }
    await this.tick();
  }
}
