const THEME_OPTIONS = [
  { value: "auto", label: "Auto Mode" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" }
];

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode) {
  const nextTheme = mode === "auto" ? (systemPrefersDark() ? "dark" : "light") : mode;
  document.documentElement.setAttribute("data-theme", nextTheme);
}

function initializeThemeToggle() {
  const root = document.querySelector("[data-theme-toggle]");
  if (!root) return;

  const button = root.querySelector("[data-theme-button]");
  const current = root.querySelector("[data-theme-current]");
  const options = Array.from(root.querySelectorAll("[data-theme-option]"));
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  let selectedTheme = localStorage.getItem("themePreference") || "auto";

  function syncUI() {
    const selectedOption = THEME_OPTIONS.find((option) => option.value === selectedTheme) || THEME_OPTIONS[0];
    current.textContent = selectedOption.label;

    options.forEach((option) => {
      const isSelected = option.dataset.themeOption === selectedTheme;
      option.classList.toggle("is-selected", isSelected);
      option.setAttribute("aria-selected", String(isSelected));
      option.tabIndex = isSelected ? 0 : -1;
    });
  }

  function closeMenu() {
    root.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }

  function openMenu() {
    root.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
    const activeOption = options.find((option) => option.dataset.themeOption === selectedTheme) || options[0];
    activeOption.focus();
  }

  function setTheme(nextTheme) {
    selectedTheme = nextTheme;
    localStorage.setItem("themePreference", nextTheme);
    applyTheme(nextTheme);
    syncUI();
  }

  button.addEventListener("click", () => {
    if (root.classList.contains("is-open")) {
      closeMenu();
      return;
    }

    openMenu();
  });

  button.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu();
    }
  });

  options.forEach((option) => {
    option.addEventListener("click", () => {
      setTheme(option.dataset.themeOption);
      closeMenu();
      button.focus();
    });

    option.addEventListener("keydown", (event) => {
      const currentIndex = options.indexOf(option);

      if (event.key === "ArrowDown") {
        event.preventDefault();
        options[(currentIndex + 1) % options.length].focus();
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        options[(currentIndex - 1 + options.length) % options.length].focus();
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        button.focus();
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        option.click();
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!root.contains(event.target)) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  mediaQuery.addEventListener("change", () => {
    if (selectedTheme === "auto") {
      applyTheme("auto");
    }
  });

  applyTheme(selectedTheme);
  syncUI();
}

initializeThemeToggle();
