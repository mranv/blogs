# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is Anubhav Gain's personal blog built with Astro, a modern static site generator. The blog focuses on DevSecOps, cyber security, and technical topics.

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:4321)
npm run dev

# Build for production (includes type checking and Jampack optimization)
npm run build

# Preview production build
npm run preview

# Format code with Prettier
npm run format

# Lint code with ESLint
npm run lint

# Check formatting without modifying files
npm run format:check

# Commit with Commitizen (standardized commit messages)
npm run cz
```

### Docker Development
```bash
# Run in containerized environment
docker-compose up
```

## Architecture Overview

### Technology Stack
- **Framework**: Astro 4.2.1 (static site generator)
- **UI Components**: React 18.2.0 for interactive elements
- **Styling**: TailwindCSS 3.4.1 with custom theme
- **Language**: TypeScript with path aliases configured
- **Search**: Fuse.js for client-side blog search
- **Build Optimization**: Jampack for post-build optimization

### Key Directories
- `src/content/blog/`: Markdown blog posts with frontmatter
- `src/components/`: Reusable Astro and React components
- `src/layouts/`: Page layout templates
- `src/pages/`: Route pages (Astro's file-based routing)
- `src/utils/`: Utility functions for common operations
- `public/`: Static assets (images, videos)

### Important Configuration Files
- `astro.config.ts`: Core Astro configuration with plugins
- `src/config.ts`: Site metadata, social links, and blog settings
- `tailwind.config.cjs`: Custom TailwindCSS theme configuration
- `tsconfig.json`: TypeScript config with path aliases (@components, @utils, etc.)

## Development Workflow

### Code Quality
- **Pre-commit hooks**: Husky runs lint-staged on git commits
- **Formatting**: Prettier with Astro and TailwindCSS plugins
- **Linting**: ESLint configured for JavaScript/TypeScript and Astro files
- **Type Checking**: Astro's built-in TypeScript validation

### Blog Content Management
- Blog posts are in `src/content/blog/` as Markdown files
- Frontmatter includes: title, author, pubDatetime, featured, draft, tags, description
- Table of contents is auto-generated with remark-toc
- Code blocks use one-dark-pro syntax highlighting

### Key Features to Maintain
1. **Dark/Light Mode**: Theme toggle functionality
2. **Search**: Client-side search with Fuse.js
3. **RSS Feed**: Automatic generation at /rss.xml
4. **Sitemap**: Automatic generation for SEO
5. **OG Images**: Dynamic generation for social sharing
6. **Pagination**: Configurable posts per page (default: 3)

## Common Development Tasks

### Adding a New Blog Post
1. Create a new `.md` file in `src/content/blog/`
2. Add required frontmatter (see existing posts for examples)
3. Write content in Markdown
4. Images go in `public/` directory

### Modifying Components
- Check existing components for patterns and conventions
- Use TypeScript interfaces for props
- Follow existing TailwindCSS class naming patterns
- Maintain dark mode support with appropriate classes

### Building for Production
The build process includes:
1. TypeScript type checking (`astro check`)
2. Astro build
3. Jampack optimization (minification, image optimization)

## Testing Approach
- No unit tests configured - rely on TypeScript and build-time checks
- Manual testing via development server
- Build validation ensures no broken links or missing assets

## Deployment
- Site is deployed to Cloudflare Pages at mranv.pages.dev
- Production builds should pass all type checks and linting