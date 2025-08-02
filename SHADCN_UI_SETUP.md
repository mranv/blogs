# Install and configure shadcn/ui for Astro

This guide walks you through setting up shadcn/ui components in an Astro project with React and TailwindCSS.

## Prerequisites

- Astro project with TailwindCSS and React installed
- Node.js and npm/yarn/pnpm

## Create project

Start by creating a new Astro project:

```bash
npx create-astro@latest astro-app --template with-tailwindcss --install --add react --git
```

## Edit tsconfig.json file

Add the following code to the `tsconfig.json` file to resolve paths:

```json
{
  "compilerOptions": {
    // ...
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
    // ...
  }
}
```

## Run the CLI

Run the shadcn init command to setup your project:

```bash
npx shadcn@latest init
```

When prompted, configure your project with the following options:

- **Would you like to use TypeScript (recommended)?** → Yes
- **Which style would you like to use?** → Default
- **Which color would you like to use as base color?** → Slate
- **Where is your global CSS file?** → `src/styles/globals.css` (or your preferred location)
- **Would you like to use CSS variables for colors?** → Yes
- **Where is your tailwind.config.js located?** → `tailwind.config.cjs` or `tailwind.config.js`
- **Configure the import alias for components?** → `@/components`
- **Configure the import alias for utils?** → `@/lib/utils`

## Add Components

You can now start adding components to your project.

```bash
npx shadcn@latest add button
```

The command above will add the Button component to your project. You can then import it like this:

### Example: Using Button Component

Create or update `src/pages/index.astro`:

```astro
---
import { Button } from "@/components/ui/button"
---

<html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="generator" content={Astro.generator} />
        <title>Astro + shadcn/ui</title>
    </head>

    <body>
        <div class="grid place-items-center h-screen content-center">
            <Button>Click me</Button>
        </div>
    </body>
</html>
```

## Available Components

You can add more components as needed:

```bash
# Add multiple components at once
npx shadcn@latest add card dialog form input label

# Add individual components
npx shadcn@latest add alert
npx shadcn@latest add badge
npx shadcn@latest add dropdown-menu
npx shadcn@latest add navigation-menu
```

## Component Usage in Astro

Since Astro components are server-side rendered by default, interactive shadcn/ui components need to be wrapped with client directives:

```astro
---
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
---

<Dialog client:load>
    <DialogTrigger asChild>
        <Button>Open Dialog</Button>
    </DialogTrigger>
    <DialogContent>
        <p>This is a dialog content!</p>
    </DialogContent>
</Dialog>
```

### Client Directives

- `client:load` - Load and hydrate the component JavaScript immediately on page load
- `client:idle` - Load and hydrate after the page is done with its initial load
- `client:visible` - Load and hydrate once the component is visible
- `client:only="react"` - Skip server-side rendering entirely

## Customization

### Updating Theme Colors

You can customize the theme by modifying your CSS variables in your global CSS file:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* Add more custom colors */
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* Add more dark mode colors */
  }
}
```

### Component Variants

Many shadcn/ui components support variants. For example:

```astro
---
import { Button } from "@/components/ui/button"
---

<div class="space-x-4">
    <Button variant="default">Default</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
</div>
```

## Troubleshooting

### Path Resolution Issues

If you encounter import errors, ensure your `tsconfig.json` has the correct path mappings:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Styling Issues

Make sure your global CSS file is imported in your layout or pages:

```astro
---
import '@/styles/globals.css';
---
```

### TypeScript Errors

For TypeScript projects, you might need to add type definitions:

```bash
npm install -D @types/react @types/react-dom
```

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Astro Documentation](https://docs.astro.build/)
- [Component Examples](https://ui.shadcn.com/examples)

---

Last updated: January 2025