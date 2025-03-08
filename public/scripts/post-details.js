/** Create a progress indicator at the top */
function createProgressBar() {
  const progressContainer = document.createElement("div");
  progressContainer.className = "progress-container ";
  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";
  progressBar.id = "myBar";
  progressContainer.appendChild(progressBar);
  document.body.appendChild(progressContainer);
}
createProgressBar();

/** Update the progress bar  when user scrolls */
function updateScrollProgress() {
  document.addEventListener("scroll", () => {
    const winScroll =
      document.body.scrollTop || document.documentElement.scrollTop;
    const height =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    if (document) {
      const myBar = document.getElementById("myBar");
      if (myBar) {
        myBar.style.width = scrolled + "%";
      }
    }
  });
}
updateScrollProgress();

/** Attaches links to headings in the document, allowing sharing of sections easily */
function addHeadingLinks() {
  const headings = Array.from(document.querySelectorAll("h2, h3, h4, h5, h6"));
  for (const heading of headings) {
    heading.classList.add("group");
    const link = document.createElement("a");
    link.className = "heading-link";
    link.href = "#" + heading.id;

    const span = document.createElement("span");
    span.ariaHidden = "true";
    span.innerText = "#";
    link.appendChild(span);
    heading.appendChild(link);
  }
}
addHeadingLinks();

/** Attaches copy buttons to code blocks in the document, allowing users to copy code easily. */
function attachCopyButtons() {
  const copyButtonLabel = "Copy";
  const codeBlocks = Array.from(document.querySelectorAll("pre"));

  for (const codeBlock of codeBlocks) {
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    const copyButton = document.createElement("button");
    copyButton.className = "copy-code";
    copyButton.innerHTML = copyButtonLabel;
    codeBlock.setAttribute("tabindex", "0");
    codeBlock.appendChild(copyButton);
    codeBlock?.parentNode?.insertBefore(wrapper, codeBlock);
    wrapper.appendChild(codeBlock);
    copyButton.addEventListener("click", async () => {
      await copyCode(codeBlock, copyButton);
    });
  }

  async function copyCode(block, button) {
    const code = block.querySelector("code");
    const text = code?.innerText;
    await navigator.clipboard.writeText(text ?? "");
    button.innerText = "Copied";
    setTimeout(() => {
      button.innerText = copyButtonLabel;
    }, 450);
  }
}
attachCopyButtons();

/* Go to page start after page swap */
document.addEventListener("astro:after-swap", () =>
  window.scrollTo({ left: 0, top: 0, behavior: "instant" })
);
