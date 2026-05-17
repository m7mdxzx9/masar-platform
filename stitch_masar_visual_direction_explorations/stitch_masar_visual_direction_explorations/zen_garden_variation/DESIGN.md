---
name: Zen Garden Variation
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393938'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1c1b'
  surface-container: '#1f201f'
  surface-container-high: '#2a2a29'
  surface-container-highest: '#353534'
  on-surface: '#e4e2e0'
  on-surface-variant: '#c3c8c2'
  inverse-surface: '#e4e2e0'
  inverse-on-surface: '#30302f'
  outline: '#8d928d'
  outline-variant: '#434844'
  surface-tint: '#bdcabe'
  primary: '#bdcabe'
  on-primary: '#28332b'
  primary-container: '#0f1a13'
  on-primary-container: '#77847a'
  inverse-primary: '#556158'
  secondary: '#c3c8c2'
  on-secondary: '#2d312e'
  secondary-container: '#434844'
  on-secondary-container: '#b2b6b1'
  tertiary: '#dac0c6'
  on-tertiary: '#3c2c30'
  tertiary-container: '#221418'
  on-tertiary-container: '#917c81'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d9e6da'
  primary-fixed-dim: '#bdcabe'
  on-primary-fixed: '#131e17'
  on-primary-fixed-variant: '#3e4a41'
  secondary-fixed: '#e0e4de'
  secondary-fixed-dim: '#c3c8c2'
  on-secondary-fixed: '#181d19'
  on-secondary-fixed-variant: '#434844'
  tertiary-fixed: '#f7dce1'
  tertiary-fixed-dim: '#dac0c6'
  on-tertiary-fixed: '#26181c'
  on-tertiary-fixed-variant: '#544247'
  background: '#131313'
  on-background: '#e4e2e0'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-margin: 32px
  gutter: 24px
  section-gap: 64px
  sidebar-width-collapsed: 72px
---

## Brand & Style

This design system is anchored in the concept of digital biophilia. It aims to reduce cognitive load and promote a sense of calm and focused growth. The style is a fusion of **Soft Minimalism** and **Organic Tactility**, where the UI feels less like a machine and more like a curated natural space. 

The aesthetic prioritizes deep, forest-like depths punctuated by vibrant, life-affirming accents. Every interaction should feel intentional and quiet. This is achieved through generous whitespace (negative space), soft transitions, and a complete absence of sharp corners, mirroring the irregularities found in nature.

## Colors

The palette is strictly dark-mode, utilizing high-chroma greens in the shadows to maintain a "living" feel even in the darkest areas. 

- **Primary Background**: A deep, desaturated green-black that serves as the earth of the UI.
- **Surface Layer**: A slightly lighter forest tone used for cards, modals, and raised elements.
- **Accent**: A luminous sage green used sparingly for high-priority actions, progress indicators, and "growth" states.
- **Support Tones**: Text should never be pure white; use an off-white mint to reduce eye strain and maintain the meditative atmosphere.

## Typography

This design system utilizes **Inter** exclusively to provide a clean, highly legible foundation that balances the organic shapes of the containers. 

Typography should be treated with a strong hierarchy to guide the user's eye effortlessly. Use "Display" and "Headline" sizes for welcoming messages and section headers. "Body" text should maintain ample line height to ensure a breezy, uncrowded reading experience. For "Label" styles, especially in navigation or buttons, a slightly heavier weight is used to offset the softness of the surrounding rounded containers.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** with exaggerated margins to evoke a sense of openness. 

- **Sidebar**: Collapsed by default to maximize the focus area. It expands only on hover or explicit toggle, using a smooth, eased transition.
- **Margins**: Desktop views should utilize a minimum of 32px outer margins, increasing to 64px for content-heavy "focus" modes.
- **Rhythm**: Use an 8px base unit. Section gaps should be generous (64px+) to prevent the interface from feeling cluttered.
- **Mobile**: On mobile devices, gutters reduce to 16px, but vertical spacing remains high to maintain the meditative "breathable" quality.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Glows** rather than harsh shadows.

- **Level 0 (Base)**: The `#0F1A13` background.
- **Level 1 (Surface)**: Elements like cards and sidebars use `#1A2A1F`. They do not use shadows; instead, they use a subtle 1px border of `#26362C` to define their boundaries.
- **Level 2 (Interaction)**: When an element is hovered or active, it may emit a soft, diffused "Sage" glow (blur 20px+, opacity 10-15%) to simulate light passing through foliage.
- **Backdrop**: Use heavy background blurs (20px+) for any floating overlays or modals to maintain the sense of a continuous, singular environment.

## Shapes

The shape language is **Ultra-Rounded**. There are no sharp corners in this design system.

- **Containers**: Cards and main UI blocks use a minimum of 2rem (32px) corner radius.
- **Buttons & Inputs**: These are always pill-shaped (fully rounded ends).
- **Organic Variation**: Where possible, use slightly asymmetrical "pebble" shapes for decorative elements or avatars to reinforce the nature-inspired theme.

## Components

- **Buttons**: Primary buttons are pill-shaped, filled with Sage Green (`#4ADE80`), using dark text for maximum contrast. Secondary buttons are outlined with a thick 2px stroke and no fill.
- **Inputs**: Field backgrounds should be slightly darker than the surface color. Labels float above the input with generous padding.
- **Cards**: Feature large corner radii and significant internal padding (24px-32px). Borders are preferred over shadows.
- **Navigation**: The collapsed sidebar icons are housed within circular or soft-pebble containers. Active states are indicated by a small, glowing Sage Green dot.
- **Progress Indicators**: Use organic, fluid "growing" bars rather than static blocks. Animations should be slow and rhythmic, mimicking breathing.
- **Chips**: Small, fully rounded pill shapes used for tagging or filtering, using low-contrast fills to remain unobtrusive.