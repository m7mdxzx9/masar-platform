---
name: Desert Oasis
colors:
  surface: '#141312'
  surface-dim: '#141312'
  surface-bright: '#3a3938'
  surface-container-lowest: '#0f0e0d'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2b2a29'
  surface-container-highest: '#363434'
  on-surface: '#e6e1e0'
  on-surface-variant: '#cec5bc'
  inverse-surface: '#e6e1e0'
  inverse-on-surface: '#31302f'
  outline: '#979087'
  outline-variant: '#4b463f'
  surface-tint: '#cec5bb'
  primary: '#cec5bb'
  on-primary: '#353029'
  primary-container: '#1a1610'
  on-primary-container: '#867f76'
  inverse-primary: '#645d55'
  secondary: '#cbc5c0'
  on-secondary: '#33302d'
  secondary-container: '#4c4845'
  on-secondary-container: '#bdb7b2'
  tertiary: '#c8c5cb'
  on-tertiary: '#303034'
  tertiary-container: '#16161a'
  on-tertiary-container: '#817f84'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ebe1d7'
  primary-fixed-dim: '#cec5bb'
  on-primary-fixed: '#1f1b15'
  on-primary-fixed-variant: '#4c463e'
  secondary-fixed: '#e8e1dc'
  secondary-fixed-dim: '#cbc5c0'
  on-secondary-fixed: '#1e1b18'
  on-secondary-fixed-variant: '#4a4643'
  tertiary-fixed: '#e4e1e7'
  tertiary-fixed-dim: '#c8c5cb'
  on-tertiary-fixed: '#1b1b1f'
  on-tertiary-fixed-variant: '#47464b'
  background: '#141312'
  on-background: '#e6e1e0'
  surface-variant: '#363434'
typography:
  display:
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
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
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
  unit: 4px
  gutter: 24px
  margin-desktop: 48px
  margin-mobile: 16px
  sidebar-collapsed-width: 72px
---

## Brand & Style

This design system draws inspiration from the silent majesty of a desert landscape at midnight. It employs an **Arabic-Modern Fusion** aesthetic, blending traditional Middle Eastern architectural motifs—characterized by organic curves and intricate patterns—with a clean, contemporary interface.

The brand personality is sophisticated, calm, and welcoming. It eschews the coldness of typical dark modes in favor of warm, earthy foundations. The design style leans into **Glassmorphism** and **Organic Minimalism**, using translucent layers and soft background blurs to mimic the hazy horizon of a night sky over dunes. High-quality typography and purposeful gradients provide a sense of luxury and depth, evoking the feeling of a premium, quiet sanctuary.

## Colors

The palette is rooted in the "Desert at Night" concept, utilizing deep, warm neutrals as the foundation rather than pure blacks or cool greys.

- **Warm Sand-Dark (#1A1610):** Used for the primary application background.
- **Surface (#2A2318):** Used for cards, containers, and elevated surfaces.
- **Oasis Teal (#0D9488):** Represents life and water. Used for primary actions, success states, and progress indicators.
- **Sunset Orange (#F97316):** Represents the warmth of the day’s end. Used for highlights, secondary actions, and notifications.

Gradients should be applied sparingly, primarily using a subtle transition from Oasis Teal to a deeper shade for interactive elements, or a soft glow of Sunset Orange for high-priority alerts.

## Typography

This design system utilizes **Inter** for all typographic roles to maintain a crisp, modern edge against the organic visual elements. 

To reinforce the Arabic-modern theme, use generous line heights and tracking. Headlines should feel grounded and authoritative, while labels use a slight tracking increase (0.05em) to improve legibility against dark, textured backgrounds. Large display text may occasionally utilize "Oasis Teal" to "Sunset Orange" linear gradients for an editorial feel.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a focus on expansive white space (or "dark space") to evoke the vastness of a desert. 

- **Sidebar:** Defaults to a collapsed state (72px) to maximize content focus. It expands on hover or click to reveal navigation labels.
- **Desktop:** A 12-column grid with 24px gutters and 48px outer margins.
- **Mobile:** A 4-column grid with 16px margins.
- **Rhythm:** Spacing follows a 4px base unit. Component internal padding should favor horizontal breathing room (e.g., 12px vertical / 24px horizontal) to mimic the horizon.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** and **Ambient Glows** rather than traditional drop shadows.

1.  **Level 0 (Base):** #1A1610 (Warm Sand-Dark).
2.  **Level 1 (Cards/Containers):** #2A2318 (Surface).
3.  **Level 2 (Modals/Popovers):** Surface color with a 1px inner border of 10% white to define edges.
4.  **Interactive Depth:** Active elements should emit a soft "Oasis Teal" outer glow (blur: 20px, spread: -5px, opacity: 0.2) to simulate light reflecting off water in the dark.

Use backdrop blurs (12px to 20px) on navigation bars and floating headers to create a sense of atmospheric perspective.

## Shapes

The shape language is defined by **Organic Curves**. While the base roundedness is set to 0.5rem (Rounded), the system utilizes "Progressive Rounding." 

Small components (buttons, inputs) use the standard `rounded-md` (0.5rem). Larger containers (cards, modals) use `rounded-xl` (1.5rem). Special accent elements, such as featured image containers or decorative background shapes, should use asymmetric border-radii (e.g., `40px 12px 40px 12px`) to evoke the silhouette of arches or wind-swept dunes.

## Components

- **Buttons:** Primary buttons use a solid "Oasis Teal" fill with white text. Secondary buttons are outlined in "Sunset Orange" with a 10% orange background tint. All buttons feature a 300ms transition on hover, slightly increasing the outer glow.
- **Inputs:** Fields use the Surface color (#2A2318) with a bottom-only border of 2px in a muted sand tone. Upon focus, the border transitions to Oasis Teal.
- **Sidebar:** The collapsed sidebar icons are centered. Active states are indicated by a Sunset Orange vertical bar on the left edge.
- **Cards:** Cards are borderless, relying on the tonal difference between Base and Surface colors. They feature a soft 1.5rem corner radius.
- **Chips:** Highly rounded (pill-shaped), using a 10% teal or orange opacity with a solid 1px border of the same color.
- **Interactive Accents:** Incorporate subtle "sand grain" patterns as low-opacity overlays (2-3%) on primary surfaces to add tactile richness.