"use client";

import React, { useCallback } from "react";
import { useTheme } from "next-themes";

interface SparklesCoreProps {
  id?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleDensity?: number;
  className?: string;
  particleColor?: string;
}

export const SparklesCore: React.FC<SparklesCoreProps> = ({
  id = "tsparticles",
  background = "transparent",
  minSize = 0.6,
  maxSize = 1.4,
  particleDensity = 500,
  className = "",
  particleColor = "#e60a64",
}) => {
  const { theme } = useTheme();

  const particlesInit = useCallback(async (engine: any) => {
    const { loadFull } = await import("tsparticles");
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: any) => {
    // Optional: Add any logic when particles are loaded
  }, []);

  return (
    <div className={className}>
      <div
        id={id}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background,
          zIndex: 0,
        }}
      />
      <style jsx>{`
        #${id} {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: ${background};
          z-index: 0;
        }
      `}</style>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              import('tsparticles').then(async ({ tsParticles }) => {
                await tsParticles.load('${id}', {
                  particles: {
                    number: {
                      value: ${particleDensity},
                      density: {
                        enable: true,
                        value_area: 800
                      }
                    },
                    color: {
                      value: '${particleColor}'
                    },
                    shape: {
                      type: 'circle'
                    },
                    opacity: {
                      value: 0.5,
                      random: false,
                      anim: {
                        enable: false,
                        speed: 1,
                        opacity_min: 0.1,
                        sync: false
                      }
                    },
                    size: {
                      value: ${minSize},
                      random: true,
                      anim: {
                        enable: false,
                        speed: 40,
                        size_min: 0.1,
                        sync: false
                      }
                    },
                    line_linked: {
                      enable: false
                    },
                    move: {
                      enable: true,
                      speed: 2,
                      direction: 'none',
                      random: false,
                      straight: false,
                      out_mode: 'out',
                      bounce: false,
                      attract: {
                        enable: false,
                        rotateX: 600,
                        rotateY: 1200
                      }
                    }
                  },
                  interactivity: {
                    detect_on: 'canvas',
                    events: {
                      onhover: {
                        enable: true,
                        mode: 'repulse'
                      },
                      onclick: {
                        enable: true,
                        mode: 'push'
                      },
                      resize: true
                    },
                    modes: {
                      grab: {
                        distance: 400,
                        line_linked: {
                          opacity: 1
                        }
                      },
                      bubble: {
                        distance: 400,
                        size: 40,
                        duration: 2,
                        opacity: 8,
                        speed: 3
                      },
                      repulse: {
                        distance: 200,
                        duration: 0.4
                      },
                      push: {
                        particles_nb: 4
                      },
                      remove: {
                        particles_nb: 2
                      }
                    }
                  },
                  retina_detect: true
                });
              });
            }
          `,
        }}
      />
    </div>
  );
};
