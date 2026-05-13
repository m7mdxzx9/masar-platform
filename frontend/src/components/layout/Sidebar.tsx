import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  FlaskConical,
  Brain,
  Trophy,
  ClipboardList,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Code2,
  Zap,
  BrainCircuit,
  LayoutDashboard,
  Gamepad2,
  Wand2,
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

const navLinks = [
  { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/learning', label: 'مسارات التعلم', icon: BookOpen },
  { to: '/lab', label: 'المختبر الذكي', icon: FlaskConical },
  { to: '/agents', label: 'الوكلاء الذكيون', icon: BrainCircuit },
  { to: '/kanban', label: 'إدارة المهام', icon: ClipboardList },
  { to: '/challenges', label: 'التحديات', icon: Trophy },
  { to: '/generator', label: 'مولد الأفكار', icon: Lightbulb },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();

  return (
    <motion.aside
      initial={{ width: 280 }}
      animate={{ width: sidebarCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed top-0 right-0 bottom-0 z-50 bg-masar-bg/95 border-l border-masar-border/50 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-masar-border/50">
        <Link to="/" className="flex items-center gap-3">
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold bg-gradient-to-l from-masar-cyan to-masar-blue bg-clip-text text-transparent"
            >
              مسار
            </motion.span>
          )}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-masar-blue to-masar-cyan flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-masar-cyan/20">
            م
          </div>
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg bg-masar-surface/50 border border-masar-border/30 text-masar-text-muted hover:text-masar-cyan hover:border-masar-cyan/30 transition-all"
        >
          {sidebarCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-masar-cyan/10 text-masar-cyan border border-masar-cyan/20'
                    : 'text-masar-text-muted hover:text-masar-text hover:bg-masar-surface/50'
                }`}
            >
              <Icon size={20} className={isActive ? 'text-masar-cyan' : ''} />
              {!sidebarCollapsed && <span className="whitespace-nowrap">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-masar-border/50">
        <div className="flex items-center justify-center gap-2 text-xs text-masar-text-muted">
          <span className="w-2 h-2 rounded-full bg-masar-success animate-pulse" />
          {sidebarCollapsed ? '' : 'متصل بالخادم'}
        </div>
      </div>
    </motion.aside>
  );
};
