// Theme definitions generated from stitch_masar_visual_direction_explorations
// Each theme includes primary background, surface, accent, fontFamily, borderRadius, and any extra visual property.

export interface ThemeConfig {
  name: string;
  colors: {
    background: string;
    surface: string;
    accent: string;
  };
  fontFamily: string;
  borderRadius: string;
  // optional extra properties for unique visual aspects
  extra?: Record<string, string>;
}

export const themes: Record<string, ThemeConfig> = {
  zenGarden: {
    name: "Zen Garden",
    colors: {
      background: "#131313",
      surface: "#1f201f",
      accent: "#bdcabe",
    },
    fontFamily: "Inter",
    borderRadius: "1rem",
    extra: {
      borderStyle: "solid",
    },
  },
  warmScholar: {
    name: "Warm Scholar",
    colors: {
      background: "#1b1106",
      surface: "#281e11",
      accent: "#d1c4bd",
    },
    fontFamily: "Inter",
    borderRadius: "1rem",
  },
  nordicFrost: {
    name: "Nordic Frost",
    colors: {
      background: "#0a0e1a",
      surface: "#1c2735",
      accent: "#90a4ae",
    },
    fontFamily: "Inter",
    borderRadius: "1rem",
  },
  midnightBlueprint: {
    name: "Midnight Blueprint",
    colors: {
      background: "#0b0e16",
      surface: "#1a2634",
      accent: "#5c9bd8",
    },
    fontFamily: "Inter",
    borderRadius: "1rem",
  },
  neoMinimalistDark: {
    name: "Neo Minimalist Dark",
    colors: {
      background: "#111111",
      surface: "#1e1e1e",
      accent: "#61dafb",
    },
    fontFamily: "Inter",
    borderRadius: "1rem",
  },
  glassGradient: {
    name: "Glass Gradient",
    colors: {
      background: "#10101a",
      surface: "#202030",
      accent: "#7f9cff",
    },
    fontFamily: "Inter",
    borderRadius: "1rem",
  },
  electricAurora: {
    name: "Electric Aurora",
    colors: {
      background: "#0b001f",
      surface: "#1a003f",
      accent: "#ff41c2",
    },
    fontFamily: "Inter",
    borderRadius: "1rem",
    extra: {
      glow: "0 0 10px rgba(255,65,194,0.5)",
    },
  },
  desertOasis: {
    name: "Desert Oasis",
    colors: {
      background: "#2b1c15",
      surface: "#3e2c20",
      accent: "#e8b864",
    },
    fontFamily: "Inter",
    borderRadius: "1rem",
  },
  brutalistTech: {
    name: "Brutalist Tech",
    colors: {
      background: "#1a1a1a",
      surface: "#2b2b2b",
      accent: "#ff5722",
    },
    fontFamily: "Inter",
    borderRadius: "0.5rem",
  },
  cyberpunkTerminal: {
    name: "Cyberpunk Terminal",
    colors: {
      background: "#0f0f1a",
      surface: "#1a1a2a",
      accent: "#00ffea",
    },
    fontFamily: "Inter",
    borderRadius: "0.5rem",
    extra: {
      neon: "true",
    },
  },
};

export const themeNames = Object.keys(themes);
