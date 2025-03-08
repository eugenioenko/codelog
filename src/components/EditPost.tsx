
import { SITE } from "@config";
import { IconEdit } from "@tabler/icons-react";
import type { CollectionEntry } from "astro:content";
import LinkButton from "./LinkButton";

interface EditPostProps {
  editPost?: CollectionEntry<"blog">["data"]["editPost"];
  postId?: CollectionEntry<"blog">["id"];
}


export const EditPost = ({ editPost, postId }: EditPostProps) => {
  let editPostUrl = editPost?.url ?? SITE?.editPost?.url ?? "";
  const showEditPost = !editPost?.disabled && editPostUrl.length > 0;
  const appendFilePath =
    editPost?.appendFilePath ?? SITE?.editPost?.appendFilePath ?? false;
  if (appendFilePath && postId) {
    editPostUrl += `/${postId}`;
  }
  const editPostText = editPost?.text ?? SITE?.editPost?.text ?? "Edit";

  return (
    showEditPost && (
      <>
        <LinkButton
          className="hidden sm:flex items-center justify-center gap-1"
          href={editPostUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <IconEdit />
          <span className="text-sm italic">{editPostText}</span>
        </LinkButton>
      </>
    )
  );
};
