import { Github, Linkedin, Mail, Rss, Twitter } from "lucide-react";

const data = {
  facebookLink: "#",
  instaLink: "#",
  twitterLink: "https://twitter.com/yourusername",
  githubLink: "https://github.com/yourusername",
  linkedinLink: "https://linkedin.com/in/yourusername",
  navigation: {
    posts: "/posts/",
    tags: "/tags/",
    search: "/search/",
    about: "/about/",
  },
  categories: {
    security: "/tags/security/",
    ebpf: "/tags/ebpf/",
    rust: "/tags/rust/",
    kubernetes: "/tags/kubernetes/",
  },
  resources: {
    posts: "/posts/",
    tags: "/tags/",
    search: "/search/",
  },
  contact: {
    email: "iamanubhavgain@gmail.com",
    github: "https://github.com/mranv",
    twitter: "https://twitter.com/anubhavgain",
  },
  company: {
    name: "Anubhav Gain",
    description:
      "Exploring cybersecurity, eBPF, Rust, and modern security engineering. Deep technical insights on system security, observability, and cloud-native technologies.",
    logo: "/favicon.svg",
  },
};

const socialLinks = [
  { icon: Github, label: "GitHub", href: data.githubLink },
  { icon: Twitter, label: "Twitter", href: data.twitterLink },
  { icon: Linkedin, label: "LinkedIn", href: data.linkedinLink },
  { icon: Rss, label: "RSS Feed", href: "/rss.xml" },
];

const navigationLinks = [
  { text: "All Posts", href: data.navigation.posts },
  { text: "Browse Tags", href: data.navigation.tags },
  { text: "About", href: data.navigation.about },
  { text: "Search", href: data.navigation.search },
];

const categoryLinks = [
  { text: "Security", href: data.categories.security },
  { text: "eBPF", href: data.categories.ebpf },
  { text: "Rust", href: data.categories.rust },
  { text: "Kubernetes", href: data.categories.kubernetes },
];

const resourceLinks = [
  { text: "Latest Posts", href: data.resources.posts },
  { text: "Tag Cloud", href: data.resources.tags },
  { text: "Search Articles", href: data.resources.search },
];

const contactInfo = [
  {
    icon: Mail,
    text: data.contact.email,
    href: `mailto:${data.contact.email}`,
  },
  { icon: Github, text: "GitHub", href: data.contact.github },
  { icon: Twitter, text: "Twitter", href: data.contact.twitter },
];

export default function Footer4Col() {
  return (
    <footer className="bg-secondary dark:bg-secondary/20 mt-16 w-full place-self-end rounded-t-xl">
      <div className="w-full px-4 pt-16 pb-6 sm:px-6 lg:px-8 lg:pt-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div>
            <div className="text-primary flex justify-center gap-2 sm:justify-start">
              <img
                src={data.company.logo || "/favicon.svg"}
                alt="logo"
                className="h-8 w-8 rounded-full"
              />
              <span className="text-2xl font-semibold">
                {data.company.name}
              </span>
            </div>

            <p className="text-foreground/50 mt-6 max-w-md text-center leading-relaxed sm:max-w-xs sm:text-left">
              {data.company.description}
            </p>

            <ul className="mt-8 flex justify-center gap-6 sm:justify-start md:gap-8">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-primary hover:text-primary/80 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="sr-only">{label}</span>
                    <Icon className="size-6" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:col-span-2">
            <div className="text-center sm:text-left">
              <p className="text-lg font-medium text-foreground">Navigation</p>
              <ul className="mt-8 space-y-4 text-sm">
                {navigationLinks.map(({ text, href }) => (
                  <li key={text}>
                    <a
                      className="text-muted-foreground transition hover:text-foreground"
                      href={href}
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-lg font-medium text-foreground">Categories</p>
              <ul className="mt-8 space-y-4 text-sm">
                {categoryLinks.map(({ text, href }) => (
                  <li key={text}>
                    <a
                      className="text-muted-foreground transition hover:text-foreground"
                      href={href}
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-lg font-medium text-foreground">Resources</p>
              <ul className="mt-8 space-y-4 text-sm">
                {resourceLinks.map(({ text, href }) => (
                  <li key={text}>
                    <a
                      href={href}
                      className="text-muted-foreground transition hover:text-foreground"
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-lg font-medium text-foreground">Contact Us</p>
              <ul className="mt-8 space-y-4 text-sm">
                {contactInfo.map(({ icon: Icon, text, href }) => (
                  <li key={text}>
                    <a
                      className="flex items-center justify-center gap-1.5 sm:justify-start text-muted-foreground transition hover:text-foreground"
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon className="text-primary size-5 shrink-0" />
                      <span className="flex-1">{text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <div className="text-center sm:flex sm:justify-between sm:text-left">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {data.company.name}. All rights
              reserved.
            </p>

            <p className="text-muted-foreground mt-4 text-sm sm:mt-0">
              Built with <span className="text-primary">♥</span> using Astro &
              React
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
