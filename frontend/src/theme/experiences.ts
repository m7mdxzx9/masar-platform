import type { ThemeColors } from "./ThemeContext";

export type ExperienceId = "nova" | "paper" | "orbit" | "bold";
export type NavigationLayout = "sidebar" | "topbar" | "dock" | "rail";

export interface DesignExperience {
  id: ExperienceId;
  name: string;
  nameAr: string;
  tagline: string;
  description: string;
  layout: NavigationLayout;
  layoutLabel: string;
  mode: "light" | "dark";
  colors: ThemeColors;
  font: string;
}

const statusColors = { success: "#16A67A", error: "#DC454F", warning: "#C48A14" };

export const experiences: DesignExperience[] = [
  {
    id: "nova",
    name: "Nova",
    nameAr: "نوفا",
    tagline: "هدوء يساعدك على التركيز",
    description: "مساحة داكنة بتفاصيل بنفسجية، قائمة جانبية واضحة وبطاقات ناعمة.",
    layout: "sidebar",
    layoutLabel: "قائمة جانبية",
    mode: "dark",
    font: "'Cairo', system-ui, sans-serif",
    colors: {
      bg: "#101019",
      surface: "#191923",
      surfaceHover: "#242433",
      border: "#30303E",
      accent: "#B5A0FF",
      accentGlow: "rgba(181,160,255,0.16)",
      secondary: "#7360D8",
      secondaryGlow: "rgba(115,96,216,0.18)",
      text: "#F4F2FF",
      textMuted: "#A6A3BD",
      textDark: "#858198",
      ...statusColors,
    },
  },
  {
    id: "paper",
    name: "Studio",
    nameAr: "ستوديو",
    tagline: "مساحة بيضاء لأفكار أكبر",
    description: "تصميم تحريري فاتح، تنقل علوي ومساحات واسعة مع لمسات خضراء.",
    layout: "topbar",
    layoutLabel: "تنقل علوي",
    mode: "light",
    font: "'Tajawal', 'Cairo', system-ui, sans-serif",
    colors: {
      bg: "#F6F5F0",
      surface: "#FFFFFF",
      surfaceHover: "#EEEFE8",
      border: "#DDDFD5",
      accent: "#28604B",
      accentGlow: "rgba(40,96,75,0.10)",
      secondary: "#68774F",
      secondaryGlow: "rgba(104,119,79,0.12)",
      text: "#202D27",
      textMuted: "#68766D",
      textDark: "#718074",
      ...statusColors,
    },
  },
  {
    id: "orbit",
    name: "Orbit",
    nameAr: "أوربت",
    tagline: "أفكارك، في مدار واحد",
    description: "خلفية متدرجة وبطاقات زجاجية، مع شريط تنقل عائم في أسفل الشاشة.",
    layout: "dock",
    layoutLabel: "شريط عائم",
    mode: "dark",
    font: "'Cairo', system-ui, sans-serif",
    colors: {
      bg: "#081B22",
      surface: "#102B34",
      surfaceHover: "#1A3C46",
      border: "#2E5058",
      accent: "#79E8D5",
      accentGlow: "rgba(121,232,213,0.16)",
      secondary: "#80AFFF",
      secondaryGlow: "rgba(128,175,255,0.16)",
      text: "#EFFBF9",
      textMuted: "#A1BEC4",
      textDark: "#7C9DA4",
      ...statusColors,
    },
  },
  {
    id: "bold",
    name: "Bold",
    nameAr: "بولد",
    tagline: "طاقة جديدة لكل خطوة",
    description: "هوية جريئة بحدود بارزة وظلال حادة، بطاقات كبيرة وشريط أيقونات جانبي.",
    layout: "rail",
    layoutLabel: "شريط أيقونات",
    mode: "light",
    font: "'Tajawal', 'Cairo', system-ui, sans-serif",
    colors: {
      bg: "#F3F0FF",
      surface: "#FFFFFF",
      surfaceHover: "#EAE3FF",
      border: "#32284C",
      accent: "#6843C4",
      accentGlow: "rgba(104,67,196,0.12)",
      secondary: "#9780CC",
      secondaryGlow: "rgba(151,128,204,0.14)",
      text: "#2B2240",
      textMuted: "#6C607D",
      textDark: "#786D8A",
      ...statusColors,
    },
  },
];

export function getExperience(themeId: string): DesignExperience {
  return (
    experiences.find((experience) => themeId === `experience-${experience.id}`) || experiences[0]
  );
}
