import { CloudSyncStatus } from '@/components/CloudSyncPanel';
import { Suspense, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Search,
  X,
  Menu,
  ArrowUpLeft,
  Palette,
  GraduationCap,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import { navigation, allPages, searchPages } from "@/data/navigation";
import ThemeDialog from "@/components/ThemeDialog";
import PomodoroTimer from "@/components/PomodoroTimer";
import ErrorBoundary from "./ErrorBoundary";

const primaryPaths = ["dashboard", "planner", "subjects", "notes", "study-assistant", "analytics"];
const primaryPages = primaryPaths.map((path) => allPages.find((page) => page.path === path)!);

export default function PageLayout() {
  const { experience } = useTheme();
  const location = useLocation();
  const [menu, setMenu] = useState(false);
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchButton = useRef<HTMLButtonElement>(null);
  const themeButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  const results = searchPages(query);
  const label =
    allPages.find((page) => location.pathname.split("/")[1] === page.path)?.label || "مسار";
  const drawerOnly = experience.layout === "topbar" || experience.layout === "dock";

  useEffect(() => {
    setMenu(false);
    setOpen(false);
    setQuery("");
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    document.title = `${label} | مسار`;
  }, [label]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setThemeOpen(false);
        setMenu(false);
        setOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setOpen(false);
        setMenu(false);
        setThemeOpen(false);
      }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector<HTMLButtonElement>(".drawer-close")?.focus();
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [menu]);

  const closeSearch = () => {
    setOpen(false);
    searchButton.current?.focus();
  };
  const closeMenu = () => {
    setMenu(false);
    menuButton.current?.focus();
  };
  const brand = (
    <>
      <span className="brand-symbol">
        <GraduationCap size={26} />
      </span>
      <span className="brand-word">
        مسار<small>مساحتك للتعلم والإنجاز</small>
      </span>
    </>
  );

  return (
    <div className={`workspace-shell layout-${experience.layout}`} data-experience={experience.id}>
      <a href="#main-content" className="skip-link">
        انتقل إلى المحتوى
      </a>
      {menu && (
        <button className="sidebar-backdrop" aria-label="إغلاق القائمة" onClick={closeMenu} />
      )}
      <aside
        ref={sidebar}
        id="workspace-navigation"
        className={`workspace-sidebar ${drawerOnly ? "drawer-only" : ""} ${menu ? "is-open" : ""}`}
        aria-label="القائمة الرئيسية"
        inert={themeOpen || open}
        onKeyDown={(event) => {
          if (!menu || event.key !== "Tab") return;
          const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a, button"));
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
        <div className="sidebar-brand-row">
          <Link to="/dashboard" className="workspace-brand" aria-label="مسار، الصفحة الرئيسية">
            {brand}
          </Link>
          <button
            className="icon-button drawer-close"
            aria-label="إغلاق قائمة الأقسام"
            onClick={closeMenu}
          >
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-caption">{experience.tagline}</div>
        <nav>
          {navigation.map((group) => (
            <section key={group.group}>
              <h2>{group.group}</h2>
              {group.items.map((page) => (
                <NavLink
                  key={page.path}
                  to={`/${page.path}`}
                  aria-label={page.label}
                  title={page.label}
                  className={({ isActive }) => `workspace-nav ${isActive ? "active" : ""}`}
                >
                  <page.icon size={19} />
                  <span>{page.label}</span>
                  {page.path === "planner" && <small>جديد</small>}
                </NavLink>
              ))}
            </section>
          ))}
        </nav>
        <Link to="/appearance" className="sidebar-theme">
          <Palette size={19} />
          <div>
            <strong>اختر شكل مساحتك</strong>
            <small>
              {experience.nameAr} · {experience.name}
            </small>
          </div>
          <ChevronLeft size={15} />
        </Link>
        <div className="sidebar-footer">
          <span className="avatar">م</span>
          <div>
            مساحة التعلم الشخصية<small>اصنع تقدمك، كل يوم</small>
          </div>
        </div>
      </aside>

      <div className="workspace-main" inert={themeOpen || open || menu}>
        <header className="workspace-header">
          <div className="header-context">
            <button
              ref={menuButton}
              className="icon-button mobile-menu"
              onClick={() => setMenu(true)}
              aria-label="فتح القائمة"
              aria-expanded={menu}
              aria-controls="workspace-navigation"
            >
              <Menu size={21} />
            </button>
            {drawerOnly && (
              <Link
                to="/dashboard"
                className="workspace-brand header-brand"
                aria-label="مسار، الصفحة الرئيسية"
              >
                {brand}
              </Link>
            )}
            <span className="header-breadcrumb">
              مساحتك <span className="breadcrumb-divider">/</span> <strong>{label}</strong>
            </span>
          </div>
          <div className="header-actions">
            <button
              ref={searchButton}
              aria-label="البحث في الأقسام"
              className="search-trigger"
              onClick={() => setOpen(true)}
            >
              <Search size={17} />
              <span>ابحث عن أداة أو قسم</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              ref={themeButton}
              className="theme-trigger"
              aria-label="اختيار ثيم الموقع"
              aria-haspopup="dialog"
              onClick={() => setThemeOpen(true)}
            >
              <Palette size={18} />
              <span>{experience.nameAr}</span>
            </button>
            <CloudSyncStatus />
            <span className="avatar">م</span>
          </div>
        </header>
        {experience.layout === "topbar" && (
          <nav className="workspace-topnav" aria-label="التنقل السريع">
            {primaryPages.map((page) => (
              <NavLink key={page.path} to={`/${page.path}`}>
                <page.icon size={17} />
                <span>{page.label}</span>
              </NavLink>
            ))}
            <button onClick={() => setMenu(true)}>
              <Menu size={17} />
              جميع الأقسام
            </button>
          </nav>
        )}
        <main
          id="main-content"
          tabIndex={-1}
          className={`workspace-content route-${location.pathname.split("/")[1] || "dashboard"}`}
        >
          <ErrorBoundary key={location.pathname}>
            <Suspense
              fallback={
                <div className="empty-state" role="status">
                  جاري تحميل القسم…
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
        <footer className="workspace-footer">
          <span>
            <Sparkles size={13} />
            مسار · تعلم بوضوح، تقدم بثقة
          </span>
          <Link to="/backup">
            إدارة بياناتك <ArrowUpLeft size={13} />
          </Link>
        </footer>
      </div>

      <nav className="workspace-dock" aria-label="شريط التنقل" inert={themeOpen || open || menu}>
        {primaryPages.map((page) => (
          <NavLink key={page.path} to={`/${page.path}`} title={page.label}>
            <page.icon size={21} />
            <span>{page.label}</span>
          </NavLink>
        ))}
        <button onClick={() => setMenu(true)} aria-label="جميع الأقسام">
          <Menu size={21} />
          <span>الأقسام</span>
        </button>
      </nav>
      {themeOpen && <ThemeDialog returnFocusRef={themeButton} onClose={() => setThemeOpen(false)} />}
      {open && (
        <div className="search-overlay" onClick={closeSearch}>
          <div
            className="command-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="البحث في مسار"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;
              const elements = Array.from(
                event.currentTarget.querySelectorAll<HTMLElement>("button, input, a"),
              );
              const first = elements[0],
                last = elements[elements.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }}
          >
            <div className="command-input">
              <Search size={21} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="اكتب اسم القسم أو ما تريد فعله…"
                aria-label="البحث عن الأقسام"
              />
              <button className="icon-button" onClick={closeSearch} aria-label="إغلاق البحث">
                <X size={19} />
              </button>
            </div>
            <div className="command-results">
              {results.length ? (
                results.map((page) => (
                  <Link to={`/${page.path}`} key={page.path} onClick={closeSearch}>
                    <page.icon size={21} />
                    <div>
                      <strong>{page.label}</strong>
                      <small>{page.description}</small>
                    </div>
                    <ArrowUpLeft size={16} />
                  </Link>
                ))
              ) : (
                <p className="empty-message">لا توجد نتائج. جرّب كلمة أخرى.</p>
              )}
            </div>
            <div className="command-hint">تنقل باستخدام Tab · أغلق باستخدام Esc</div>
          </div>
        </div>
      )}
      <PomodoroTimer />
    </div>
  );
}
