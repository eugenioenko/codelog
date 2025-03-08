import { IconChevronUp } from "@tabler/icons-react";

export default function BackToTop() {
  const backToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      className="focus-outline whitespace-nowrap py-1 hover:opacity-75 flex items-center gap-1"
      onClick={() => backToTop()}
    >
      <span>Back to Top</span>
      <IconChevronUp />
    </button>
  );
}
