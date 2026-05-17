---
name: Neo-Minimalist Dark
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#1f1f21'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e4e2e4'
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#e4e2e4'
  inverse-on-surface: '#303032'
  outline: '#909097'
  outline-variant: '#45464d'
  surface-tint: '#bec6e0'
  primary: '#bec6e0'
  on-primary: '#283044'
  primary-container: '#0f172a'
  on-primary-container: '#798098'
  inverse-primary: '#565e74'
  secondary: '#ffffff'
  on-secondary: '#003737'
  secondary-container: '#00fbfb'
  on-secondary-container: '#007070'
  tertiary: '#dec29a'
  on-tertiary: '#3e2d11'
  tertiary-container: '#231500'
  on-tertiary-container: '#957d5a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#00fbfb'
  secondary-fixed-dim: '#00dddd'
  on-secondary-fixed: '#002020'
  on-secondary-fixed-variant: '#004f4f'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#131315'
  on-background: '#e4e2e4'
  surface-variant: '#353436'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 32px
  gutter: 24px
  section-gap: 64px
---

## Brand & Style

This design system is built for premium developer tools where focus is the ultimate currency. It follows a **Neo-Minimalist** philosophy, stripping away the noise of traditional borders and heavy shadows in favor of vast whitespace (negative space) and precise tonal shifts. 

The aesthetic is "Deep Tech"—calm, professional, and sophisticated. By utilizing a dark-only mode, we reduce eye strain for long sessions while using a high-energy cyan accent to guide the user's attention to critical actions. The interface should feel like a high-end physical console: quiet, expensive, and incredibly responsive.

## Colors

The palette is strictly limited to maintain a focused atmosphere.
- **Primary (Background):** #0F172A (Deep Navy). This is the foundation of the interface, providing a rich, expansive backdrop.
- **Surface:** #1E293B (Slate Blue-Grey). Used for floating panels, cards, and elevated UI elements to create depth without borders.
- **Accent:** #00FFFF (Cyan). Reserved exclusively for primary actions, active states, and critical indicators.
- **Neutral/Text:** High-contrast whites for headings and muted slates for secondary information to establish a clear information hierarchy.

## Typography

This design system utilizes **Inter** for all UI elements to ensure maximum legibility and a modern, systematic feel. 

- **Headlines:** Use tighter letter spacing and semi-bold weights to create a strong visual anchor.
- **Labels:** Small caps or uppercase labels are used sparingly for metadata and section headers to provide variety without introducing new typefaces.
- **Monospace:** While Inter is the primary face, a monospace font (JetBrains Mono) should be used for code snippets and technical data, maintaining the developer-centric utility.

## Layout & Spacing

The layout philosophy is based on a **Fluid Grid** with generous internal margins to promote focus. 

- **Sidebar:** The navigation sidebar is collapsed by default to maximize the workspace. It expands on hover or via a persistent toggle.
- **Margins:** Use a minimum of 32px padding for main containers to create the "Neo-Minimalist" sense of breathability.
- **Dividers:** Avoid solid lines. Use subtle 1px shifts in background color (#1E293B against #0F172A) or generous whitespace to separate content blocks.
- **Breakpoints:**
  - **Desktop:** 12-column grid, 32px margins.
  - **Tablet:** 8-column grid, 24px margins.
  - **Mobile:** 4-column grid, 16px margins; stack all elements vertically.

## Elevation & Depth

In the absence of borders, depth is communicated through **Tonal Layering**. 

- **Level 0 (Base):** #0F172A. The main canvas.
- **Level 1 (Cards/Surfaces):** #1E293B. Use this for interactive regions or content grouping.
- **Level 2 (Popovers/Modals):** Use a slightly lighter tint of the surface color or a very subtle, large-radius ambient shadow (0px 20px 50px rgba(0,0,0,0.3)).
- **Interactions:** Hover states should be indicated by a subtle increase in brightness or the appearance of the Cyan accent as a small 2px highlight strip, rather than a shadow change.

## Shapes

The design system uses **Soft** roundedness (0.25rem / 4px). This maintains a crisp, architectural feel that aligns with professional developer tools while avoiding the harshness of perfectly sharp corners. 

Buttons and input fields should strictly follow the 4px radius. Larger containers (cards) may use `rounded-lg` (8px) to soften the overall composition.

## Components

- **Buttons:** 
  - **Primary:** Solid Cyan (#00FFFF) with black text. No border.
  - **Secondary:** Ghost style, no background, Cyan text, subtle 1px #1E293B divider-style border only on hover.
- **Inputs:** Background should be #1E293B. No borders. Active state is indicated by a 1px Cyan bottom-border only.
- **Sidebar:** Icons only when collapsed. On hover, the panel slides out with a background of #1E293B, appearing to float above the content layer.
- **Chips:** Small, low-contrast background (#1E293B) with muted text (#94A3B8). Active chips use Cyan text.
- **Cards:** No borders. Background #1E293B. Headings within cards should have 24px of padding from the edge to maintain the "generous whitespace" rule.
- **Checkboxes/Radios:** Pure Cyan for checked states. Unchecked states are subtle #1E293B outlines.