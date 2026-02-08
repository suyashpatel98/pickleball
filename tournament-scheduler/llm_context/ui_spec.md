# Website Design Specification

---

# Visual Design Requirements

## Visual Style
Memphis-inspired aesthetic.

## Background
- Base color: Soft peach  
- Hex: `#FFE5D9`

## Geometric Elements
- Scattered primitive shapes throughout the UI:
  - Circles
  - Triangles
  - Rectangles
- Used as decorative accents to reinforce the Memphis style.

## Color Palette
Primary accent colors include:
- Mint green
- Lilac purple
- Soft yellow
- Black (used for accents and contrast)

## Typography
- Style: Bold, uppercase, sans-serif
- Treatments:
  - Subtle drop shadows for depth and emphasis

## Atmosphere / Tone
- Energetic  
- Whimsical  
- Playful  
- Functional (maintains usability despite expressive visuals)

---

# Design Style Implementation

## Color Palette & CSS Variables

All colors are defined using HSL values.

### Background
- HSL: `25, 60%, 92%`  
- Description: Soft peach base background

### Foreground
- HSL: `0, 0%, 10%`  
- Description: Near-black primary text color

### Card
- Background: `0, 0%, 100%` (White)  
- Foreground: `0, 0%, 10%` (Dark text)

### Primary
- Background: `158, 45%, 70%` (Mint green)  
- Foreground: `0, 0%, 10%` (Dark text)

### Secondary
- Background: `45, 100%, 85%` (Soft yellow)  
- Foreground: `0, 0%, 10%` (Dark text)

### Accent
- Background: `260, 60%, 85%` (Lilac purple)  
- Foreground: `0, 0%, 10%` (Dark text)

### Destructive
- Background: `0, 84%, 60%` (Red for errors)

### Muted
- Background: `25, 40%, 88%` (Muted peach)

### Border
- HSL: `0, 0%, 10%` (Black borders)

---

# Typography

## Primary Font
- Font Family: Fredoka
- Classification: Sans-serif
- Source: Google Fonts

## Font Weights
- Regular — 400
- Medium — 500
- Bold — 700

## Heading Styles
- Uppercase
- Bold weight
- Includes subtle text shadow for emphasis and depth

## Body Text
- Normal case (sentence/title case as appropriate)
- Readable sizing optimized for clarity and accessibility

---

# Memphis Geometric Background

## Implementation
- Built as a React component
- Serves as a decorative background layer for the application

## Elements
- Total shapes: 15
- Randomly positioned across the viewport

## Shape Types
- Circles
- Triangles
- Rectangles
- Lines

## Color Usage
- Mint
- Lilac
- Soft yellow
- Dark grey

## Animations
- Floating motion effect
- Varying speeds per shape for visual dynamism

## Positioning
- Absolute positioning
- Fixed background layer

## Z-Index
- `-1` (behind all content)

## Shape Distribution
- **Circles:** 5 (sizes 40px → 120px)  
- **Triangles:** 4 (CSS borders technique)  
- **Rectangles:** 4 (rotated at various angles)  
- **Decorative Lines:** 2 (accent elements)

---

# Component Styling

## Memphis Card Style

**Base**
- Background: White
- Border: 3px solid black
- Border radius: 12px

**Shadow**
- `box-shadow: 6px 6px 0px black` (hard offset shadow)

**Interaction**
- Transition: Transform on hover
- Hover effect:
  - Slight lift (`translateY(-2px)`)

---

## Memphis Button Style

**Typography**
- Bold
- Uppercase text

**Base Styling**
- Border: 3px solid black
- Shadow: 4px 4px black offset

**Interactions**
- **Hover:** Shadow increases to `6px 6px`, enhanced depth
- **Active / Pressed:** Shadow reduces, slight translate to simulate press-in
