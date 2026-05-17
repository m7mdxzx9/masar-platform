---
name: Midnight Blueprint
colors:
  surface: '#041425'
  surface-dim: '#041425'
  surface-bright: '#2b3a4d'
  surface-container-lowest: '#000f20'
  surface-container-low: '#0c1d2e'
  surface-container: '#102132'
  surface-container-high: '#1b2b3d'
  surface-container-highest: '#263648'
  on-surface: '#d3e4fc'
  on-surface-variant: '#c5c6cf'
  inverse-surface: '#d3e4fc'
  inverse-on-surface: '#223144'
  outline: '#8f9098'
  outline-variant: '#44474e'
  surface-tint: '#b6c6ee'
  primary: '#b6c6ee'
  on-primary: '#1f3050'
  primary-container: '#0b1e3d'
  on-primary-container: '#7686ab'
  inverse-primary: '#4e5e81'
  secondary: '#b1c6f6'
  on-secondary: '#193057'
  secondary-container: '#31466f'
  on-secondary-container: '#a0b5e4'
  tertiary: '#f1bc94'
  on-tertiary: '#49290c'
  tertiary-container: '#331700'
  on-tertiary-container: '#aa7c59'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#b6c6ee'
  on-primary-fixed: '#071b3a'
  on-primary-fixed-variant: '#364768'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#b1c6f6'
  on-secondary-fixed: '#001a41'
  on-secondary-fixed-variant: '#31466f'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#f1bc94'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#633e20'
  background: '#041425'
  on-background: '#d3e4fc'
  surface-variant: '#263648'
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
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-mono:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: '1'
spacing:
  base: 4px
  grid-size: 24px
  gutter: 16px
  margin-desktop: 32px
  margin-mobile: 16px
---

## Brand & Style

This design system is rooted in the aesthetics of industrial drafting and architectural schematics. It evokes the feeling of a high-precision workspace where complex systems are visualized and built. The brand personality is clinical, disciplined, and expert-oriented, targeting engineers, architects, and technical analysts who value structural integrity over decorative flair.

The visual style is a hybrid of **Brutalism** and **Technical Modernism**. It prioritizes information density and structural transparency. Key characteristics include:
- **Schematic overlays:** Use of visible grid lines and coordinate-style labels.
- **Drafting marks:** Dashed border strokes and "cut-out" corners that suggest a work-in-progress technical drawing.
- **High-Utility density:** Compact layouts that maximize screen real estate without sacrificing legibility.
- **Structural honesty:** Elements do not hide their relationships; they are connected by literal lines and alignment markers.

## Colors

The palette is strictly dark mode, simulating the "blueline" or modern CAD environment. 

- **Foundation:** The deepest navy (#071224) serves as the "paper" background, while the primary blueprint blue (#0B1E3D) defines the main structural containers.
- **Surface:** A lighter indigo-blue (#142B52) is used for interactive surfaces and elevated panels to provide subtle contrast.
- **Accent:** Construction Yellow (#FFD700) is used sparingly for critical call-to-actions, warnings, and active states. It represents the "highlighter" or "marking pen" in a drafting context.
- **Support:** Neutral tones are skewed toward a cool slate to maintain the monochromatic engineering feel. Success and Error states should use highly saturated Cyan and Magenta respectively to mimic plotter ink colors.

## Typography

This design system utilizes **Inter** for its utilitarian and highly legible characteristics. To lean into the engineering vibe, the typography is treated as "annotation."

- **Technical Annotations:** Use `label-mono` for all metadata, coordinates, and sidebar labels. 
- **Headlines:** Keep them tight and heavy. Headlines should feel like title blocks on a blueprint.
- **Alignment:** All text should align strictly to the baseline grid. Avoid centered text; use left-aligned or justified layouts to reinforce the structured feel.
- **Styling:** Use uppercase for headers and labels to mimic traditional drafting hand-lettering.

## Layout & Spacing

The layout is governed by a **fixed-increment grid system**. A visible background grid of 24px squares serves as the underlying framework for all component placement.

- **Sidebar:** The sidebar is collapsed by default, appearing as a thin vertical strip (64px) showing only icons. When expanded, it slides over the content rather than pushing it, maintaining the integrity of the center-stage drawing area.
- **The Blueprint Grid:** The main viewport must feature a persistent grid pattern using `grid_line_hex`. 
- **Alignment:** Elements must snap to the 4px base unit. Borders of major containers should align perfectly with the background grid lines.
- **Breakpoints:**
  - Mobile (< 768px): Single column, margins reduced to 16px.
  - Desktop (> 768px): Multi-panel layout with fixed-width sidebars and fluid center "canvas."

## Elevation & Depth

Depth in this design system is not created through shadows, but through **Tonal Layering** and **Line Weight**.

- **Z-Axis:** Instead of drop shadows, use `dashed` or `solid` borders of varying thicknesses to indicate elevation. 
- **Stroke Logic:** 
  - Level 0 (Background): Grid lines only.
  - Level 1 (Panels): 1px solid border in `grid_line_hex`.
  - Level 2 (Modals/Popovers): 2px solid border in `primary_color_hex` with a high-contrast `accent_color_hex` corner notch.
- **Glassmorphism:** Use very slight backdrop blurs (4px) on floating menus to maintain legibility over the background grid, but keep opacity high (90%+) to maintain a "solid" feel.

## Shapes

The shape language is strictly **Sharp (0px)**. Rounded corners are prohibited to maintain the rigid, technical drawing aesthetic.

- **Dashed Borders:** Interactive elements in a "neutral" or "inactive" state use a 1px dashed border. Upon hover or focus, the border becomes solid.
- **Corner Marks:** For primary cards or containers, use pseudo-elements to create L-shaped "crop marks" at the corners in the accent color.
- **Clipped Corners:** (Optional) Use 45-degree chamfered corners on buttons to evoke military or aerospace hardware.

## Components

- **Buttons:** Rectangular with 1px solid borders. Primary buttons use a `accent_color_hex` fill with black text. Secondary buttons are transparent with a `dashed` border.
- **Inputs:** Underlined only (like a signature line on a document) or fully boxed with a 1px border. Use a monospace-variant of Inter for numerical input.
- **Navigation:** The collapsed sidebar uses iconography with high-contrast active states. Active menu items are indicated by a "bracket" `[` `]` around the icon.
- **Cards:** Simple containers with a "Title Block" at the top-right or bottom-right corner, displaying metadata like "ID: 102-B" in `label-sm`.
- **Dashed Dividers:** Use horizontal and vertical dashed lines to separate sections within a single panel.
- **Checkboxes:** Square boxes. When checked, they should show an "X" mark rather than a checkmark, mimicking a pencil strike on a form.
- **Progress Bars:** Represented as segmented blocks or a solid fill that looks like a technical scale/ruler.