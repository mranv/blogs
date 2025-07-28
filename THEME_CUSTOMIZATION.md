# Corporate Theme Customization Guide

This document outlines the corporate theme implementation with shadcn/ui components for the blog.

## Overview

The UI has been transformed to have a professional, corporate-ready appearance using:
- **shadcn/ui** components for consistent, accessible UI elements
- **Professional blue color scheme** suitable for corporate environments
- **Modern glassmorphism effects** for a polished look
- **Full dark mode support** with carefully crafted color palettes

## Color Scheme

### Light Theme
```css
--color-accent: 37, 99, 235;        /* Professional blue */
--color-gradient-start: 37, 99, 235; /* Blue gradient start */
--color-gradient-end: 30, 64, 175;   /* Darker blue gradient end */
--primary: 217.2 91.2% 59.8%;        /* Primary brand color */
```

### Dark Theme
```css
--color-accent: 96, 165, 250;        /* Lighter blue for dark mode */
--color-gradient-start: 96, 165, 250; /* Light blue gradient */
--color-gradient-end: 59, 130, 246;  /* Medium blue gradient */
--primary: 217.2 91.2% 59.8%;        /* Consistent primary */
```

## Key Components Updated

### 1. Navigation Header
- Refined corporate styling with gradient logo
- Professional hover effects
- Smooth transitions and subtle animations

### 2. Blog Cards
- shadcn/ui Card components with glassmorphism
- Hover effects with elevation and glow
- Corporate blue accent colors

### 3. Buttons
- Added "corporate" variant to button component
- Professional gradient effects
- Consistent hover states

### 4. Theme Toggle
- Updated to use shadcn/ui Button component
- Ghost variant for subtle appearance
- Smooth icon transitions

## Customization Options

### Changing Brand Colors
Edit the CSS variables in `src/styles/base.css`:

```css
/* Light theme */
--color-accent: YOUR_R, YOUR_G, YOUR_B;
--primary: YOUR_HSL_VALUES;

/* Dark theme */
--color-accent: YOUR_R, YOUR_G, YOUR_B;
--primary: YOUR_HSL_VALUES;
```

### Adding New shadcn/ui Components
1. Install required Radix UI primitives:
   ```bash
   npm install @radix-ui/react-[component-name]
   ```

2. Create component in `src/components/ui/`:
   ```typescript
   import { cn } from "@utils/cn";
   // Component implementation
   ```

3. Use consistent styling patterns:
   - Use `cn()` utility for className merging
   - Apply theme CSS variables
   - Include hover/focus states

### Typography
The theme uses a professional font stack:
- **Sans-serif**: Inter (primary), system fonts (fallback)
- **Serif**: Charter, Georgia (for reading)
- **Monospace**: JetBrains Mono (for code)

### Responsive Design
All components are mobile-first with breakpoints at:
- `sm`: 640px and up
- Default styles apply to mobile

## Maintenance Tips

1. **Keep dependencies updated**: Regularly update shadcn/ui and Radix UI packages
2. **Test in both themes**: Always verify changes in light and dark modes
3. **Maintain consistency**: Use existing design tokens and patterns
4. **Accessibility**: shadcn/ui components include ARIA attributes by default

## Component Library

Installed shadcn/ui components:
- Button
- Card
- Badge
- Input
- Separator
- Dropdown Menu
- Navigation Menu
- Avatar
- Skeleton

Additional components can be added as needed using the shadcn/ui CLI or by manually creating them following the established patterns.