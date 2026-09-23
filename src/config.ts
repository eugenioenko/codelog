import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://eugene.yakhnenko.com",
  author: "Eugene Yakhnenko",
  profile: "https://github.com/eugenioenko/",
  desc: "Software engineering blog by Eugene Yakhnenko. Articles on frontend architecture, performance, developer tooling, and building things with TypeScript and Go.",
  title: "Eugene Yakhnenko",
  ogImage: "og.png",
  lightAndDarkMode: true,
  postPerIndex: 10,
  postPerPage: 10,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  editPost: {
    url: "https://github.com/eugenioenko/codelog/edit/main/src/content/blog",
    text: "Suggest Changes",
    appendFilePath: true,
  },
};

export const LOCALE = {
  lang: "en", // html lang code. Set this empty and default will be "en"
  langTag: ["en-EN"], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;

export const LOGO_IMAGE = {
  enable: true,
  svg: true,
  url: "logo.svg",
  width: 48,
  height: 48,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Github",
    href: "https://github.com/eugenioenko",
    linkTitle: `${SITE.author} on Github`,
    active: true,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/eugenioenko/",
    linkTitle: `${SITE.author} on Instagram`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/eyakhnenko/",
    linkTitle: `${SITE.author} on LinkedIn`,
    active: true,
  },
  {
    name: "Mail",
    href: "mailto:yevhen.yakhnenko@gmail.com",
    linkTitle: `Send an email to ${SITE.author}`,
    active: true,
  },
];
