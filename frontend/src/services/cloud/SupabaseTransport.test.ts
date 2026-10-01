import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SupabaseTransport } from "./SupabaseTransport";
import { RevisionConflict } from "./SyncEngine";

const config = { url: "https://test-project.supabase.co", key: "sb_publishable_test" };
const userId = "personal-user";
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  localStorage.clear();
  localStorage.setItem(
    "masar-cloud-session",
    JSON.stringify({
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      expires_at: Date.now() + 3600000,
      user: { id: userId },
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("personal sync bandwidth and freshness", () => {
  it("downloads unchanged notes only once across repeated checks", async () => {
    const data = { notes: "study notes ".repeat(5000) };
    fetchMock.mockImplementation(async (url: string) =>
      response([{ revision: 3, ...(url.includes("select=revision,data") ? { data } : {}) }]),
    );
    const transport = new SupabaseTransport(config, userId);
    for (let i = 0; i < 10; i++) expect((await transport.read()).data).toEqual(data);
    const urls = fetchMock.mock.calls.map(([url]) => url as string);
    expect(urls.filter((url) => url.includes("select=revision,data"))).toHaveLength(1);
    expect(urls.filter((url) => url.endsWith("select=revision"))).toHaveLength(9);
    expect(fetchMock.mock.calls.every(([, init]) => init.cache === "no-store")).toBe(true);
  });

  it("loads another device's changes and uses the actual revision if it changes during the read", async () => {
    fetchMock
      .mockResolvedValueOnce(response([{ revision: 3, data: { notes: "old" } }]))
      .mockResolvedValueOnce(response([{ revision: 4 }]))
      .mockResolvedValueOnce(response([{ revision: 5, data: { notes: "latest" } }]));
    const transport = new SupabaseTransport(config, userId);
    await transport.read();
    expect(await transport.read()).toEqual({ revision: 5, data: { notes: "latest" } });
  });

  it("keeps its cached server copy isolated from edits to returned snapshots", async () => {
    fetchMock
      .mockResolvedValueOnce(response([{ revision: 1, data: { notes: "server" } }]))
      .mockResolvedValueOnce(response([{ revision: 1 }]));
    const transport = new SupabaseTransport(config, userId);
    const first = await transport.read();
    first.data.notes = "local change";
    expect((await transport.read()).data.notes).toBe("server");
  });

  it("reuses an acknowledged commit while still checking for other devices' changes", async () => {
    fetchMock
      .mockResolvedValueOnce(response([{ revision: 2, data: { notes: "saved" } }]))
      .mockResolvedValueOnce(response([{ revision: 2 }]));
    const transport = new SupabaseTransport(config, userId);
    const saved = await transport.commit(1, { notes: "saved" });
    saved.data.notes = "new edit";
    expect(await transport.read()).toEqual({ revision: 2, data: { notes: "saved" } });
    expect(fetchMock.mock.calls[1][0]).toContain("select=revision");
    expect(fetchMock.mock.calls[1][0]).not.toContain("select=revision,data");
  });

  it("does not disguise a failed server check as successful cached synchronization", async () => {
    fetchMock
      .mockResolvedValueOnce(response([{ revision: 1, data: { notes: "saved" } }]))
      .mockResolvedValueOnce(response({ message: "unauthorized" }, 401));
    const transport = new SupabaseTransport(config, userId);
    await transport.read();
    await expect(transport.read()).rejects.toThrow("تعذر تسجيل الدخول");
  });

  it("rejects stale commits and then loads the newer server version", async () => {
    fetchMock
      .mockResolvedValueOnce(response([{ revision: 1, data: { notes: "old" } }]))
      .mockResolvedValueOnce(response({ code: "40001" }, 409))
      .mockResolvedValueOnce(response([{ revision: 2 }]))
      .mockResolvedValueOnce(response([{ revision: 2, data: { notes: "other device" } }]));
    const transport = new SupabaseTransport(config, userId);
    await transport.read();
    await expect(transport.commit(1, { notes: "local edit" })).rejects.toBeInstanceOf(RevisionConflict);
    expect(await transport.read()).toEqual({ revision: 2, data: { notes: "other device" } });
  });
});
