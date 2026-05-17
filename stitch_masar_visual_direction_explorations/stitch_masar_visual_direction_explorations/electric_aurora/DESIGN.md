---
name: Electric Aurora
colors:
  surface: '#141314'
  surface-dim: '#141314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0f0e0f'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2b2a2b'
  surface-container-highest: '#363436'
  on-surface: '#e6e1e3'
  on-surface-variant: '#c9c5cc'
  inverse-surface: '#e6e1e3'
  inverse-on-surface: '#313031'
  outline: '#938f96'
  outline-variant: '#48464c'
  surface-tint: '#cac3da'
  primary: '#cac3da'
  on-primary: '#322e40'
  primary-container: '#0d0a1a'
  on-primary-container: '#7d788c'
  inverse-primary: '#605c6f'
  secondary: '#c9c5cf'
  on-secondary: '#312f37'
  secondary-container: '#48454e'
  on-secondary-container: '#b8b3bd'
  tertiary: '#d5c5a6'
  on-tertiary: '#392f19'
  tertiary-container: '#120b00'
  on-tertiary-container: '#86795e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e6dff7'
  primary-fixed-dim: '#cac3da'
  on-primary-fixed: '#1c192a'
  on-primary-fixed-variant: '#484457'
  secondary-fixed: '#e6e0eb'
  secondary-fixed-dim: '#c9c5cf'
  on-secondary-fixed: '#1c1b22'
  on-secondary-fixed-variant: '#48454e'
  tertiary-fixed: '#f2e1c0'
  tertiary-fixed-dim: '#d5c5a6'
  on-tertiary-fixed: '#231a07'
  on-tertiary-fixed-variant: '#50452e'
  background: '#141314'
  on-background: '#e6e1e3'
  surface-variant: '#363436'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
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
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  code-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.5'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
spacing:
  unit: 4px
  container-margin: 24px
  gutter: 16px
  sidebar-collapsed-width: 64px
  sidebar-expanded-width: 240px
---

## Brand & Style

This design system is engineered for high-performance environments, evoking a "hacker-aesthetic" that feels both clandestine and cutting-edge. It targets power users, developers, and tech enthusiasts who prioritize speed and a futuristic digital workspace. 

The visual style is a fusion of **Sci-Fi Minimalism** and **Cyberpunk Neon**. It utilizes high-contrast interfaces where the canvas is a deep, void-like purple-black, punctuated by razor-sharp geometric elements and vibrant, glowing accents. The UI should feel like a sophisticated terminal or a heads-up display (HUD), emphasizing technical precision and high energy through light-emitting borders and digital gradients.

## Colors

The palette is strictly dark-mode, anchored by the deep purple-black (`#0D0A1A`) primary background which provides an infinite sense of depth. Surfaces (`#1A1530`) are used to define distinct functional modules without losing the nocturnal atmosphere.

The core identity of the design system lies in its "Electric Aurora" accent: a linear gradient running from Neon Green (`#00FF88`) to Cyan (`#00FFFF`). This gradient is applied sparingly but impactfully to primary actions, active states, and glowing borders. Text is kept highly legible with pure white for primary information and a muted lilac-grey for secondary metadata to maintain the tech-focused aesthetic.

## Typography

This design system utilizes **Inter** exclusively to maintain a utilitarian, systematic, and highly readable feel. To lean into the sci-fi aesthetic, headlines use tighter letter spacing and heavier weights. 

Label styles are frequently set in uppercase with increased letter spacing to mimic terminal readouts and technical specifications. Use the `code-sm` style for any data-heavy displays or literal code blocks to reinforce the developer-centric vibe. On mobile, headlines scale down aggressively to ensure they remain impactful within narrow viewports without causing excessive line breaks.

## Layout & Spacing

The layout is built on a rigid 12-column fluid grid that aligns with a 4px base spacing unit, ensuring mathematical precision across all elements. 

**Sidebar Navigation:** To maximize the workspace for "high-energy" focus, the sidebar is collapsed by default, appearing as a slim 64px vertical bar containing only icons. Upon hovering or manual toggle, it expands to 240px.

Margins and gutters remain consistent to create "data lanes." On mobile, the 12-column grid collapses to 4 columns, and container margins are maintained at 24px to ensure UI elements do not touch the screen edges, preserving the "floating HUD" appearance.

## Elevation & Depth

Depth is not communicated through shadows or soft gradients, but through **Tonal Layering** and **Luminescent Borders**. 

1.  **Base:** The primary background (`#0D0A1A`).
2.  **Surfaces:** Elements like cards and sidebars use the surface color (`#1A1530`) with no shadow. 
3.  **Glow Borders:** Hierarchy is established by applying a 1px solid border to active or elevated elements. These borders use the "Electric Aurora" gradient and a subtle `drop-shadow` or `box-shadow` with the same accent colors, but with a narrow blur (4px-8px) to simulate a neon tube effect.
4.  **Backdrop:** For overlays or modals, use a heavy background blur (20px) with a semi-transparent version of the primary color to keep the focus on the sharp-edged foreground container.

## Shapes

The shape language of this design system is strictly **Sharp (0px roundedness)**. Every button, input field, card, and modal must have 90-degree corners. 

This lack of curvature reinforces the aggressive, technical, and futuristic feel. Avoid any soft edges. To add visual interest to these hard shapes, use "clipped corners" (45-degree chamfers) on decorative elements or primary buttons to further push the sci-fi aesthetic.

## Components

-   **Buttons:** Primary buttons feature the full Electric Aurora gradient background with black text. Secondary buttons are transparent with a 1px glowing gradient border and white text.
-   **Inputs:** Input fields are dark rectangles (`#0D0A1A`) with a subtle grey border that turns into a glowing Cyan border on focus. Text cursors should be Neon Green.
-   **Cards:** Cards use the surface color (`#1A1530`) with sharp 90-degree edges. They do not have shadows unless they are "active," at which point they gain a 1px glowing border.
-   **Chips/Tags:** Small, rectangular tags with monochromatic borders or subtle gradient fills. Use `label-md` typography.
-   **Lists:** List items should be separated by thin, low-opacity lines. Hover states should trigger a subtle shift in background brightness or a thin vertical "active" bar on the left edge using the accent gradient.
-   **Status Indicators:** Use small, square LEDs rather than round dots. A glowing Neon Green square indicates "Online/Success," while a glowing Magenta-Red indicates "Error."
-   **Scrollbars:** Ultra-thin, non-rounded scrollbar tracks in `#1A1530` with the thumb using a solid Cyan fill.