---
name: Inter Fidelity Light System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d7dae3'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3fc'
  surface-container: '#ebedf7'
  surface-container-high: '#e6e8f1'
  surface-container-highest: '#e0e2eb'
  on-surface: '#181c22'
  on-surface-variant: '#414753'
  inverse-surface: '#2d3037'
  inverse-on-surface: '#eef0fa'
  outline: '#717785'
  outline-variant: '#c1c6d5'
  surface-tint: '#005db8'
  primary: '#005ab4'
  on-primary: '#ffffff'
  primary-container: '#0a73e0'
  on-primary-container: '#fefcff'
  inverse-primary: '#aac7ff'
  secondary: '#465f88'
  on-secondary: '#ffffff'
  secondary-container: '#b6d0ff'
  on-secondary-container: '#3f5881'
  tertiary: '#964400'
  on-tertiary: '#ffffff'
  tertiary-container: '#bd5700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#aac7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#00458d'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#aec7f7'
  on-secondary-fixed: '#001b3d'
  on-secondary-fixed-variant: '#2d476f'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68c'
  on-tertiary-fixed: '#321200'
  on-tertiary-fixed-variant: '#763400'
  background: '#f9f9ff'
  on-background: '#181c22'
  surface-variant: '#e0e2eb'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
---

# Design System Document

## Brand & Style
The design system adopts a clean, professional, and modern corporate aesthetic focused on clarity, reliability, and precision. It relies on the fidelity color variant to establish clear semantic relationships, utilizing an approachable yet serious tone suitable for enterprise applications, dashboards, and complex data-dense interfaces.

## Colors
The color palette is built on a light mode foundation using semantic derivation from a vibrant blue seed color (`#1978e5`). 
- **Primary (`#1275e2`)**: Main actions, active states, and key interactive elements.
- **Secondary (`#5f78a3`)**: Supporting UI components, secondary badges, and subtle structural highlights.
- **Tertiary (`#c55b00`)**: Accent tone for highlights and warnings.
- **Neutral (`#74777f`)**: Text, borders, and surface backgrounds.

## Typography
The system uses **Inter** exclusively across headlines, body copy, and labels for exceptional legibility and a modern geometric structure.

## Layout & Spacing
The layout uses a 12-column fluid grid system with a consistent 8pt-based spacing rhythm (16px gutters, 24px margins).

## Elevation & Depth
Elevation is conveyed through tonal layering, subtle low-contrast outlines, and soft, diffused ambient shadows for floating components.

## Shapes
The shape language uses a roundedness level of `2` (Rounded), featuring a 0.5rem base border radius for standard UI elements and larger radii for containers.

## Components
- **Buttons**: Rounded (`0.5rem`) with primary brand fills.
- **Chips**: Compact rounded elements for filters and tags.
- **Lists**: Clean vertical spacing with Inter typography.
- **Checkboxes & Radio Buttons**: High-contrast, accessible controls.
- **Input Fields**: Clear rounded borders with primary focus rings.
- **Cards**: Rounded surface containers with consistent internal padding.