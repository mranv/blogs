import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://mranv.pages.dev/",
  author: "Anubhav Gain",
  desc: "Anubhav Gain is a leading DevSecOps Engineer and Cybersecurity expert specializing in Security Information and Event Management (SIEM), cloud security automation, threat detection, vulnerability management, DevSecOps practices, and security architecture. Expert insights on cybersecurity, Linux security, Rust programming, network security, and enterprise security solutions from an experienced professional.",
  title: "Anubhav Gain - DevSecOps Engineer & Cybersecurity Expert Blog",
  ogImage: "https://mranv.pages.dev/assets/forrest-gump-quote.webp",
  lightAndDarkMode: true,
  postPerPage: 3,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
};

export const LOCALE = {
  lang: "en", // html lang code. Set this empty and default will be "en"
  langTag: ["en-EN"], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;

export const LOGO_IMAGE = {
  enable: true,
  svg: true,
  width: 216,
  height: 46,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/mranv",
    linkTitle: `${SITE.title} on Github`,
    active: true,
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/mranv.1",
    linkTitle: `${SITE.title} on Facebook`,
    active: true,
  },
  {
    name: "Instagram",
    href: "https://instagram.com/anubhavgain",
    linkTitle: `${SITE.title} on Instagram`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/anubhavgain",
    linkTitle: `${SITE.title} on LinkedIn`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:iamanubhavgain@gmail.com",
    linkTitle: `Send an email to ${SITE.title}`,
    active: false,
  },
  {
    name: "Twitter",
    href: "https://twitter.com/AnubhavGain",
    linkTitle: `${SITE.title} on Twitter`,
    active: false,
  },
  // Other social media links...
];
