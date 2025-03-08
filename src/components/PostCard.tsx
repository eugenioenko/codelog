import { slugifyStr } from "@utils/slugify";
import Datetime from "./Datetime";
import type { CollectionEntry } from "astro:content";

export interface Props {
  href?: string;
  frontmatter: CollectionEntry<"blog">["data"];
  secHeading?: boolean;
}

export default function PostCard({ href, frontmatter, secHeading = true }: Props) {
  const { title, pubDatetime, modDatetime, description } = frontmatter;

  const headerProps = {
    style: { viewTransitionName: slugifyStr(title) },
    className: "text-xl font-semibold hover:underline",
  };

  return (
    <li className="pb-6">
      <a
        href={href}
        className="text-theme-accent inline-block text-lg font-medium underline-offset-4 focus-visible:no-underline focus-visible:underline-offset-0"
      >
        {secHeading ? (
          <h2 {...headerProps}>{title}</h2>
        ) : (
          <h3 {...headerProps}>{title}</h3>
        )}
      </a>
      <div className="py-1">
      <Datetime pubDatetime={pubDatetime} modDatetime={modDatetime} />
      </div>
      <p>{description}</p>
    </li>
  );
}
