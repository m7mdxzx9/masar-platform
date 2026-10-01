import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/theme/ThemeContext";
import PageLayout from "./PageLayout";
vi.mock("@/components/PomodoroTimer", () => ({ default: () => null }));
function Workspace() {
  return (
    <ThemeProvider>
      <MemoryRouter initialEntries={["/planner"]}>
        <Routes>
          <Route element={<PageLayout />}>
            <Route path="planner" element={<input aria-label="مسودة العمل" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
}
beforeEach(() => {
  localStorage.clear();
});
describe("layout-aware themes", () => {
  it("switches navigation layout without discarding work on the current page", () => {
    localStorage.setItem("masar-user-data", "retained");
    render(<Workspace />);
    fireEvent.change(screen.getByLabelText("مسودة العمل"), { target: { value: "فكرتي القادمة" } });
    fireEvent.click(screen.getByRole("button", { name: "اختيار ثيم الموقع" }));
    fireEvent.click(screen.getByRole("button", { name: "تطبيق ثيم ستوديو" }));
    expect(screen.getByRole("navigation", { name: "التنقل السريع" })).toBeTruthy();
    expect((screen.getByLabelText("مسودة العمل") as HTMLInputElement).value).toBe("فكرتي القادمة");
    expect(localStorage.getItem("masar-user-data")).toBe("retained");
    fireEvent.click(screen.getByRole("button", { name: "اختيار ثيم الموقع" }));
    fireEvent.click(screen.getByRole("button", { name: "تطبيق ثيم أوربت" }));
    expect(document.querySelector(".layout-dock")).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "التنقل السريع" })).toBeNull();
    expect(screen.getByRole("navigation", { name: "شريط التنقل" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "اختيار ثيم الموقع" }));
    fireEvent.click(screen.getByRole("button", { name: "تطبيق ثيم بولد" }));
    expect(document.querySelector(".layout-rail")).toBeTruthy();
    expect(document.querySelector('a[aria-label="التقويم"]')).toBeTruthy();
  });
  it("closes the theme dialog with Escape and restores focus and scrolling", () => {
    render(<Workspace />);
    const trigger = screen.getByRole("button", { name: "اختيار ثيم الموقع" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.keyDown(screen.getByRole("dialog", { name: "أي مسار يشبهك؟" }), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.body.style.overflow).not.toBe("hidden");
    expect(document.activeElement).toBe(trigger);
  });
});
