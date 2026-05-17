---
name: Glass & Gradient
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c7c5ce'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#919098'
  outline-variant: '#46464d'
  surface-tint: '#c1c4e6'
  primary: '#c1c4e6'
  on-primary: '#2b2f49'
  primary-container: '#0a0e27'
  on-primary-container: '#777a99'
  inverse-primary: '#595c79'
  secondary: '#c6c5d4'
  on-secondary: '#2e303b'
  secondary-container: '#474854'
  on-secondary-container: '#b7b7c6'
  tertiary: '#e7bea1'
  on-tertiary: '#442b16'
  tertiary-container: '#1e0b00'
  on-tertiary-container: '#98755b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dee0ff'
  primary-fixed-dim: '#c1c4e6'
  on-primary-fixed: '#161a33'
  on-primary-fixed-variant: '#414561'
  secondary-fixed: '#e2e1f0'
  secondary-fixed-dim: '#c6c5d4'
  on-secondary-fixed: '#1a1b26'
  on-secondary-fixed-variant: '#454652'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#e7bea1'
  on-tertiary-fixed: '#2c1604'
  on-tertiary-fixed-variant: '#5d412a'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  sidebar_collapsed: 72px
  container_max_width: 1440px
---

## Brand & Style

The design system is rooted in the **Glassmorphism** movement, tailored specifically for high-end SaaS platforms that prioritize visual depth and a "future-forward" aesthetic. The brand personality is sophisticated, technical, and ethereal. It leans heavily into a dark-mode-only environment to maximize the luminous effect of gradients and translucent layers.

The UI should feel lightweight and "floating," as if the interface exists in a three-dimensional space with infinite depth. Backgrounds are not static; they serve as a canvas for soft, moving orbs of light that interact with the frosted glass surfaces of the foreground elements.

## Colors

The palette is strictly dark, utilizing **Deep Blue (#0A0E27)** as the foundational canvas. This deep base allows the **Purple-to-Cyan accent gradient** to pop with a neon-like vibrance. 

Surface colors are rarely solid; they are composed of semi-transparent layers of the primary color or pure white with low opacity (4–12%) to create the "frosted" effect. High-contrast white is reserved for critical data and headers, while muted slate tones provide hierarchy for secondary information. The accent gradient is used sparingly for primary actions, progress indicators, and active states to guide the user's eye through the translucent layout.

## Typography

This design system utilizes **Inter** exclusively to maintain a clean, systematic, and utilitarian feel that balances the highly expressive glass aesthetics. 

To maintain legibility against translucent and blurred backgrounds:
- **Weight:** Use medium and semi-bold weights more frequently than thin weights to ensure text does not "dissolve" into the background blur.
- **Contrast:** Titles should utilize pure white (#FFFFFF), while body text uses a slightly desaturated off-white (#E2E8F0) to reduce eye strain.
- **Letter Spacing:** Tighten tracking for large display type to enhance the polished, "editorial" SaaS look.

## Layout & Spacing

The layout philosophy centers on **Floating Containers**. Elements are not bound by rigid edges; instead, they float within a fluid 12-column grid. 

- **Sidebar:** The navigation is collapsed by default to a 72px width, emphasizing the expansive workspace. It expands only on hover or via a toggle, appearing as a glass panel that overlays the content.
- **Margins:** Generous 40px (lg) margins on desktop ensure the floating cards have room to "breathe" against the background gradients.
- **Gaps:** Use a 24px (md) gutter consistently between floating cards to maintain a rhythmic vertical and horizontal flow.

## Elevation & Depth

Depth is conveyed through **Backdrop Blurs** and **Inner Glows** rather than traditional drop shadows. 

1.  **Level 1 (Base):** The deep blue background with faint, moving radial gradients.
2.  **Level 2 (Cards/Panels):** 40% opacity surfaces with a 20px-40px backdrop blur. These elements feature a 1px border with a linear gradient (top-left: white at 20% opacity to bottom-right: white at 5% opacity) to simulate a light-catching glass edge.
3.  **Level 3 (Modals/Popovers):** Higher opacity (60%) and a subtle outer glow using the primary accent color (purple) at 10% opacity to indicate the highest level of interaction.

Shadows, when used, are extremely soft, large, and tinted with the primary deep blue to avoid a "muddy" look.

## Shapes

The shape language is consistently **Rounded**, using 16px (1rem) as the standard radius for cards and major containers. This softens the technical nature of the SaaS data and reinforces the approachable, "liquid" feel of the glass components. 

Buttons and input fields follow a slightly smaller 8px radius, while small utility chips and tags are pill-shaped to distinguish them from interactive containers.

## Components

### Buttons
Primary buttons feature the **Purple-to-Cyan gradient** with white text. Secondary buttons are "Ghost Glass" — transparent backgrounds with the 1px light-catching border and a subtle hover glow.

### Cards
Cards are the hero of the design system. They must always have a `backdrop-filter: blur(20px)` and a semi-transparent border. Titles within cards should be pinned to the top-left with ample padding (24px).

### Input Fields
Inputs are dark with a 10% white overlay. On focus, the 1px border transitions from a static grey to the accent gradient, and a soft cyan outer glow appears.

### Sidebar
The collapsed sidebar contains icon-only navigation. Icons should be high-stroke weight (2px) and use the accent color only for the "Active" state.

### Progress & Data Viz
Data visualizations should utilize the accent colors (Purple and Cyan) with glow effects. Charts should avoid solid fills, preferring gradients with decreasing opacity to maintain the transparency theme.