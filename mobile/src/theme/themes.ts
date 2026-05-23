export interface ThemeColors {
  bg: string
  surface: string
  surfaceHover: string
  border: string
  accent: string
  accentGlow: string
  secondary: string
  secondaryGlow: string
  success: string
  error: string
  warning: string
  text: string
  textMuted: string
  textDark: string
}

export interface Theme {
  id: string
  nameAr: string
  nameEn: string
  colors: ThemeColors
}

export const themes: Theme[] = [
  {
    id: 'masar-dark',
    nameAr: 'مسار داكن',
    nameEn: 'Masar Dark',
    colors: {
      bg: '#0A0E17', surface: '#141A2E', surfaceHover: '#1E2740', border: '#2A3550',
      accent: '#00FFFF', accentGlow: 'rgba(0, 255, 255, 0.12)',
      secondary: '#2400FF', secondaryGlow: 'rgba(36, 0, 255, 0.25)',
      success: '#00FF88', error: '#FF4466', warning: '#FFA500',
      text: '#F1F5F9', textMuted: '#94A3B8', textDark: '#64748B',
    },
  },
  {
    id: 'midnight-blue',
    nameAr: 'أزرق منتصف الليل',
    nameEn: 'Midnight Blue',
    colors: {
      bg: '#080C18', surface: '#10162E', surfaceHover: '#182242', border: '#253358',
      accent: '#4D8EFF', accentGlow: 'rgba(77, 142, 255, 0.18)',
      secondary: '#7B61FF', secondaryGlow: 'rgba(123, 97, 255, 0.22)',
      success: '#34D399', error: '#F87171', warning: '#FBBF24',
      text: '#E8ECF4', textMuted: '#8492B4', textDark: '#5A6A8A',
    },
  },
  {
    id: 'forest-night',
    nameAr: 'غابة الليل',
    nameEn: 'Forest Night',
    colors: {
      bg: '#0A1410', surface: '#12241C', surfaceHover: '#1A3228', border: '#244838',
      accent: '#4ADE80', accentGlow: 'rgba(74, 222, 128, 0.15)',
      secondary: '#22D3EE', secondaryGlow: 'rgba(34, 211, 238, 0.18)',
      success: '#86EFAC', error: '#FCA5A5', warning: '#FDE68A',
      text: '#ECFDF5', textMuted: '#86EFAC', textDark: '#4ADE80',
    },
  },
  {
    id: 'sunset-ember',
    nameAr: 'غروب الجمر',
    nameEn: 'Sunset Ember',
    colors: {
      bg: '#140C08', surface: '#241810', surfaceHover: '#34241A', border: '#483026',
      accent: '#FB923C', accentGlow: 'rgba(251, 146, 60, 0.18)',
      secondary: '#F97316', secondaryGlow: 'rgba(249, 115, 22, 0.22)',
      success: '#4ADE80', error: '#F87171', warning: '#FBBF24',
      text: '#FFF7ED', textMuted: '#D4A574', textDark: '#A67B52',
    },
  },
  {
    id: 'royal-purple',
    nameAr: 'أرجواني ملكي',
    nameEn: 'Royal Purple',
    colors: {
      bg: '#0E0618', surface: '#1A0E2E', surfaceHover: '#261842', border: '#342258',
      accent: '#A855F7', accentGlow: 'rgba(168, 85, 247, 0.18)',
      secondary: '#E879F9', secondaryGlow: 'rgba(232, 121, 249, 0.18)',
      success: '#34D399', error: '#FB7185', warning: '#FBBF24',
      text: '#F5F0FF', textMuted: '#B8A2D4', textDark: '#8B70AA',
    },
  },
  {
    id: 'ocean-deep',
    nameAr: 'أعماق المحيط',
    nameEn: 'Ocean Deep',
    colors: {
      bg: '#060F14', surface: '#0C1E2C', surfaceHover: '#142E40', border: '#1A3E54',
      accent: '#06B6D4', accentGlow: 'rgba(6, 182, 212, 0.18)',
      secondary: '#0EA5E9', secondaryGlow: 'rgba(14, 165, 233, 0.18)',
      success: '#2DD4BF', error: '#FB7185', warning: '#F59E0B',
      text: '#F0FDFA', textMuted: '#7DD3FC', textDark: '#38BDF8',
    },
  },
  {
    id: 'rose-gold',
    nameAr: 'ذهب وردي',
    nameEn: 'Rose Gold',
    colors: {
      bg: '#140C10', surface: '#24161C', surfaceHover: '#34222A', border: '#462C38',
      accent: '#F472B6', accentGlow: 'rgba(244, 114, 182, 0.18)',
      secondary: '#E11D48', secondaryGlow: 'rgba(225, 29, 72, 0.18)',
      success: '#4ADE80', error: '#FB7185', warning: '#FBBF24',
      text: '#FFF1F2', textMuted: '#E4A0B5', textDark: '#C0728E',
    },
  },
  {
    id: 'arctic-light',
    nameAr: 'ضوء قطبي',
    nameEn: 'Arctic Light',
    colors: {
      bg: '#F8FAFC', surface: '#FFFFFF', surfaceHover: '#F1F5F9', border: '#E2E8F0',
      accent: '#0EA5E9', accentGlow: 'rgba(14, 165, 233, 0.12)',
      secondary: '#6366F1', secondaryGlow: 'rgba(99, 102, 241, 0.12)',
      success: '#10B981', error: '#EF4444', warning: '#F59E0B',
      text: '#0F172A', textMuted: '#64748B', textDark: '#94A3B8',
    },
  },
  {
    id: 'obsidian',
    nameAr: 'سبج',
    nameEn: 'Obsidian',
    colors: {
      bg: '#070708', surface: '#141416', surfaceHover: '#202024', border: '#3A3A40',
      accent: '#EAB308', accentGlow: 'rgba(234, 179, 8, 0.15)',
      secondary: '#F59E0B', secondaryGlow: 'rgba(245, 158, 11, 0.18)',
      success: '#22C55E', error: '#EF4444', warning: '#F97316',
      text: '#FAFAFA', textMuted: '#A1A1AA', textDark: '#71717A',
    },
  },
  {
    id: 'sakura',
    nameAr: 'ساكورا',
    nameEn: 'Sakura',
    colors: {
      bg: '#160C10', surface: '#24141C', surfaceHover: '#341E28', border: '#442A36',
      accent: '#FDA4AF', accentGlow: 'rgba(253, 164, 175, 0.15)',
      secondary: '#FB7185', secondaryGlow: 'rgba(251, 113, 133, 0.18)',
      success: '#86EFAC', error: '#FCA5A5', warning: '#FDE68A',
      text: '#FFF1F2', textMuted: '#E8B4BC', textDark: '#C8909C',
    },
  },
  {
    id: 'neo-minimalist',
    nameAr: 'بساطة حديثة',
    nameEn: 'Neo Minimalist',
    colors: {
      bg: '#0F172A', surface: '#1E293B', surfaceHover: '#2A3A4B', border: '#3A4A5B',
      accent: '#00FFFF', accentGlow: 'rgba(0, 255, 255, 0.15)',
      secondary: '#BEC6E0', secondaryGlow: 'rgba(190, 198, 224, 0.15)',
      success: '#86EFAC', error: '#FFB4AB', warning: '#FBBF24',
      text: '#E4E2E4', textMuted: '#C6C6CD', textDark: '#909097',
    },
  },
  {
    id: 'warm-scholar',
    nameAr: 'عالم دافئ',
    nameEn: 'Warm Scholar',
    colors: {
      bg: '#120D0A', surface: '#2A1F18', surfaceHover: '#3D2E24', border: '#4D4540',
      accent: '#F0A500', accentGlow: 'rgba(240, 165, 0, 0.20)',
      secondary: '#D1C4BD', secondaryGlow: 'rgba(209, 196, 189, 0.15)',
      success: '#86EFAC', error: '#FFB4AB', warning: '#FBBF24',
      text: '#F4DFCB', textMuted: '#D0C4BD', textDark: '#998F89',
    },
  },
  {
    id: 'electric-aurora',
    nameAr: 'شفق كهربائي',
    nameEn: 'Electric Aurora',
    colors: {
      bg: '#0D0A1A', surface: '#1A1530', surfaceHover: '#25204A', border: '#48464C',
      accent: '#00FF88', accentGlow: 'rgba(0, 255, 136, 0.20)',
      secondary: '#00FFFF', secondaryGlow: 'rgba(0, 255, 255, 0.20)',
      success: '#00FF88', error: '#FFB4AB', warning: '#FBBF24',
      text: '#E6E1E3', textMuted: '#C9C5CC', textDark: '#938F96',
    },
  },
  {
    id: 'nordic-frost',
    nameAr: 'صقيع نوردي',
    nameEn: 'Nordic Frost',
    colors: {
      bg: '#0F1928', surface: '#1C2128', surfaceHover: '#2D3748', border: '#3E4C59',
      accent: '#5B8DEF', accentGlow: 'rgba(91, 141, 239, 0.20)',
      secondary: '#AEC6FF', secondaryGlow: 'rgba(174, 198, 255, 0.15)',
      success: '#34D399', error: '#F87171', warning: '#FBBF24',
      text: '#F5F7FA', textMuted: '#C3C6D4', textDark: '#8D909E',
    },
  },
  {
    id: 'cyberpunk-terminal',
    nameAr: 'طرفية سيبربانك',
    nameEn: 'Cyberpunk Terminal',
    colors: {
      bg: '#000000', surface: '#0D0D0D', surfaceHover: '#1A1A1A', border: '#333333',
      accent: '#FF00FF', accentGlow: 'rgba(255, 0, 255, 0.25)',
      secondary: '#00FFFF', secondaryGlow: 'rgba(0, 255, 255, 0.25)',
      success: '#00FFFF', error: '#FF00FF', warning: '#FFA500',
      text: '#E2E2E2', textMuted: '#CFC4C5', textDark: '#988E90',
    },
  },
  {
    id: 'glass-gradient',
    nameAr: 'زجاج متدرج',
    nameEn: 'Glass & Gradient',
    colors: {
      bg: '#0A0E27', surface: 'rgba(26, 21, 48, 0.6)', surfaceHover: 'rgba(37, 32, 74, 0.6)', border: '#46464D',
      accent: '#818CF8', accentGlow: 'rgba(129, 140, 248, 0.25)',
      secondary: '#A78BFA', secondaryGlow: 'rgba(167, 139, 250, 0.20)',
      success: '#34D399', error: '#F87171', warning: '#FBBF24',
      text: '#E5E1E4', textMuted: '#C7C5CE', textDark: '#919098',
    },
  },
  {
    id: 'brutalist-tech',
    nameAr: 'تقنية وحشية',
    nameEn: 'Brutalist Tech',
    colors: {
      bg: '#111111', surface: '#1A1A1A', surfaceHover: '#222222', border: '#444748',
      accent: '#FF4400', accentGlow: 'rgba(255, 68, 0, 0.25)',
      secondary: '#FFB5A1', secondaryGlow: 'rgba(255, 181, 161, 0.15)',
      success: '#22C55E', error: '#EF4444', warning: '#F97316',
      text: '#FFFFFF', textMuted: '#C4C7C7', textDark: '#8E9192',
    },
  },
  {
    id: 'zen-garden',
    nameAr: 'حديقة زن',
    nameEn: 'Zen Garden',
    colors: {
      bg: '#0F1A13', surface: '#1A2A1F', surfaceHover: '#26362C', border: '#434844',
      accent: '#4ADE80', accentGlow: 'rgba(74, 222, 128, 0.20)',
      secondary: '#22D3EE', secondaryGlow: 'rgba(34, 211, 238, 0.15)',
      success: '#86EFAC', error: '#FCA5A5', warning: '#FDE68A',
      text: '#E4E2E0', textMuted: '#C3C8C2', textDark: '#8D928D',
    },
  },
  {
    id: 'midnight-blueprint',
    nameAr: 'مخطط منتصف الليل',
    nameEn: 'Midnight Blueprint',
    colors: {
      bg: '#071224', surface: '#0B1E3D', surfaceHover: '#142B52', border: '#44474E',
      accent: '#FFD700', accentGlow: 'rgba(255, 215, 0, 0.25)',
      secondary: '#B6C6EE', secondaryGlow: 'rgba(182, 198, 238, 0.15)',
      success: '#22D3EE', error: '#F472B6', warning: '#FFD700',
      text: '#D3E4FC', textMuted: '#C5C6CF', textDark: '#8F9098',
    },
  },
  {
    id: 'desert-oasis',
    nameAr: 'واحة صحراوية',
    nameEn: 'Desert Oasis',
    colors: {
      bg: '#1A1610', surface: '#2A2318', surfaceHover: '#3A3025', border: '#4B463F',
      accent: '#0D9488', accentGlow: 'rgba(13, 148, 136, 0.20)',
      secondary: '#F97316', secondaryGlow: 'rgba(249, 115, 22, 0.20)',
      success: '#0D9488', error: '#EF4444', warning: '#F97316',
      text: '#E6E1E0', textMuted: '#CEC5BC', textDark: '#979087',
    },
  },
]

export const defaultThemeId = 'masar-dark'

export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || themes[0]
}
