import { ref, computed } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const token = ref(sessionStorage.getItem("token") || null);
const user = ref(
  sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user")) : null
);

const API_BASE = "/api";

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    if (token.value) {
      config.headers.Authorization = `Bearer ${token.value}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
    }
    return Promise.reject(error);
  }
);

export function useAuth() {
  const router = useRouter();

  const isAuthenticated = computed(() => !!token.value);

  async function login(email, password) {
    try {
      const response = await api.post("/login", { email, password });

      if (response.data.success) {
        token.value = response.data.token;
        user.value = response.data.user;

        // Store in sessionStorage
        sessionStorage.setItem("token", token.value);
        sessionStorage.setItem("user", JSON.stringify(user.value));

        return { success: true };
      } else {
        return { success: false, error: response.data.error || "Login failed" };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Login failed",
      };
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    router.push("/login");
  }

  function hasRole(role) {
    return user.value?.role === role;
  }

  function canCreateTasks() {
    return user.value?.role === "contributor" || user.value?.role === "moderator";
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    hasRole,
    canCreateTasks,
    api,
  };
}

