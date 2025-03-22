const currentTheme = localStorage.getItem("theme");

function getPreferTheme() {
  if (currentTheme) return currentTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

let themeValue = getPreferTheme();

function setPreference() {
  localStorage.setItem("theme", themeValue);
  reflectPreference();
}

function reflectPreference() {
  document.firstElementChild.setAttribute("data-theme", themeValue);
  document.querySelector("#theme-btn")?.setAttribute("aria-label", themeValue);
  if (document.body) {
    const computedStyles = window.getComputedStyle(document.body);
    const bgColor = computedStyles.backgroundColor;
    document
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", bgColor);
  }
}
reflectPreference();

function setThemeFeature() {
  reflectPreference();
  document.querySelector("#theme-btn")?.addEventListener("click", () => {
    themeValue = themeValue === "light" ? "dark" : "light";
    setPreference();
  });
}

function setMenuToggle() {
  const btn = document.getElementById("menu-btn");
  const menu = document.getElementById("menu");
  btn.addEventListener("click", () => {
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      btn.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
    } else {
      btn.setAttribute("aria-expanded", "true");
      menu.setAttribute("aria-hidden", "false");
    }
  });
}

window.onload = () => {
  setThemeFeature();
  setMenuToggle();
  document.addEventListener("astro:after-swap", setThemeFeature);
};

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", ({ matches: isDark }) => {
    themeValue = isDark ? "dark" : "light";
    setPreference();
  });
