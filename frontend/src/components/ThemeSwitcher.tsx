import { useRef, useState } from "react";
import { Palette } from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import ThemeDialog from "./ThemeDialog";

export default function ThemeSwitcher() {
  const { experience } = useTheme();
  const [open, setOpen] = useState(false);
  const themeButton = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={themeButton}
        type="button"
        className="theme-trigger"
        aria-label="اختيار ثيم الموقع"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Palette size={18} />
        <span>{experience.nameAr}</span>
      </button>
      {open && <ThemeDialog returnFocusRef={themeButton} onClose={() => setOpen(false)} />}
    </>
  );
}
