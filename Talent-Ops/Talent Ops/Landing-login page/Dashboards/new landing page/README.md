# Talent Ops Platform - Typography-First Landing Page

A museum-grade, typography-first landing page built with Next.js, React, TypeScript, and GSAP animations.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: GSAP + ScrollTrigger
- **Fonts**: Google Fonts (Playfair Display, Cormorant Garamond, Inter, Space Grotesk)

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
land2/
├── app/
│   ├── layout.tsx          # Root layout with font configuration
│   ├── page.tsx             # Main page component
│   └── globals.css          # Global styles and Tailwind directives
├── components/
│   ├── Navigation.tsx       # Fixed navigation bar
│   ├── CursorGlow.tsx       # Mouse-following glow effect
│   └── sections/
│       ├── HeroSection.tsx
│       ├── AlignmentSection.tsx
│       ├── PerformanceSection.tsx
│       ├── GrowthSection.tsx
│       ├── PeopleSection.tsx
│       ├── InsightSection.tsx
│       └── CTASection.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── postcss.config.js
```

## Features

### Typography System
- **Display**: Playfair Display (monumental headlines)
- **Elegant**: Cormorant Garamond (section titles, narrative)
- **Body**: Inter (descriptions, body copy)
- **Accent**: Space Grotesk (labels, stats, uppercase)

### Sections

1. **Hero** - Animated stacked typography with chromatic aberration
2. **Alignment** - Gradient text with hover weight shifts
3. **Performance** - Character stagger animation with stats
4. **Growth** - Vertical typography with cascading words
5. **People** - Circular rotating text with chromatic cards
6. **Insight** - Parallax background text with feature cards
7. **CTA** - Timeline animations with gradient button

### Animations

- GSAP timeline animations on page load
- ScrollTrigger for scroll-based reveals
- Chromatic aberration effects on hover
- Gradient text animations
- Character-by-character stagger
- Smooth transitions and micro-interactions

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Ink | `#0A0A0B` | Primary text, dark backgrounds |
| Paper | `#F8F7F4` | Light backgrounds |
| Accent Violet | `#7C3AED` | Primary accent, gradients |
| Accent Coral | `#F97066` | Warm highlights |
| Accent Gold | `#D4AF37` | Executive accents |

## License

Private project - All rights reserved
