---
name: Cyberpunk Terminal
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#cfc4c5'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#988e90'
  outline-variant: '#4c4546'
  surface-tint: '#c6c6c6'
  primary: '#c6c6c6'
  on-primary: '#303030'
  primary-container: '#000000'
  on-primary-container: '#757575'
  inverse-primary: '#5e5e5e'
  secondary: '#c6c6c6'
  on-secondary: '#303030'
  secondary-container: '#474747'
  on-secondary-container: '#b5b5b5'
  tertiary: '#c6c6c6'
  on-tertiary: '#303030'
  tertiary-container: '#000000'
  on-tertiary-container: '#757575'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c6'
  on-secondary-fixed: '#1b1b1b'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  headline-lg:
    fontFamily: Space Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Space Mono
    fontSize: 18px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1'
    letterSpacing: 0.1em
  code-sm:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.5'
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  sidebar_collapsed: 64px
---

## Brand & Style

This design system is built on the aesthetic of high-fidelity terminal interfaces and retro-futuristic hacker consoles. It prioritizes technical precision, raw performance, and a "low-life, high-tech" atmosphere. The brand personality is aggressive, efficient, and unapologetically digital.

The style is a fusion of **Brutalisim** and **Cyberpunk**. It utilizes high-contrast color pairings, pixel-perfect structural alignment, and monospaced typography to evoke the feeling of a powerful command-line interface. Visual noise is minimized in favor of data density and functional clarity. The experience should feel like navigating a secure mainframe: fast, authoritative, and immersive.

## Colors

The palette is strictly dark mode, anchored by a "True Black" background to maximize the luminosity of the accent colors. 

- **Background:** Pure black (#000000) for deep immersion.
- **Surface:** A slightly lifted grey (#0D0D0D) used for containers and sectioning.
- **Accents:** Neon Magenta (#FF00FF) and Cyan (#00FFFF) are used for high-priority actions, data visualization, and state indicators. 
- **Functional Colors:** Success is mapped to Cyan, while Errors/Alerts are mapped to Magenta. All borders and dividers use a tactical grey (#333333) to maintain the "pixel-grid" structure without overwhelming the user.

## Typography

This system employs a dual-font strategy to balance character with readability.

- **Headings & UI Labels:** `Space Mono` is used for all headers, buttons, and metadata labels. This reinforces the technical, terminal-inspired vibe. Titles should often be presented in uppercase for a more commanding presence.
- **Body Content:** `Inter` is used for long-form text and data tables to ensure high legibility and a systematic, utilitarian feel. 

For mobile, `headline-lg` scales down to 24px (`headline-md`) to ensure headers do not break the tight grid constraints.

## Layout & Spacing

The layout follows a rigid 4px baseline grid, emphasizing mathematical precision.

- **Grid:** A 12-column fluid grid is used for desktop, shifting to a 4-column grid for mobile. 
- **Sidebar:** The sidebar is collapsed by default to a width of 64px, showing only icons. It expands on hover or click to reveal labels, maximizing the "main console" workspace.
- **Margins:** Outer margins are kept tight (24px on desktop, 16px on mobile) to maintain a sense of high data density. 
- **Borders:** Instead of using whitespace to separate sections, the system uses 1px solid borders (#333333) to create a "boxed" or "compartmentalized" interface similar to legacy BIOS or terminal multiplexers (tmux).

## Elevation & Depth

This system rejects shadows and soft blurs in favor of **Tonal Layers** and **Hard Borders**.

- **Level 0 (Background):** Pure #000000.
- **Level 1 (Surfaces):** #0D0D0D with a 1px solid border (#333333).
- **Interactive States:** Instead of elevation, interaction is signaled by color shifts (e.g., a border changing from grey to Cyan) or "glitch" effects (momentary color inversions).
- **Overlays:** Modals and tooltips use the #0D0D0D surface but add a vibrant Magenta or Cyan 1px border to clearly separate them from the background. 
- **Scanlines:** A subtle, low-opacity horizontal pattern can be applied to the entire viewport to simulate a CRT monitor.

## Shapes

The shape language is strictly **Sharp (0px)**. There are no rounded corners in this design system. This reinforces the "raw" and "unrefined" hacker aesthetic. Every button, input field, card, and modal is a perfect rectangle or square, emphasizing the pixel-grid construction of the digital interface.

## Components

- **Buttons:** Rectangular with a 1px border. Primary buttons use a Cyan border and text. Secondary buttons use Magenta. On hover, the button should fill with the accent color and flip text to black (#000000).
- **Inputs:** Simple boxes with 1px grey borders. When focused, the border glows Cyan. The cursor should be a solid, blinking block in the accent color.
- **Cards:** Defined by 1px borders rather than background color changes. Card headers should be separated by a horizontal 1px line and use the Monospace font.
- **Chips/Tags:** Monospaced text inside a small rectangular border. No background fill unless active.
- **Lists:** Items separated by 1px horizontal lines. Hover states trigger a subtle background shift to #1A1A1A or a left-side accent border (Cyan).
- **Scrollbars:** Custom, ultra-thin (4px) bars in Cyan with no track background, appearing only on hover.
- **Sidebar:** Icon-only in its default state, using high-contrast white or cyan icons against the pure black background.