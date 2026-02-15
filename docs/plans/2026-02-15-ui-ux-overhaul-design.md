# NECTA RAG UI/UX Overhaul Design

**Date**: 2026-02-15
**Status**: Approved
**Goal**: Transition from a single-page landing to a dedicated multi-page layout with premium "WOW" factor animations and a high-end Tanzanian-themed aesthetic.

## 1. Overview
The current single-page design will be split into dedicated routes (`/`, `/about`, `/contact`) to allow for richer storytelling and improved user experience. The visual language centers on "Glassmorphism" and "Liquid Gradients" using the Tanzanian flag colors.

## 2. Component: The "Nebula" Header
### Visuals
- **Shape**: A floating "pill" design that transitions to a full-width bar on scroll.
- **Background**: `85%` opacity white (Light Mode) or dark charcoal (Dark Mode) with `20px` background blur.
- **Border**: A $1\text{px}$ `linear-gradient` border using `var(--tz-green)`, `var(--tz-gold)`, and `var(--tz-blue)`. 
- **Liquid Glow**: The border gradient will rotate $360^\circ$ over $10$ seconds using Framer Motion to create a moving glow.

### Behavior
- **Scroll Shrinking**: Header height reduces from $80\text{px}$ to $64\text{px}$ upon scroll.
- **Cursor Following**: Navigation links feature a "sliding pill" underline (active state) that moves smoothly between links.

## 3. Page: "Heritage & Innovation" (About Us)
### Structure
- **Chapter-based Scroll**: Content is organized into semantic vertical blocks.
- **Entrance Effects**: Text and images use "Staggered Slide" animations naturally revealing as they enter the viewport.
- **Problem-Solution Transition**: The initial section starts in muted/desaturated tones and transitions to vibrant Tanzanian colors as the solution (NECTA RAG) is presented.
- **Hover Micro-interactions**: Statistic cards scale and emit a soft glow when hovered.

## 4. Page: "Direct Path" (Contact Us)
### Structure
- **Staggered Form Field Reveal**: Inputs animate into view one after another.
- **Glassmorphic Card**: The form sits inside a large, high-radius glass card with a subtle $2\text{px}$ border.
- **Celebratory Success State**: Upon form submission, the submit button morphs into a success icon, triggering a "Green Ripple" animation that pulses across the entire card.

## 5. Technology Choices
- **Framer Motion**: For all scroll-triggered and liquid border animations.
- **Tailwind CSS**: For core styling and layout.
- **Next.js App Router**: For handling the new routes and page transitions.

## 6. Success Criteria
- Navigation between `/about`, `/contact`, and `/` is seamless.
- Header liquid glow is visible but not distracting.
- Scroll performance remains high (> 60fps).
