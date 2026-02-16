# Design: The Glass Horizon Header

A full-width, anchored header designed to provide stability and a premium feel while maintaining the NECTA RAG brand identity.

## Goals
- Replace the "floating pill" design with an anchored full-width header.
- Provide a clear visual hierarchy and "base" for the application.
- Incorporate subtle Tanzanian-themed micro-interactions and transitions.

## Proposed Changes

### Structure
- **Fixed Positioning**: The header will be fixed to the top (`fixed top-0 left-0 w-full`) and always visible.
- **Glassmorphism Base**: 
  - Background: `var(--background)/80` with `backdrop-filter: blur(20px)`.
  - Border: A 1px subtle bottom border that transitions states on scroll.

### Animations & Transitions
- **The Horizon Transition**: 
  - On scroll (> 20px), the header height will transition smoothly from `88px` to `64px`.
  - A 1px **Tanzanian flag gradient** (Green -> Gold -> Blue) will animate into view at the very bottom edge of the header.
- **Active Navigation**:
  - Uses Framer Motion's `layoutId` for a sliding under-glow effect between navigation items.
- **Branding**:
  - The logo container will scale slightly down and stay anchored to the left within the `max-w-7xl` centered container.

## Technical Details
- **Component**: `src/components/Header.tsx`
- **Styling**: `tailwind` + `framer-motion` for layout and state transitions.
- **CSS**: Custom keyframes for the gradient "horizon" line in `src/app/globals.css`.

## Verification Plan
1. **Visual Consistency**: Ensure the header spans the full width of the viewport on all screen sizes.
2. **Scroll Smoothness**: Verify that the height transition and gradient appearance are fluid (500ms duration).
3. **Mobile Layout**: Confirm the mobile menu (if applicable) or simplified header view works within the new structure.
