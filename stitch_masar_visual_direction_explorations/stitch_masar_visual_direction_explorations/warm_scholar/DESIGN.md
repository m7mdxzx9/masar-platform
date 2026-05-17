---
name: Warm Scholar
colors:
  surface: '#1b1106'
  surface-dim: '#1b1106'
  surface-bright: '#443729'
  surface-container-lowest: '#160c03'
  surface-container-low: '#241a0e'
  surface-container: '#281e11'
  surface-container-high: '#34281b'
  surface-container-highest: '#3f3325'
  on-surface: '#f4dfcb'
  on-surface-variant: '#d0c4bd'
  inverse-surface: '#f4dfcb'
  inverse-on-surface: '#3a2e21'
  outline: '#998f89'
  outline-variant: '#4d4540'
  surface-tint: '#d1c4bd'
  primary: '#d1c4bd'
  on-primary: '#362f2a'
  primary-container: '#1a1410'
  on-primary-container: '#887d77'
  inverse-primary: '#665d57'
  secondary: '#d6c3b8'
  on-secondary: '#3a2e26'
  secondary-container: '#52443c'
  on-secondary-container: '#c4b1a7'
  tertiary: '#c4c7c8'
  on-tertiary: '#2d3132'
  tertiary-container: '#121617'
  on-tertiary-container: '#7c8081'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ede0d9'
  primary-fixed-dim: '#d1c4bd'
  on-primary-fixed: '#211a16'
  on-primary-fixed-variant: '#4d4540'
  secondary-fixed: '#f3ded3'
  secondary-fixed-dim: '#d6c3b8'
  on-secondary-fixed: '#241913'
  on-secondary-fixed-variant: '#52443c'
  tertiary-fixed: '#e0e3e4'
  tertiary-fixed-dim: '#c4c7c8'
  on-tertiary-fixed: '#181c1d'
  on-tertiary-fixed-variant: '#434748'
  background: '#1b1106'
  on-background: '#f4dfcb'
  surface-variant: '#3f3325'
typography:
  display-lg:
    fontFamily: Literata
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Literata
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Literata
    fontSize: 24px
    fontWeight: '600'
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
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Literata
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  max-width-content: 800px
---

## Brand & Style

This design system evokes the atmosphere of a private, heritage library—think dark mahogany, aged parchment, and the quiet dignity of a scholar’s study. The aesthetic sits at the intersection of **Tactile Minimalism** and **Academic Sophistication**, prioritizing focus and long-form consumption. 

The experience is exclusively dark-mode, utilizing high-quality typography and subtle material textures to create a sense of physical presence. The interface should feel heavy, permanent, and quiet, avoiding flashy animations in favor of steady, deliberate transitions.

## Colors

The palette is anchored in deep, organic earth tones. 

- **Primary Background (#120D0A):** An ultra-dark "espresso" that serves as the canvas.
- **Surface (#2A1F18):** Used for cards, containers, and raised elements to create a subtle "leather-bound" contrast against the background.
- **Primary Text (#D9C5B2):** A soft, desaturated parchment color to ensure readability without the harshness of pure white.
- **Accent (#F0A500):** A warm, burnished gold used sparingly for calls to action, focus states, and highlighting critical intellectual paths.

## Typography

This design system employs a sophisticated typographic pairing to balance tradition with modern utility. 

- **Headlines (Literata):** A scholarly serif that provides an authoritative, bookish quality. It features generous x-heights and slightly modulated strokes that mimic ink on paper.
- **Body & UI (Inter):** A neutral, highly legible sans-serif. By using Inter for the body and functional labels, the system remains efficient and accessible for prolonged reading and data entry, preventing the "antique" feel from becoming cumbersome.
- **Hierarchy:** Use larger serif headings to introduce sections, while keeping all functional interface elements in Inter for clarity.

## Layout & Spacing

The layout philosophy follows a **Fixed-Width Reading Column** model. Content is centered with generous outer margins to simulate the experience of reading a physical book.

- **Grid:** A 12-column grid for desktop, but the primary text content should rarely exceed 8 columns to maintain ideal line lengths.
- **Sidebar:** The sidebar is collapsed by default to maximize focus. It should slide out as an overlay or push the content slightly, using a high-z-index surface (#2A1F18).
- **Rhythm:** Use a consistent 8px baseline grid. Large vertical gaps between sections (48px+) are encouraged to allow the layout to "breathe" like a well-typeset manuscript.

## Elevation & Depth

Depth is achieved through **Tonal Layering** rather than traditional drop shadows. 

- **Surface Levels:** The background is the deepest layer (#120D0A). Cards and navigation elements sit on a slightly lighter surface (#2A1F18). 
- **Borders:** Use subtle, low-contrast inner borders (1px, #3D2E24) to define edges. 
- **Focus:** The only "glow" allowed is a soft, diffused gold amber (#F0A500 at 10% opacity) used for active input fields or primary button hovers.
- **Interaction:** On hover, surfaces may lift slightly by transitioning to a marginally lighter brown, suggesting a tactile, leather-like response.

## Shapes

The shape language is conservative and structural. 

- **Corners:** Use "Soft" roundedness (0.25rem / 4px). This prevents the UI from feeling too sharp or aggressive while avoiding the playfulness of fully rounded corners. 
- **Buttons:** Rectangular with minimal rounding to maintain a classic, architectural feel.
- **Dividers:** Horizontal rules should be thin (1px) and use a faded gradient or the secondary surface color to separate content without creating visual noise.

## Components

- **Buttons:** Primary buttons use the Warm Gold (#F0A500) background with dark text (#1A1410). Secondary buttons use a hollow stroke (#D9C5B2) or a subtle surface-level background.
- **Sidebar:** Collapsed into a simple "hamburger" or "index" icon. When expanded, it lists navigation items in Inter (Label-MD), with active states marked by a gold vertical line on the left.
- **Cards:** No heavy shadows. Use a solid surface color (#2A1F18) with a 1px border (#3D2E24).
- **Inputs:** Darker than the surface (#1A1410), with gold bottom-borders on focus to mimic a scholar's underlining.
- **Chips/Tags:** Small, pill-shaped elements with the secondary surface color and parchment-toned text.
- **Specialty Component - "The Bookend":** A decorative vertical line or serif-style ornament used at the start and end of long-form articles to reinforce the scholarly theme.