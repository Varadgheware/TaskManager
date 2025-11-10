<template>
  <main class="app-shell">
    <RouterView />
  </main>
</template>

<script setup>
import { onMounted } from "vue";
import { useTheme } from "./composables/useTheme.js";

const { applyTheme } = useTheme();

onMounted(() => {
  applyTheme();
});
</script>

<style>
:root {
  --bg-color: #f5f5f5;
  --card-bg: white;
  --text-color: #333;
  --border-color: #ddd;
  --input-bg: white;
  --primary-color: #0066cc;
  --primary-hover: #0052a3;
  --button-bg: white;
  --button-hover: #f0f0f0;
  --task-bg: #f9f9f9;
  --update-bg: #f0f0f0;
  --header-bg: white;
}

.dark {
  --bg-color: #1a1a1a;
  --card-bg: #2d2d2d;
  --text-color: #e0e0e0;
  --border-color: #555;
  --input-bg: #3a3a3a;
  --button-bg: #3a3a3a;
  --button-hover: #4a4a4a;
  --task-bg: #3a3a3a;
  --update-bg: #4a4a4a;
  --header-bg: #2d2d2d;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell,
    "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

button:focus,
input:focus,
textarea:focus,
select:focus {
  outline: 2px solid var(--primary-color, #0066cc);
  outline-offset: 2px;
}
</style>

