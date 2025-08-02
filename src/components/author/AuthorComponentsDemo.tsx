import React from "react";
import {
  AuthorCard,
  AuthorBio,
  AuthorHero,
  AuthorContactCard,
  AuthorStatsCard,
  defaultAuthorInfo,
  defaultAuthorStats,
} from "./index";

/**
 * Demonstration component showcasing all author components
 * Useful for testing, development, and design review
 */
export default function AuthorComponentsDemo() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
          Author Hero Component
        </h2>
        <AuthorHero
          author={defaultAuthorInfo}
          stats={defaultAuthorStats}
          showBackground={true}
          ctaText="Get In Touch"
        />
      </section>

      <div className="container mx-auto px-4 space-y-16">
        {/* Author Cards Section */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
            Author Card Variants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">
                Compact
              </h3>
              <AuthorCard
                author={defaultAuthorInfo}
                stats={defaultAuthorStats}
                variant="compact"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">
                Default
              </h3>
              <AuthorCard
                author={defaultAuthorInfo}
                stats={defaultAuthorStats}
                variant="default"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">
                Detailed
              </h3>
              <AuthorCard
                author={defaultAuthorInfo}
                stats={defaultAuthorStats}
                variant="detailed"
              />
            </div>
          </div>
        </section>

        {/* Author Bio Section */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
            Author Bio Variants
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Inline</h3>
              <AuthorBio author={defaultAuthorInfo} variant="inline" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Compact</h3>
              <AuthorBio
                author={defaultAuthorInfo}
                variant="compact"
                maxBioLength={100}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Full</h3>
              <AuthorBio
                author={defaultAuthorInfo}
                variant="full"
                maxBioLength={200}
              />
            </div>
          </div>
        </section>

        {/* Stats Cards Section */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
            Author Stats Card Variants
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">
                Grid Layout
              </h3>
              <div className="flex justify-center">
                <AuthorStatsCard
                  stats={defaultAuthorStats}
                  variant="grid"
                  animated={true}
                  className="max-w-md"
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">
                Horizontal Layout
              </h3>
              <AuthorStatsCard
                stats={defaultAuthorStats}
                variant="horizontal"
                animated={true}
              />
            </div>
            <div className="flex justify-center">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-center">
                  Vertical Layout
                </h3>
                <AuthorStatsCard
                  stats={defaultAuthorStats}
                  variant="vertical"
                  animated={true}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Card Section */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
            Author Contact Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">
                Basic Contact
              </h3>
              <AuthorContactCard
                author={defaultAuthorInfo}
                showEmail={true}
                showSocials={true}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center">
                With Custom CTAs
              </h3>
              <AuthorContactCard
                author={defaultAuthorInfo}
                showEmail={true}
                showSocials={true}
                primaryCta={{
                  text: "Book Consultation",
                  href: `mailto:${defaultAuthorInfo.email}?subject=Consultation Booking`,
                  variant: "default",
                }}
                secondaryCta={{
                  text: "View Portfolio",
                  href: "/portfolio",
                  variant: "outline",
                }}
              />
            </div>
          </div>
        </section>

        {/* Real-world Usage Examples */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
            Real-world Usage Examples
          </h2>

          {/* Blog Post Footer Example */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-4">
              Blog Post Author Section
            </h3>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="prose prose-gray dark:prose-invert max-w-none mb-8">
                <p className="text-muted-foreground">
                  [End of blog post content...]
                </p>
              </div>
              <AuthorBio
                author={defaultAuthorInfo}
                variant="full"
                maxBioLength={180}
              />
            </div>
          </div>

          {/* Sidebar Example */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-4">
              Sidebar Author Widget
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 bg-card border border-border rounded-lg p-6">
                <h4 className="font-semibold mb-4">Main Content Area</h4>
                <p className="text-muted-foreground">
                  This would be your main content area with blog posts,
                  articles, or other content...
                </p>
              </div>
              <div className="lg:col-span-1">
                <h4 className="font-semibold mb-4">Sidebar</h4>
                <AuthorCard
                  author={defaultAuthorInfo}
                  stats={defaultAuthorStats}
                  variant="compact"
                  showStats={false}
                />
              </div>
            </div>
          </div>

          {/* Contact Page Example */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact Page Layout</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AuthorStatsCard
                stats={defaultAuthorStats}
                variant="vertical"
                animated={true}
              />
              <AuthorContactCard
                author={defaultAuthorInfo}
                primaryCta={{
                  text: "Schedule a Call",
                  href: "https://calendly.com/anubhavgain",
                  variant: "default",
                }}
                secondaryCta={{
                  text: "Send Message",
                  href: `mailto:${defaultAuthorInfo.email}`,
                  variant: "outline",
                }}
              />
            </div>
          </div>
        </section>

        {/* Component Features */}
        <section className="text-center py-16">
          <h2 className="text-3xl font-bold mb-8 text-foreground">
            Component Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Responsive Design</h3>
              <p className="text-sm text-muted-foreground">
                Optimized for all screen sizes and devices
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Theme Support</h3>
              <p className="text-sm text-muted-foreground">
                Dark and light mode with smooth transitions
              </p>
            </div>

            <div className="p-6 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Animated Elements</h3>
              <p className="text-sm text-muted-foreground">
                Smooth animations and micro-interactions
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
