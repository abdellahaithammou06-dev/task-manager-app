const THEME_KEY = "task-manager-theme";

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
};

const getSavedTheme = () => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const updateThemeButton = (button, theme) => {
  if (!button) return;
  button.textContent = theme === "dark" ? "Mode clair" : "Mode sombre";
  button.setAttribute("aria-pressed", String(theme === "dark"));
};

const initThemeToggle = () => {
  const button = document.querySelector("#theme-toggle");
  let theme = getSavedTheme();

  applyTheme(theme);
  updateThemeButton(button, theme);

  if (!button) return;

  button.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    updateThemeButton(button, theme);
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  });
};

initThemeToggle();
