import { beforeEach, describe, expect, it, vi } from "vitest";
const database = new Map<string, string>();
vi.mock("../indexedDBStorage", () => ({
  indexedDbStorage: {
    getItem: async (key: string) => database.get(key) || null,
    setItem: async (key: string, value: string) => {
      database.set(key, value);
    },
    removeItem: async (key: string) => {
      database.delete(key);
    },
  },
}));
import { applyWorkspace, collectWorkspace } from "./browserWorkspace";
beforeEach(() => {
  localStorage.clear();
  database.clear();
});
describe("cloud workspace boundary", () => {
  it("includes IndexedDB notes and local planning while excluding credentials and device configuration", async () => {
    localStorage.setItem("masar-daily-planner-v1", "[]");
    localStorage.setItem("masar-cloud-session", "private token");
    localStorage.setItem("masar-backend-url", "private server");
    localStorage.setItem("gemini_api_key", "private key");
    database.set(
      "masar-notes-storage",
      JSON.stringify({
        state: { notes: [{ id: 1, title: "Study" }], isLoading: true, error: "unavailable" },
        version: 0,
      }),
    );
    const data = await collectWorkspace();
    expect(data["masar-daily-planner-v1"]).toBe("[]");
    expect(JSON.parse(data["masar-notes-storage"]!).state).toEqual({
      notes: [{ id: 1, title: "Study" }],
    });
    expect(Object.keys(data)).not.toContain("masar-cloud-session");
    expect(Object.keys(data)).not.toContain("masar-backend-url");
    expect(Object.keys(data)).not.toContain("gemini_api_key");
  });
  it("cannot overwrite credentials even if a remote payload contains them", async () => {
    localStorage.setItem("masar-cloud-session", "original");
    await applyWorkspace({
      "masar-cloud-session": "malicious",
      "masar-active-theme-id": "experience-paper",
      "masar-notes-storage": null,
    });
    expect(localStorage.getItem("masar-cloud-session")).toBe("original");
    expect(localStorage.getItem("masar-active-theme-id")).toBe("experience-paper");
  });
});
