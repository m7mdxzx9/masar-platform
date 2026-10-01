import { useEffect, useRef, type RefObject } from "react";
import { Link } from "react-router-dom";
import { ArrowUpLeft, Palette, X } from "lucide-react";
import ThemeGallery from "./ThemeGallery";

export default function ThemeDialog({
  onClose,
  returnFocusRef,
}: {
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = returnFocusRef?.current ?? (document.activeElement as HTMLElement | null);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [returnFocusRef]);

  return (
    <div className="theme-overlay" onClick={onClose}>
      <div
        ref={dialog}
        className="theme-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
          }
          if (event.key !== "Tab") return;
          const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button, a"));
          const first = items[0],
            last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
          if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="theme-dialog-heading">
          <span className="theme-dialog-icon">
            <Palette size={24} />
          </span>
          <div>
            <span className="eyebrow">أربع هويات. مساحة واحدة.</span>
            <h2 id="theme-dialog-title">أي مسار يشبهك؟</h2>
            <p>اختر تصميمًا جديدًا لمساحتك. يُطبق فورًا ويُحفظ تلقائيًا.</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="إغلاق الثيمات"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <ThemeGallery onSelect={onClose} />
        <div className="theme-dialog-footer">
          <span>تتغير الواجهة، وتبقى أعمالك في مكانها.</span>
          <Link to="/appearance" onClick={onClose}>
            استكشف الثيمات <ArrowUpLeft size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
