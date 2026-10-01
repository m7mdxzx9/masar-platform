import type { CSSProperties } from "react";
import { Check, ArrowUpLeft, Palette } from "lucide-react";
import { experiences } from "@/theme/experiences";
import { useTheme } from "@/theme/ThemeContext";

export default function ThemeGallery({ onSelect }: { onSelect?: () => void }) {
  const { experience, setExperience } = useTheme();

  return (
    <div className="theme-gallery" aria-label="الثيمات المتاحة">
      {experiences.map((option) => (
        <button
          type="button"
          key={option.id}
          className={`theme-option ${experience.id === option.id ? "selected" : ""}`}
          aria-pressed={experience.id === option.id}
          aria-label={`تطبيق ثيم ${option.nameAr}`}
          onClick={() => {
            setExperience(option.id);
            onSelect?.();
          }}
        >
          <div
            className={`theme-preview preview-${option.id}`}
            aria-hidden="true"
            style={
              {
                "--preview-bg": option.colors.bg,
                "--preview-panel": option.colors.surface,
                "--preview-accent": option.colors.accent,
                "--preview-line": option.colors.border,
              } as CSSProperties
            }
          >
            <div className="preview-nav">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="preview-body">
              <div className="preview-heading">
                <i />
                <i />
              </div>
              <div className="preview-hero">
                <span />
                <span />
                <b />
              </div>
              <div className="preview-stats">
                <i />
                <i />
                <i />
              </div>
              <div className="preview-cards">
                <i />
                <i />
              </div>
            </div>
            <span className="preview-name">{option.name.toUpperCase()}</span>
          </div>
          <div className="theme-option-details">
            <div className="theme-option-title">
              <h3>
                {option.nameAr}
                <small>{option.name}</small>
              </h3>
              {experience.id === option.id ? (
                <span className="theme-selected">
                  <Check size={14} />
                  الحالي
                </span>
              ) : (
                <ArrowUpLeft size={18} />
              )}
            </div>
            <p>{option.description}</p>
            <div className="theme-option-meta">
              <span>{option.layoutLabel}</span>
              <span>{option.mode === "dark" ? "داكن" : "فاتح"}</span>
              <span className="theme-swatches" aria-hidden="true">
                {[option.colors.accent, option.colors.secondary, option.colors.bg].map((color) => (
                  <i key={color} style={{ background: color }} />
                ))}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function ThemeSummary() {
  const { experience } = useTheme();
  return (
    <div className="theme-summary">
      <span className="theme-summary-icon">
        <Palette size={22} />
      </span>
      <div>
        <small>مساحتك، بطريقتك</small>
        <strong>{experience.tagline}</strong>
      </div>
      <span className="theme-summary-name">{experience.name}</span>
    </div>
  );
}
