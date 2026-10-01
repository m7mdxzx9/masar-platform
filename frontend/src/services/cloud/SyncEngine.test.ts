import { describe, it, expect } from "vitest";
import {
  SyncEngine,
  RevisionConflict,
  type Journal,
  type Snapshot,
  type Workspace,
  type LocalWorkspace,
  type SyncTransport,
} from "./SyncEngine";
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));
class Device implements LocalWorkspace {
  data: Snapshot;
  journal: Journal | null = null;
  backups: Snapshot[] = [];
  constructor(data: Snapshot = {}) {
    this.data = data;
  }
  async read() {
    return clone(this.data);
  }
  async apply(data: Snapshot) {
    Object.assign(this.data, data);
  }
  save(journal: Journal) {
    this.journal = clone(journal);
  }
  backup(data: Snapshot) {
    this.backups.push(clone(data));
  }
}
class Server implements SyncTransport {
  workspace: Workspace = { revision: 0, data: {} };
  offline = false;
  failAcknowledgement = false;
  beforeCommit: (() => void) | null = null;
  async read() {
    if (this.offline) throw new Error("offline");
    return clone(this.workspace);
  }
  async commit(revision: number, data: Snapshot) {
    this.beforeCommit?.();
    this.beforeCommit = null;
    if (this.offline) throw new Error("offline");
    if (revision !== this.workspace.revision) throw new RevisionConflict();
    this.workspace = { revision: revision + 1, data: clone(data) };
    if (this.failAcknowledgement) {
      this.failAcknowledgement = false;
      throw new Error("response lost");
    }
    return clone(this.workspace);
  }
}
async function pair() {
  const server = new Server(),
    first = new Device({ notes: "initial", theme: "nova" }),
    second = new Device();
  const a = new SyncEngine(first, server),
    b = new SyncEngine(second, server);
  await a.initialize("upload");
  await b.initialize("download");
  return { server, first, second, a, b };
}
describe("personal multi-device sync", () => {
  it("waits for the user to choose initial upload or download", async () => {
    const server = new Server(),
      device = new Device({ notes: "my local notes" });
    const engine = new SyncEngine(device, server);
    await engine.tick();
    expect(engine.getStatus().state).toBe("setup");
    expect(server.workspace.revision).toBe(0);
    expect(device.data.notes).toBe("my local notes");
  });
  it("syncs edits both ways and combines changes in different sections", async () => {
    const { first, second, a, b } = await pair();
    first.data.notes = "edited note";
    second.data.theme = "paper";
    await a.tick();
    await b.tick();
    await a.tick();
    expect(first.data).toEqual(second.data);
    expect(first.data).toEqual({ notes: "edited note", theme: "paper" });
  });
  it("keeps offline changes durably and retries after an application restart", async () => {
    const { server, first, second, a, b } = await pair();
    server.offline = true;
    first.data.notes = "offline edit";
    await a.tick();
    expect(a.getStatus().state).toBe("offline");
    expect(first.journal?.pending.notes).toBe("offline edit");
    server.offline = false;
    const restarted = new SyncEngine(first, server, first.journal);
    await restarted.tick();
    await b.tick();
    expect(second.data.notes).toBe("offline edit");
    expect(restarted.getStatus().pending).toBe(0);
  });
  it("propagates a deletion without resurrecting the last remaining item", async () => {
    const { first, second, a, b } = await pair();
    first.data.notes = null;
    await a.tick();
    await b.tick();
    await a.tick();
    expect(second.data.notes).toBeNull();
    expect(first.data.notes).toBeNull();
  });
  it("preserves conflicting local edits until an explicit local resolution", async () => {
    const { first, second, a, b, server } = await pair();
    first.data.notes = "first edit";
    second.data.notes = "second edit";
    await a.tick();
    await b.tick();
    expect(b.getStatus().state).toBe("conflict");
    expect(second.data.notes).toBe("second edit");
    expect(server.workspace.data.notes).toBe("first edit");
    await b.resolve("local");
    await a.tick();
    expect(first.data.notes).toBe("second edit");
    expect(b.getStatus().conflicts).toEqual([]);
  });
  it("backs up a local conflict before choosing the remote version", async () => {
    const { first, second, a, b } = await pair();
    first.data.notes = "remote";
    second.data.notes = "local";
    await a.tick();
    await b.tick();
    await b.resolve("remote");
    expect(second.data.notes).toBe("remote");
    expect(second.backups[second.backups.length - 1]?.notes).toBe("local");
  });
  it("does not discard an edit made during an in-flight upload", async () => {
    const { server, first, a } = await pair();
    first.data.notes = "sent";
    server.beforeCommit = () => {
      first.data.notes = "newer";
    };
    await a.tick();
    expect(a.getStatus().pending).toBe(1);
    expect(first.journal?.pending.notes).toBe("newer");
    await a.tick();
    expect(server.workspace.data.notes).toBe("newer");
  });
  it("retains pending data if the server rejects a stale revision", async () => {
    const { server, first, a } = await pair();
    first.data.notes = "unsent";
    server.beforeCommit = () => {
      server.workspace.revision++;
      server.workspace.data.theme = "orbit";
    };
    await a.tick();
    expect(first.journal?.pending.notes).toBe("unsent");
    await a.tick();
    expect(server.workspace.data).toEqual({ notes: "unsent", theme: "orbit" });
  });
  it("acknowledges a successful write whose response was lost without duplicating it", async () => {
    const { server, first, a } = await pair();
    first.data.notes = "saved but acknowledgement lost";
    server.failAcknowledgement = true;
    await a.tick();
    const revision = server.workspace.revision;
    expect(a.getStatus().state).toBe("offline");
    await a.tick();
    expect(server.workspace.revision).toBe(revision);
    expect(a.getStatus().pending).toBe(0);
  });
});
