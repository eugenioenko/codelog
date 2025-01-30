import type { CollectionEntry } from "astro:content";

interface Props {
  prevPost: any;
  nextPost: any;
}

export default function PostFooter({ prevPost, nextPost }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {prevPost && (
        <a
          href={`/posts/${prevPost.slug}`}
          className="hover:text-theme-accent flex w-full items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left flex-none"
          >
            <>
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M15 6l-6 6l6 6" />
            </>
          </svg>
          <div>
            <span>Previous Post</span>
            <div className="text-theme-accent/85 text-sm">{prevPost.title}</div>
          </div>
        </a>
      )}
      {nextPost && (
        <a
          href={`/posts/${nextPost.slug}`}
          className="hover:text-theme-accent flex w-full items-center justify-end gap-1 text-right sm:col-start-2"
        >
          <div>
            <span>Next Post</span>
            <div className="text-theme-accent/85 text-sm">{nextPost.title}</div>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right flex-none"
          >
            <>
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M9 6l6 6l-6 6" />
            </>
          </svg>
        </a>
      )}
    </div>
  );
}
