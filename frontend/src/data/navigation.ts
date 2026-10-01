import { Palette, LayoutDashboard, CalendarDays, GraduationCap, BookOpen, StickyNote, Sparkles, FlaskConical, BrainCircuit, ClipboardList, Layers, Globe, Trophy, Rocket, KanbanSquare, Target, Code2, HardDrive, Cloud, ChartNoAxesCombined, Library, Compass } from 'lucide-react'

export const navigation = [
  { group: 'مساحتك الدراسية', items: [
    { path: 'dashboard', label: 'نظرة عامة', icon: LayoutDashboard, description: 'يومك الدراسي في مكان واحد' },
    { path: 'planner', label: 'خطة اليوم', icon: Compass, description: 'خطط لأولوياتك وتابع إنجازك' },
    { path: 'schedule', label: 'الجدول الدراسي', icon: GraduationCap, description: 'محاضراتك ومواعيدك' },
    { path: 'calendar', label: 'التقويم', icon: CalendarDays, description: 'الأحداث والمواعيد القادمة' },
    { path: 'subjects', label: 'المواد الدراسية', icon: BookOpen, description: 'نظم موادك وملفاتك' },
    { path: 'notes', label: 'الملاحظات', icon: StickyNote, description: 'اكتب أفكارك واحفظها' },
  ] },
  { group: 'تعلم وجرّب', items: [
    { path: 'study-assistant', label: 'مساعد الدراسة', icon: Sparkles, description: 'افهم محتواك بمساعدة الذكاء الاصطناعي' },
    { path: 'lessons', label: 'مكتبة الدروس', icon: Library, description: 'محتوى تعليمي منظم' },
    { path: 'courses', label: 'الدورات', icon: BookOpen, description: 'اكتشف مسارات التعلم' },
    { path: 'labs', label: 'مختبر البرمجة', icon: FlaskConical, description: 'اكتب وشغل الكود' },
    { path: 'agents', label: 'الوكلاء الأذكياء', icon: BrainCircuit, description: 'مساعدون لمهامك التعليمية' },
    { path: 'quiz-generator', label: 'الاختبارات', icon: ClipboardList, description: 'اختبر فهمك للمادة' },
    { path: 'flashcards', label: 'بطاقات المراجعة', icon: Layers, description: 'راجع وتذكر المعلومات' },
    { path: 'english', label: 'تعلم الإنجليزية', icon: Globe, description: 'طور لغتك ومفرداتك' },
    { path: 'challenges', label: 'التحديات', icon: Trophy, description: 'تعلم بالممارسة واللعب' },
  ] },
  { group: 'إنجاز وتنظيم', items: [
    { path: 'projects', label: 'المشاريع', icon: Rocket, description: 'حوّل تعلمك إلى تطبيق' },
    { path: 'kanban', label: 'لوحة المهام', icon: KanbanSquare, description: 'نظم سير العمل' },
    { path: 'goals', label: 'الأهداف', icon: Target, description: 'تابع تقدمك نحو أهدافك' },
    { path: 'code-library', label: 'مكتبة الأكواد', icon: Code2, description: 'احفظ مقتطفاتك البرمجية' },
    { path: 'analytics', label: 'التحليلات', icon: ChartNoAxesCombined, description: 'افهم نشاطك الدراسي' },
    { path: 'backup', label: 'النسخ الاحتياطي', icon: HardDrive, description: 'احم بياناتك واستعدها' },
    { path: 'appearance', label: 'الثيمات والمظهر', icon: Palette, description: 'غيّر تصميم مساحتك بالكامل' },
    { path: 'drive', label: 'Google Drive', icon: Cloud, description: 'اربط ملفاتك السحابية' },
  ] },
]
export const allPages = navigation.flatMap(group => group.items)
export function searchPages(query: string) {
  const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f]/g, '').replace(/[أإآ]/g, 'ا').trim()
  const terms = normalize(query).split(/\s+/)
  return allPages.filter(page => terms.every(term => normalize(`${page.label} ${page.description} ${page.path}`).includes(term)))
}
