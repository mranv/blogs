"use client";

import BentoGrid from "./BentoGrid";

interface TechnologyShowcaseProps {
  title?: string;
  subtitle?: string;
  showCTA?: boolean;
}

export default function TechnologyShowcase({
  title = "Technology Expertise",
  subtitle = "Explore our comprehensive expertise in modern security, infrastructure, and DevOps technologies",
  showCTA = true,
}: TechnologyShowcaseProps) {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <BentoGrid />

        {showCTA && (
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Ready to Build Something Amazing?
            </h3>
            <p className="text-muted-foreground mb-6">
              Let's collaborate on your next security or infrastructure project
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/about"
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Learn More
              </a>
              <a
                href="/contact"
                className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors"
              >
                Get in Touch
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
