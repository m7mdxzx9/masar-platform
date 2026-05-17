---
name: Nordic Frost
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c3c6d4'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#8d909e'
  outline-variant: '#424752'
  surface-tint: '#aec6ff'
  primary: '#aec6ff'
  on-primary: '#002e6b'
  primary-container: '#5d8ef1'
  on-primary-container: '#00275e'
  inverse-primary: '#1e5bba'
  secondary: '#c4c7ca'
  on-secondary: '#2d3133'
  secondary-container: '#44474a'
  on-secondary-container: '#b3b5b8'
  tertiary: '#c2c7d0'
  on-tertiary: '#2c3138'
  tertiary-container: '#8c919a'
  on-tertiary-container: '#252a31'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#aec6ff'
  on-primary-fixed: '#001a43'
  on-primary-fixed-variant: '#004397'
  secondary-fixed: '#e0e3e6'
  secondary-fixed-dim: '#c4c7ca'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#44474a'
  tertiary-fixed: '#dee2ec'
  tertiary-fixed-dim: '#c2c7d0'
  on-tertiary-fixed: '#171c23'
  on-tertiary-fixed-variant: '#42474f'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
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
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 40px
  gutter: 24px
  section-gap: 80px
  sidebar-width-collapsed: 72px
---

## Brand & Style

This design system is anchored in Scandinavian functionalism, prioritizing clarity, order, and a cold, crisp aesthetic. The brand personality is disciplined yet breathable, evoking the stillness of a winter landscape. It utilizes a high-contrast interplay between expansive "ice" surfaces and deep "granite" containers.

The design style is a hybrid of **Minimalism** and **Tonal Layering**. It avoids unnecessary ornamentation, relying on precise typography and purposeful white space (air) to guide the user. The interface should feel expensive, quiet, and highly organized, catering to users who value deep focus and structural efficiency.

## Colors

The palette is strictly curated to maintain a "frost" aesthetic. Despite being a dark-mode-only system, it utilizes large spans of the primary background color to create an "airy" feel usually reserved for light themes.

- **Background (Base):** #F5F7FA (Ice-Gray). This is used for the primary canvas, creating a unique high-light environment for a dark-mode system.
- **Surface (Cards/Containers):** #1C2128 (Dark Slate). These are the primary structural elements that house content, providing a deep contrast against the ice background.
- **Accent (Frost Blue):** #5B8DEF. Used sparingly for interactive states, primary actions, and critical focus indicators.
- **Typography:** Use #1C2128 for text appearing on light sections and #F5F7FA for text appearing within dark cards.

## Typography

The system utilizes **Inter** exclusively to lean into its utilitarian, Swiss-inspired roots. The typographic hierarchy relies on deliberate weight shifts and generous leading to maintain legibility against high-contrast backgrounds.

Headlines should be set with slight negative letter-spacing to appear "tight" and engineered. Body text requires ample line height (1.5 - 1.6) to support the "breathable" narrative of the design system. Labels and overlines should use medium to semi-bold weights, often in uppercase for the smallest sizes to ensure they don't get lost in the "air."

## Layout & Spacing

This design system employs a **Fixed Grid** model for desktop and a fluid model for mobile. On desktop, content is centered within a 1280px max-width container to preserve the "airy" margins on the periphery.

- **The Sidebar:** Remains collapsed by default at 72px width, emphasizing the focus on the main workspace. It expands only on hover or explicit toggle.
- **Rhythm:** A 12-column grid with wide 24px gutters. 
- **Breathing Room:** Sections are separated by large vertical gaps (80px+) to prevent the interface from feeling cluttered. 
- **Mobile:** Transition to a 4-column fluid grid with 16px margins; display-level typography scales down aggressively to maintain the "organized" look without overflowing containers.

## Elevation & Depth

Depth is achieved through **Tonal Layering** rather than traditional shadows. Because the background is light (#F5F7FA) and cards are dark (#1C2128), the "elevation" is inverted; the darkest elements are the most prominent "floating" surfaces.

- **Primary Level:** The #F5F7FA canvas (The "Ground").
- **Secondary Level:** #1C2128 Cards (The "Objects").
- **Tertiary Level:** Occasional #2D3748 overlays or dropdowns that sit atop the dark cards, using a subtle 1px border in #3E4C59 to define edges.
- **Shadows:** Avoid soft, fuzzy shadows. If depth must be reinforced, use a "hard" 2px offset shadow in #5B8DEF at 10% opacity for interactive elements only.

## Shapes

The shape language is "Soft" (0.25rem/4px radius). This slight rounding prevents the UI from feeling "brutal" or aggressive while maintaining the precision of the Scandinavian aesthetic.

- **Cards & Buttons:** 4px radius (Soft).
- **Large Sections:** 8px radius (rounded-lg) for outer containers to soften the high-contrast transition between the light background and dark cards.
- **Inputs:** 4px radius to match buttons, ensuring a cohesive form-factor.

## Components

- **Cards:** The hallmark of this design system. Dark #1C2128 backgrounds with light #F5F7FA text. Inner padding should be generous (min 32px).
- **Buttons:** 
    - *Primary:* Frost Blue #5B8DEF background with white text. No border.
    - *Secondary:* Ghost style with 1px border in #5B8DEF.
- **Sidebar:** Collapsed rail. Icons only, centered. Active state uses a vertical 3px "frost" line on the left edge.
- **Inputs:** Dark background (#1C2128) when placed on the light canvas, or a slightly lighter slate (#2D3748) when placed inside cards. Active focus is always a solid 2px #5B8DEF ring.
- **Chips:** Small, uppercase labels with #F5F7FA background and #1C2128 text for high visibility inside dark containers.
- **Progress Indicators:** Use thin, 2px horizontal lines in #5B8DEF. Avoid thick bars to keep the "airy" feel.