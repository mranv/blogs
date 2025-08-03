"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import {
  Code,
  Cloud,
  Shield,
  Zap,
  Database,
  Network,
  Lock,
  Cpu,
  Server,
  GitBranch,
  Container,
  Monitor,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { motion } from "framer-motion";

interface BentoItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
  gradient?: string;
}

interface BentoGridProps {
  items?: BentoItem[];
}

const itemsSample: BentoItem[] = [
  {
    title: "Rust Security",
    meta: "Memory Safe",
    description:
      "Building production-grade security tools with Rust. From eBPF monitoring to post-quantum cryptography, leveraging Rust's memory safety and zero-cost abstractions for high-performance security applications.",
    icon: <Shield className="text-primary h-4 w-4" />,
    status: "Featured",
    tags: ["Memory Safety", "Performance", "Security"],
    colSpan: 2,
    hasPersistentHover: true,
    gradient: "from-primary/20 to-destructive/20",
  },
  {
    title: "Terraform IaC",
    meta: "Infrastructure as Code",
    description:
      "Modern infrastructure automation with Terraform. From multi-cloud deployments to Kubernetes orchestration, managing infrastructure with declarative configuration and version control.",
    icon: <Cloud className="text-primary h-4 w-4" />,
    status: "Essential",
    tags: ["IaC", "Multi-Cloud", "Automation"],
    gradient: "from-primary/20 to-chart-2/20",
  },
  {
    title: "DevOps Automation",
    description:
      "End-to-end CI/CD pipelines with comprehensive monitoring and observability. From GitOps workflows to automated security scanning and deployment strategies.",
    icon: <GitBranch className="text-primary h-4 w-4" />,
    status: "Popular",
    tags: ["CI/CD", "GitOps", "Monitoring"],
    gradient: "from-chart-3/20 to-chart-5/20",
  },
  {
    title: "Kubernetes Security",
    description:
      "Advanced Kubernetes security with operators, runtime protection, and zero-trust network policies. Implementing security at the cluster, pod, and container levels.",
    icon: <Container className="text-primary h-4 w-4" />,
    meta: "Production Ready",
    tags: ["K8s", "Security", "Operators"],
    gradient: "from-chart-3/20 to-primary/20",
  },
  {
    title: "eBPF Monitoring",
    description:
      "Kernel-level security monitoring with eBPF and Rust. Real-time threat detection, performance profiling, and network security using extended Berkeley Packet Filters.",
    icon: <Monitor className="text-primary h-4 w-4" />,
    meta: "Kernel Level",
    tags: ["eBPF", "Rust", "Monitoring"],
    gradient: "from-primary/20 to-chart-2/20",
  },
  {
    title: "Zero Trust Architecture",
    meta: "Never Trust, Always Verify",
    description:
      "Implementing zero trust network access with micro-segmentation, continuous authentication, and encrypted micro-tunnels. Building secure, scalable infrastructure.",
    icon: <Lock className="text-primary h-4 w-4" />,
    status: "Advanced",
    tags: ["Zero Trust", "Network", "Security"],
    colSpan: 2,
    gradient: "from-destructive/20 to-primary/20",
  },
  {
    title: "Post-Quantum Crypto",
    description:
      "Future-proof cryptography with ML-KEM and lattice-based algorithms. Implementing quantum-resistant encryption for long-term data protection.",
    icon: <Cpu className="text-primary h-4 w-4" />,
    meta: "Quantum Resistant",
    tags: ["PQC", "ML-KEM", "Cryptography"],
    gradient: "from-chart-1/20 to-primary/20",
  },
  {
    title: "Confidential Computing",
    description:
      "Hardware-backed security with Trusted Execution Environments. Secure enclaves for Intel SGX, AMD SEV, and ARM TrustZone with complete memory encryption.",
    icon: <Server className="text-primary h-4 w-4" />,
    status: "Cutting Edge",
    tags: ["TEE", "SGX", "Enclaves"],
    gradient: "from-chart-3/20 to-chart-5/20",
  },
];

export default function BentoGrid({ items = itemsSample }: BentoGridProps) {
  return (
    <section className="relative overflow-hidden py-12">
      {/* Decorative elements */}
      <div className="bg-primary/5 absolute top-20 -left-20 h-64 w-64 rounded-full blur-3xl" />
      <div className="bg-primary/5 absolute -right-20 bottom-20 h-64 w-64 rounded-full blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-4 p-4 md:grid-cols-3">
        {items.map((item, index) => (
          <motion.div
            key={`${item.title}-${item.status || item.meta}`}
            className={cn(
              item.colSpan || "col-span-1",
              item.colSpan === 2 ? "md:col-span-2" : ""
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Card
              className={cn(
                "group bg-card/40 relative h-full transition-all duration-300 hover:shadow-md",
                "will-change-transform hover:-translate-y-1",
                "border-border/60 overflow-hidden",
                {
                  "-translate-y-1 shadow-md": item.hasPersistentHover,
                }
              )}
            >
              {/* Gradient background */}
              {item.gradient && (
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    `bg-gradient-to-br ${item.gradient}`
                  )}
                />
              )}

              <div
                className={cn(
                  "absolute inset-0",
                  item.hasPersistentHover
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-300"
                )}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[length:4px_4px] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)]" />
              </div>

              <CardHeader className="relative space-y-0 p-4">
                <div className="flex items-center justify-between">
                  <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                    {item.icon}
                  </div>
                  <span className="bg-secondary text-secondary-foreground rounded-md px-2 py-1 text-xs font-medium">
                    {item.status || "Active"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-2 p-4 pt-0">
                <h3 className="text-foreground text-[15px] font-medium tracking-tight">
                  {item.title}
                  {item.meta && (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      {item.meta}
                    </span>
                  )}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </CardContent>

              <CardFooter className="relative p-4">
                <div className="flex w-full items-center justify-between">
                  <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
                    {item.tags?.map(tag => (
                      <span
                        key={`${item.title}-${tag}`}
                        className="bg-secondary/50 rounded-md px-2 py-1 backdrop-blur-xs transition-all duration-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-primary text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
                    {item.cta || "Explore →"}
                  </span>
                </div>
              </CardFooter>

              <div
                className={cn(
                  "via-primary/10 absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-transparent to-transparent p-px",
                  item.hasPersistentHover
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-300"
                )}
              />
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
