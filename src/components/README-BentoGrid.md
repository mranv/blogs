# BentoGrid Component

A beautiful, responsive bento grid component showcasing technology expertise with smooth animations and modern design.

## Features

- 🎨 **Modern Design**: Clean, card-based layout with hover effects
- 🎭 **Smooth Animations**: Framer Motion powered animations with staggered entrance
- 🎨 **Gradient Themes**: Custom gradient backgrounds for each technology
- 📱 **Responsive**: Works perfectly on all screen sizes
- 🏷️ **Tagged Content**: Technology tags for easy categorization
- ⚡ **Performance**: Optimized with proper React patterns

## Usage

### Basic Usage

```tsx
import BentoGrid from "@/components/BentoGrid";

export default function MyPage() {
  return (
    <div>
      <BentoGrid />
    </div>
  );
}
```

### With Custom Items

```tsx
import BentoGrid from "@/components/BentoGrid";
import { Shield, Cloud, GitBranch } from "lucide-react";

const customItems = [
  {
    title: "Custom Technology",
    description: "Your custom description here",
    icon: <Shield className="text-primary h-4 w-4" />,
    status: "New",
    tags: ["Custom", "Tech"],
    colSpan: 2,
    gradient: "from-blue-500/20 to-purple-500/20",
  },
  // ... more items
];

export default function MyPage() {
  return (
    <div>
      <BentoGrid items={customItems} />
    </div>
  );
}
```

### Using TechnologyShowcase Wrapper

```tsx
import TechnologyShowcase from "@/components/TechnologyShowcase";

export default function MyPage() {
  return (
    <div>
      <TechnologyShowcase
        title="Our Expertise"
        subtitle="Discover our cutting-edge technologies"
        showCTA={true}
      />
    </div>
  );
}
```

## Component Props

### BentoGrid Props

| Prop    | Type          | Default       | Description                          |
| ------- | ------------- | ------------- | ------------------------------------ |
| `items` | `BentoItem[]` | `itemsSample` | Array of technology items to display |

### BentoItem Interface

```tsx
interface BentoItem {
  title: string; // Technology name
  description: string; // Detailed description
  icon: React.ReactNode; // Lucide React icon
  status?: string; // Status badge (e.g., "Featured", "New")
  tags?: string[]; // Technology tags
  meta?: string; // Meta information
  cta?: string; // Call-to-action text
  colSpan?: number; // Grid column span (1 or 2)
  hasPersistentHover?: boolean; // Always show hover effects
  gradient?: string; // Tailwind gradient classes
}
```

### TechnologyShowcase Props

| Prop       | Type      | Default                        | Description                 |
| ---------- | --------- | ------------------------------ | --------------------------- |
| `title`    | `string`  | "Technology Expertise"         | Section title               |
| `subtitle` | `string`  | "Explore our comprehensive..." | Section subtitle            |
| `showCTA`  | `boolean` | `true`                         | Show call-to-action section |

## Available Technologies

The default showcase includes:

1. **Rust Security** - Memory-safe security tools
2. **Terraform IaC** - Infrastructure as Code
3. **DevOps Automation** - CI/CD pipelines
4. **Kubernetes Security** - Container security
5. **eBPF Monitoring** - Kernel-level monitoring
6. **Zero Trust Architecture** - Network security
7. **Post-Quantum Crypto** - Future-proof cryptography
8. **Confidential Computing** - Hardware-backed security

## Styling

The component uses your existing theme variables:

- `--background` - Background colors
- `--foreground` - Text colors
- `--primary` - Primary accent color
- `--secondary` - Secondary accent color
- `--muted` - Muted text colors
- `--card` - Card background colors

## Customization

### Adding New Technologies

1. Import the required Lucide React icon
2. Add a new item to the `itemsSample` array
3. Customize the gradient, tags, and description

### Modifying Gradients

Use Tailwind CSS gradient classes:

```tsx
gradient: "from-blue-500/20 to-purple-500/20"; // Blue to purple
gradient: "from-green-500/20 to-teal-500/20"; // Green to teal
gradient: "from-red-500/20 to-orange-500/20"; // Red to orange
```

### Custom Icons

Use any Lucide React icon:

```tsx
import { Shield, Cloud, GitBranch, Lock, Cpu, Server } from "lucide-react";

const icon = <Shield className="text-primary h-4 w-4" />;
```

## Demo Pages

- `/bento-demo` - Full demo page with the component
- Can be integrated into any existing page using the `TechnologyShowcase` wrapper

## Dependencies

- `framer-motion` - For animations
- `lucide-react` - For icons
- `@/components/ui/card` - Card components
- `@/lib/utils` - Utility functions (cn)

## Performance

- Uses React.memo for optimization
- Framer Motion animations are hardware accelerated
- Lazy loading of components with `client:load`
- Minimal re-renders with proper key props
