# Author Profile Components

A comprehensive set of React components for displaying author information with professional styling, animations, and cybersecurity-themed design.

## Components

### AuthorCard

Main author profile card with Avatar, bio, and social links.

```tsx
import {
  AuthorCard,
  defaultAuthorInfo,
  defaultAuthorStats,
} from "@/components/author";

<AuthorCard
  author={defaultAuthorInfo}
  stats={defaultAuthorStats}
  variant="default" // "default" | "compact" | "detailed"
  showSocials={true}
  showStats={true}
  showContact={true}
  className="max-w-md"
/>;
```

### AuthorBio

Compact author bio component for post headers/footers.

```tsx
import { AuthorBio, defaultAuthorInfo } from "@/components/author";

<AuthorBio
  author={defaultAuthorInfo}
  variant="full" // "inline" | "compact" | "full"
  showAvatar={true}
  maxBioLength={150}
  className="mb-8"
/>;
```

### AuthorHero

Large author profile component for about page enhancement.

```tsx
import {
  AuthorHero,
  defaultAuthorInfo,
  defaultAuthorStats,
} from "@/components/author";

<AuthorHero
  author={defaultAuthorInfo}
  stats={defaultAuthorStats}
  showBackground={true}
  ctaText="Let's Connect"
  onCtaClick={() => console.log("CTA clicked")}
  className="min-h-screen"
/>;
```

### AuthorContactCard

Contact-focused profile card with CTAs and social integration.

```tsx
import { AuthorContactCard, defaultAuthorInfo } from "@/components/author";

<AuthorContactCard
  author={defaultAuthorInfo}
  showEmail={true}
  showSocials={true}
  primaryCta={{
    text: "Schedule Consultation",
    href: "mailto:iamanubhavgain@gmail.com?subject=Consultation Request",
    variant: "default",
  }}
  secondaryCta={{
    text: "View Portfolio",
    href: "/portfolio",
    variant: "outline",
  }}
  className="max-w-md"
/>;
```

### AuthorStatsCard

Professional stats and achievements showcase.

```tsx
import { AuthorStatsCard, defaultAuthorStats } from "@/components/author";

<AuthorStatsCard
  stats={defaultAuthorStats}
  variant="grid" // "grid" | "horizontal" | "vertical"
  showIcons={true}
  animated={true}
  className="max-w-2xl"
/>;
```

## Usage Examples

### Complete About Page

```tsx
import {
  AuthorHero,
  AuthorStatsCard,
  AuthorContactCard,
  defaultAuthorInfo,
  defaultAuthorStats,
} from "@/components/author";

export default function AboutPage() {
  return (
    <div className="space-y-16">
      <AuthorHero
        author={defaultAuthorInfo}
        stats={defaultAuthorStats}
        showBackground={true}
      />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AuthorStatsCard
            stats={defaultAuthorStats}
            variant="vertical"
            animated={true}
          />

          <AuthorContactCard
            author={defaultAuthorInfo}
            primaryCta={{
              text: "Book Consultation",
              href: "mailto:iamanubhavgain@gmail.com",
              variant: "default",
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

### Blog Post Author Bio

```tsx
import { AuthorBio, defaultAuthorInfo } from "@/components/author";

export default function BlogPost() {
  return (
    <article>
      {/* Post content */}

      <footer className="mt-12 pt-8 border-t">
        <AuthorBio
          author={defaultAuthorInfo}
          variant="full"
          maxBioLength={200}
        />
      </footer>
    </article>
  );
}
```

### Sidebar Author Card

```tsx
import {
  AuthorCard,
  defaultAuthorInfo,
  defaultAuthorStats,
} from "@/components/author";

export default function Sidebar() {
  return (
    <aside className="space-y-6">
      <AuthorCard
        author={defaultAuthorInfo}
        stats={defaultAuthorStats}
        variant="compact"
        showStats={false}
      />
    </aside>
  );
}
```

## Customization

### Custom Author Data

```tsx
import { createAuthorInfo, createAuthorStats } from "@/components/author";

const customAuthor = createAuthorInfo({
  name: "Custom Name",
  title: "Custom Title",
  // Other overrides...
});

const customStats = createAuthorStats({
  experience: "10+",
  clients: 300,
  // Other overrides...
});
```

### Styling

All components accept a `className` prop for custom styling and are built with Tailwind CSS classes that respect your theme configuration.

## Features

- ✅ Responsive design for all screen sizes
- ✅ Dark/light mode support via CSS variables
- ✅ Hover animations and micro-interactions
- ✅ Professional cybersecurity-themed styling
- ✅ Social media integration with icons
- ✅ Animated counters for statistics
- ✅ Accessibility-friendly with proper ARIA labels
- ✅ TypeScript support with comprehensive types
- ✅ Configurable variants and display options
- ✅ Professional gradient effects and glassmorphism
- ✅ Contact CTAs optimized for lead generation

## Dependencies

These components require:

- React 18+
- Tailwind CSS
- shadcn/ui components (Avatar, Button, Card, Badge)
- AnimatedCounter component
- Social icons from assets/socialIcons.ts
