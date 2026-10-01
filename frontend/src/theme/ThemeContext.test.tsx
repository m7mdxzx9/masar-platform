import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { experiences } from "./experiences";
import ThemeGallery from "@/components/ThemeGallery";

function Probe() {
  const { experience, theme } = useTheme();
  return (
    <>
      <output data-testid="experience">
        {experience.id}:{experience.layout}:{theme.colors.bg}
      </output>
      <ThemeGallery />
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
});
describe("complete design experiences", () => {
  it.each(experiences)("applies and persists $name with its own layout", (experience) => {
    const view = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: `تطبيق ثيم ${experience.nameAr}` }));
    expect(document.documentElement.dataset.experience).toBe(experience.id);
    expect(document.documentElement.dataset.layout).toBe(experience.layout);
    expect(document.documentElement.style.colorScheme).toBe(experience.mode);
    expect(document.documentElement.style.getPropertyValue("--theme-accent")).toBe(
      experience.colors.accent,
    );
    expect(screen.getByTestId("experience").textContent).toBe(
      `${experience.id}:${experience.layout}:${experience.colors.bg}`,
    );
    expect(localStorage.getItem("masar-active-theme-id")).toBe(`experience-${experience.id}`);
    view.unmount();
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(
      screen
        .getByRole("button", { name: `تطبيق ثيم ${experience.nameAr}` })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
  it("migrates a saved light palette and removes obsolete neon overrides", () => {
    localStorage.setItem("masar-active-theme-id", "en-bold-dynamic");
    localStorage.setItem("masar-identity-mode", "nextgen");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.experience).toBe("paper");
    expect(document.documentElement.dataset.identity).toBe("classic");
  });
  it("recovers from an unavailable saved theme", () => {
    localStorage.setItem("masar-active-theme-id", "unknown");
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.experience).toBe("nova");
  });
});
