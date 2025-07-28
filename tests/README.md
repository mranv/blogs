# UI Validation Tests

This directory contains comprehensive UI validation tests for the Astro blog platform, ensuring quality through visual regression, accessibility, responsive design, and component functionality testing.

## Setup

1. Install dependencies:
```bash
cd tests
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
# Visual regression tests
npm run test:visual

# Accessibility tests
npm run test:a11y

# Responsive design tests
npm run test:responsive

# Performance tests
npm run test:performance

# Component functionality tests
npm run test:components
```

### Interactive Mode
```bash
# Run tests with UI mode
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests
npm run test:debug
```

### Update Visual Snapshots
```bash
npm run test:update-snapshots
```

### View Test Report
```bash
npm run test:report
```

## Test Structure

```
tests/
├── e2e/
│   ├── visual-regression.spec.ts    # Visual comparison tests
│   ├── accessibility.spec.ts        # WCAG compliance tests
│   ├── responsive.spec.ts           # Multi-viewport tests
│   ├── performance.spec.ts          # Core Web Vitals tests
│   └── component-functionality.spec.ts # Interactive component tests
├── playwright.config.ts             # Playwright configuration
├── package.json                     # Test dependencies
└── README.md                        # This file
```

## Test Categories

### Visual Regression
- Homepage layouts (light/dark themes)
- Component hover states
- Navigation menus
- Blog post layouts
- Search interface
- Tag pages

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast
- Focus management
- ARIA implementation

### Responsive Design
- Mobile (375px)
- Tablet (768px)
- Desktop (1280px)
- Wide screen (1920px)
- Orientation changes
- Touch target sizes

### Performance
- Core Web Vitals (LCP, FID, CLS)
- JavaScript bundle size
- Image optimization
- Time to Interactive
- Memory usage
- Resource caching

### Component Functionality
- Header navigation
- Theme toggle persistence
- Search functionality
- Card interactions
- Pagination
- Tag navigation

## CI/CD Integration

For CI/CD pipelines, use:
```bash
npm run test:ci
```

This generates JUnit XML and HTML reports suitable for CI systems.

## Additional Tools

### Lighthouse
```bash
npm run lighthouse
```
Generates a Lighthouse report for performance, accessibility, and best practices.

### Axe CLI
```bash
npm run axe
```
Runs accessibility audit using axe-core CLI.

## Best Practices

1. **Run tests locally** before pushing changes
2. **Update snapshots** only when visual changes are intentional
3. **Fix accessibility issues** immediately - they block the pipeline
4. **Monitor performance** metrics to prevent regressions
5. **Test on real devices** periodically for accurate mobile testing

## Troubleshooting

### Tests fail on CI but pass locally
- Check viewport sizes match CI environment
- Ensure fonts are loaded consistently
- Verify animations are disabled for visual tests

### Visual snapshots don't match
- Update snapshots if changes are intentional
- Check for dynamic content (dates, random data)
- Ensure consistent theme state

### Performance tests are flaky
- Increase timeout thresholds
- Run in isolation from other tests
- Use consistent network conditions

## Reporting Issues

When reporting test failures:
1. Include the full error message
2. Attach screenshots from test results
3. Specify browser and viewport
4. Note if it's consistent or intermittent