<template>
  <div class="login-container">
    <form @submit.prevent="handleLogin" class="login-form" aria-label="Login form">
      <h1>Task Collaboration Hub</h1>
      <h2>Sign In</h2>

      <div v-if="error" class="error-message" role="alert" aria-live="polite">
        {{ error }}
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          :aria-invalid="!!emailError"
          :aria-describedby="emailError ? 'email-error' : null"
          placeholder="Enter your email"
          class="form-input"
          @blur="validateEmail"
        />
        <span v-if="emailError" id="email-error" class="error-text" role="alert">
          {{ emailError }}
        </span>
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          :aria-invalid="!!passwordError"
          :aria-describedby="passwordError ? 'password-error' : null"
          placeholder="Enter your password"
          class="form-input"
          @blur="validatePassword"
        />
        <span v-if="passwordError" id="password-error" class="error-text" role="alert">
          {{ passwordError }}
        </span>
      </div>

      <button
        type="submit"
        :disabled="loading || !isFormValid"
        class="login-btn"
        aria-busy="loading"
      >
        <span v-if="loading">Logging in...</span>
        <span v-else>Sign In</span>
      </button>

      <div class="test-accounts">
        <p>Test Accounts:</p>
        <ul>
          <li>Viewer: viewer@example.com / viewer123</li>
          <li>Contributor: contributor@example.com / contributor123</li>
          <li>Moderator: moderator@example.com / moderator123</li>
        </ul>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth.js";

const router = useRouter();
const { login } = useAuth();

const email = ref("");
const password = ref("");
const emailError = ref("");
const passwordError = ref("");
const error = ref("");
const loading = ref(false);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isFormValid = computed(() => {
  return email.value && password.value && !emailError.value && !passwordError.value;
});

function validateEmail() {
  if (!email.value) {
    emailError.value = "Email is required";
  } else if (!emailRegex.test(email.value)) {
    emailError.value = "Invalid email format";
  } else {
    emailError.value = "";
  }
}

function validatePassword() {
  if (!password.value) {
    passwordError.value = "Password is required";
  } else if (password.value.length < 3) {
    passwordError.value = "Password must be at least 3 characters";
  } else {
    passwordError.value = "";
  }
}

async function handleLogin() {
  error.value = "";
  validateEmail();
  validatePassword();

  if (!isFormValid.value) {
    return;
  }

  loading.value = true;

  try {
    const result = await login(email.value, password.value);

    if (result.success) {
      router.push("/dashboard");
    } else {
      error.value = result.error || "Login failed. Please try again.";
    }
  } catch (err) {
    error.value = "An unexpected error occurred. Please try again.";
    console.error("Login error:", err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg-color, #f5f5f5);
}

.login-form {
  max-width: 400px;
  width: 100%;
  padding: 2rem;
  background: var(--card-bg, white);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.login-form h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: var(--text-color, #333);
}

.login-form h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  color: var(--text-color, #666);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 1rem;
  background: var(--input-bg, white);
  color: var(--text-color, #333);
}

.form-input:focus {
  outline: 2px solid var(--primary-color, #0066cc);
  outline-offset: 2px;
}

.form-input[aria-invalid="true"] {
  border-color: #c33;
}

.error-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #c33;
}

.error-message {
  padding: 0.75rem;
  margin-bottom: 1rem;
  background: #fee;
  color: #c33;
  border-radius: 4px;
  border: 1px solid #fcc;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: var(--primary-color, #0066cc);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.login-btn:hover:not(:disabled) {
  background: var(--primary-hover, #0052a3);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-btn:focus {
  outline: 2px solid var(--primary-color, #0066cc);
  outline-offset: 2px;
}

.test-accounts {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color, #ddd);
  font-size: 0.875rem;
  color: var(--text-color, #666);
}

.test-accounts p {
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.test-accounts ul {
  margin: 0;
  padding-left: 1.5rem;
}

.test-accounts li {
  margin: 0.25rem 0;
}

/* Dark theme */
:global(.dark) .login-container {
  background: #1a1a1a;
}

:global(.dark) .login-form {
  background: #2d2d2d;
  color: #e0e0e0;
}

:global(.dark) .form-input {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

:global(.dark) .test-accounts {
  border-top-color: #555;
}
</style>

