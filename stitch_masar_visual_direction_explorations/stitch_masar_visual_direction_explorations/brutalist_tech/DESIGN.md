---
name: Brutalist Tech
colors:
  surface: '#141313'
  surface-dim: '#141313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2b2a2a'
  surface-container-highest: '#353434'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c8c6c5'
  primary: '#c8c6c5'
  on-primary: '#313030'
  primary-container: '#111111'
  on-primary-container: '#7e7c7c'
  inverse-primary: '#5f5e5e'
  secondary: '#ffb5a1'
  on-secondary: '#601400'
  secondary-container: '#ff5626'
  on-secondary-container: '#541000'
  tertiary: '#cac6c3'
  on-tertiary: '#32302f'
  tertiary-container: '#121110'
  on-tertiary-container: '#7f7c7a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474646'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#ffb5a1'
  on-secondary-fixed: '#3b0900'
  on-secondary-fixed-variant: '#882000'
  tertiary-fixed: '#e6e1df'
  tertiary-fixed-dim: '#cac6c3'
  on-tertiary-fixed: '#1d1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#141313'
  on-background: '#e5e2e1'
  surface-variant: '#353434'
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 96px
    fontWeight: '900'
    lineHeight: 100%
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: '800'
    lineHeight: 110%
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 120%
  headline-md-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 120%
  body-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 150%
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 150%
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 100%
  label-mono:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 100%
    letterSpacing: 0.05em
spacing:
  unit: 4px
  gutter: 0px
  margin-desktop: 40px
  margin-mobile: 20px
  border-width-thin: 2px
  border-width-thick: 4px
---

## Brand & Style

This design system is an unapologetic expression of digital brutalism. It rejects the soft, rounded, and polite conventions of modern SaaS interfaces in favor of a raw, architectural aesthetic. The vibe is "anti-design"—prioritizing structural honesty, high-impact contrast, and a confident lack of ornamentation. 

The target audience consists of power users, developers, and creative iconoclasts who value efficiency and bold visual statements. The UI should feel like a high-performance machine: heavy, permanent, and direct. There is no room for subtlety here; every element is designed to command attention through sheer weight and scale.

## Colors

The palette is strictly dark and high-contrast. The foundation is built on **Raw Black (#111111)** for deep backgrounds and **Surface Gray (#1A1A1A)** for structural containers. 

The primary driver of action and hierarchy is **Aggressive Orange (#FF4400)**. This color is used sparingly but violently to highlight active states, primary buttons, and critical alerts. Borders and primary text utilize pure white to maintain maximum legibility against the dark surfaces. No gradients, no shadows, and no transparency are permitted.

## Typography

Typography is used as a structural element rather than just a medium for content. We use **Inter** exclusively, utilizing its heaviest weights to create an industrial feel. 

Headlines are oversized and aggressive, often breaking traditional layout bounds. Body text remains highly legible but utilizes generous line heights to balance the "heaviness" of the headlines. All labels and functional text should be uppercase to reinforce the authoritative tone. For technical data or metadata, use wider letter spacing to mimic a monospaced aesthetic.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy with a twist: gutters are removed entirely (0px) to create a "cellular" look where elements share borders. This design system relies on a 12-column grid where every container is defined by a thick, visible stroke.

The **Sidebar** is collapsed by default to maximize the architectural impact of the main content area. When expanded, it should slide out as a solid block, pushing content rather than overlaying it.

Spacing units are strictly based on a 4px scale. Instead of using white space to separate elements, use 2px or 4px borders to define the boundaries of different content sections. Content should feel tightly packed and "constructed."

## Elevation & Depth

This system is strictly **flat**. Depth is never conveyed through shadows or blurs. Instead, visual hierarchy is achieved through:
1. **Contrast:** High-contrast color blocks (Orange vs. Black).
2. **Stroke Weight:** Thicker borders (4px) indicate primary containers; thinner borders (2px) indicate internal subdivisions.
3. **Inversion:** Hover states and active selections should invert the colors (e.g., Black text on an Orange background) to create a tactile "pressed" feel without using 3D effects.
4. **Z-Indexing:** If an element must sit "on top" (like a modal), it must have a thick 4px white border and no shadow, appearing like a cut-out placed over the background.

## Shapes

There are **zero rounded corners** in this design system. Every element—buttons, cards, inputs, and the browser window itself—must feature sharp, 90-degree angles. This reinforces the architectural and "unrefined" brutalist nature of the system. The lack of curves makes the UI feel rigid, stable, and uncompromising.

## Components

### Buttons
Buttons are rectangular blocks with a 2px white border. 
- **Primary:** Background #FF4400, Text #111111 (Black), Bold Uppercase.
- **Secondary:** Background #111111, Text #FFFFFF, 2px White Border.
- **Hover:** The button should "fill" or "invert"—a Primary button becomes Black with Orange text on hover.

### Inputs
Text fields are simple #1A1A1A boxes with a 2px white border. When focused, the border weight increases to 4px or changes to #FF4400. Placeholder text should be #A0A0A0.

### Sidebar
The sidebar is a vertical strip on the left. In its collapsed state, it shows only high-contrast icons. When expanded, it is a solid #111111 block with a 2px right-side border that spans the full height of the viewport.

### Cards & Containers
Cards are not used in the traditional sense. Instead, content is divided into "Cells." Every cell must share a border with the one next to it. Headings for these cells should be placed in a "header bar" within the cell, separated by a horizontal 2px line.

### Checkboxes & Radio Buttons
These are strictly square (no circles for radios). A "selected" state is indicated by filling the square entirely with #FF4400. No checkmarks; just solid color blocks.

### Lists
Lists should feature horizontal dividers between every item. On hover, the entire list item row should switch its background to #1A1A1A or #FF4400 for maximum feedback.