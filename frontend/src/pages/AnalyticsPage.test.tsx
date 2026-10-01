import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AnalyticsPage from "./AnalyticsPage";
const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/services/api", () => ({ apiClient: api }));
beforeEach(() => {
  api.get.mockReset();
});
describe("analytics states", () => {
  it("keeps available statistics when one service fails, then retries", async () => {
    api.get.mockImplementation((path: string) => {
      if (path.endsWith("/overview"))
        return Promise.resolve({
          data: { subjects: 17, notes: 8, courses: 2, goals: 3, snippets: 1, completed_goals: 1 },
        });
      return Promise.reject(new Error("offline"));
    });
    render(
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("بعض الإحصاءات"));
    expect(screen.getByText("17")).toBeTruthy();
    expect(screen.getByText("سجل التركيز غير متاح حاليًا")).toBeTruthy();
    api.get.mockResolvedValue({
      data: {
        events: [],
        daily_minutes: {},
        accuracy_percent: 85,
        total_attempts: 4,
        total_skills_tracked: 2,
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "تحديث" }));
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
    expect(screen.getByText("85%")).toBeTruthy();
  });
});
