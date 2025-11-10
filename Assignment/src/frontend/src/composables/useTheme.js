import { ref, onMounted, watch } from "vue";

export function useTheme() {
  const isDark = ref(localStorage.getItem("theme") === "dark");

  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  onMounted(() => {
    applyTheme();
  });

  function toggleTheme() {
    isDark.value = !isDark.value;
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
    applyTheme();
  }

  watch(isDark, () => {
    applyTheme();
  });

  return {
    isDark,
    toggleTheme,
    applyTheme,
  };
}

