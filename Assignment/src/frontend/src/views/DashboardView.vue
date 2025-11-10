<template>
  <div class="dashboard-container">
    <header class="dashboard-header" role="banner">
      <h1>Task Collaboration Hub</h1>
      <div class="header-actions">
        <span class="user-info" aria-label="Current user">
          {{ user?.email }} ({{ user?.role }})
        </span>
        <button
          @click="toggleTheme"
          class="theme-toggle"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          :title="isDark ? 'Light mode' : 'Dark mode'"
        >
          {{ isDark ? "☀️" : "🌙" }}
        </button>
        <button @click="handleLogout" class="logout-btn" aria-label="Logout">
          Logout
        </button>
      </div>
    </header>

    <main class="dashboard-main" role="main">
      <div v-if="loading && tasks.length === 0" class="loading" role="status" aria-live="polite">
        Loading tasks...
      </div>

      <div v-else-if="error" class="error-message" role="alert" aria-live="polite">
        {{ error }}
        <button @click="fetchTasks" class="retry-btn">Retry</button>
      </div>

      <div v-else>
        <!-- Create Task Form (Contributors & Moderators) -->
        <section v-if="canCreateTasks" class="create-task-section" aria-labelledby="create-task-title">
          <h2 id="create-task-title">Create New Task</h2>
          <form @submit.prevent="handleCreateTask" class="create-task-form">
            <div class="form-row">
              <input
                v-model="newTask.title"
                type="text"
                placeholder="Task title"
                required
                class="task-input"
                aria-label="Task title"
                @keydown.esc="cancelCreateTask"
              />
              <select
                v-model="newTask.status"
                class="status-select"
                aria-label="Task status"
              >
                <option value="to do">To Do</option>
                <option value="in progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <button
                type="submit"
                :disabled="creatingTask"
                class="create-btn"
                aria-busy="creatingTask"
              >
                {{ creatingTask ? "Creating..." : "Create Task" }}
              </button>
              <button
                v-if="newTask.title"
                type="button"
                @click="cancelCreateTask"
                class="cancel-btn"
                aria-label="Cancel"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>

        <!-- Task Board -->
        <section class="task-board" aria-label="Task board">
          <div class="task-columns">
            <!-- To Do Column -->
            <div class="task-column" aria-label="To do tasks">
              <h3 class="column-header">
                To Do
                <span class="task-count">({{ tasksByStatus['to do']?.length || 0 }})</span>
              </h3>
              <div class="task-list" role="list">
                <div
                  v-for="task in tasksByStatus['to do']"
                  :key="task.id"
                  class="task-card"
                  role="listitem"
                  :aria-label="`Task: ${task.title}`"
                >
                  <div class="task-header">
                    <h4 class="task-title">{{ task.title }}</h4>
                  </div>
                  <div class="task-meta">
                    <span class="task-creator">Creator: {{ task.creator_email }}</span>
                    <span v-if="task.assignee_email" class="task-assignee">
                      Assignee: {{ task.assignee_email }}
                    </span>
                  </div>
                  <div v-if="task.last_update" class="task-update">
                    <strong>Last update:</strong> {{ task.last_update.message }}
                    <span class="update-author">by {{ task.last_update.author_email }}</span>
                  </div>
                  <div class="task-actions">
                    <button
                      @click="openUpdateModal(task)"
                      class="update-btn"
                      aria-label="Add update to task"
                    >
                      Add Update
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- In Progress Column -->
            <div class="task-column" aria-label="In progress tasks">
              <h3 class="column-header">
                In Progress
                <span class="task-count">({{ tasksByStatus['in progress']?.length || 0 }})</span>
              </h3>
              <div class="task-list" role="list">
                <div
                  v-for="task in tasksByStatus['in progress']"
                  :key="task.id"
                  class="task-card"
                  role="listitem"
                  :aria-label="`Task: ${task.title}`"
                >
                  <div class="task-header">
                    <h4 class="task-title">{{ task.title }}</h4>
                  </div>
                  <div class="task-meta">
                    <span class="task-creator">Creator: {{ task.creator_email }}</span>
                    <span v-if="task.assignee_email" class="task-assignee">
                      Assignee: {{ task.assignee_email }}
                    </span>
                  </div>
                  <div v-if="task.last_update" class="task-update">
                    <strong>Last update:</strong> {{ task.last_update.message }}
                    <span class="update-author">by {{ task.last_update.author_email }}</span>
                  </div>
                  <div class="task-actions">
                    <button
                      @click="openUpdateModal(task)"
                      class="update-btn"
                      aria-label="Add update to task"
                    >
                      Add Update
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Done Column -->
            <div class="task-column" aria-label="Done tasks">
              <h3 class="column-header">
                Done
                <span class="task-count">({{ tasksByStatus.done?.length || 0 }})</span>
              </h3>
              <div class="task-list" role="list">
                <div
                  v-for="task in tasksByStatus.done"
                  :key="task.id"
                  class="task-card"
                  role="listitem"
                  :aria-label="`Task: ${task.title}`"
                >
                  <div class="task-header">
                    <h4 class="task-title">{{ task.title }}</h4>
                  </div>
                  <div class="task-meta">
                    <span class="task-creator">Creator: {{ task.creator_email }}</span>
                    <span v-if="task.assignee_email" class="task-assignee">
                      Assignee: {{ task.assignee_email }}
                    </span>
                  </div>
                  <div v-if="task.last_update" class="task-update">
                    <strong>Last update:</strong> {{ task.last_update.message }}
                    <span class="update-author">by {{ task.last_update.author_email }}</span>
                  </div>
                  <div class="task-actions">
                    <button
                      @click="openUpdateModal(task)"
                      class="update-btn"
                      aria-label="Add update to task"
                    >
                      Add Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Update Modal -->
    <div
      v-if="showUpdateModal"
      class="modal-overlay"
      role="dialog"
      aria-labelledby="update-modal-title"
      aria-modal="true"
      @click.self="closeUpdateModal"
      @keydown.esc="closeUpdateModal"
    >
      <div class="modal-content">
        <h2 id="update-modal-title">Add Update to Task</h2>
        <p class="modal-task-title">{{ selectedTask?.title }}</p>
        <form @submit.prevent="handleAddUpdate">
          <textarea
            v-model="newUpdate.message"
            placeholder="Enter your update message"
            required
            class="update-textarea"
            aria-label="Update message"
            rows="4"
          ></textarea>
          <div class="modal-actions">
            <button type="submit" :disabled="addingUpdate" class="submit-btn">
              {{ addingUpdate ? "Adding..." : "Add Update" }}
            </button>
            <button type="button" @click="closeUpdateModal" class="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth.js";
import { useTheme } from "../composables/useTheme.js";

const router = useRouter();
const { user, logout: authLogout, canCreateTasks, api } = useAuth();
const { isDark, toggleTheme } = useTheme();

const tasks = ref([]);
const loading = ref(false);
const error = ref("");
const creatingTask = ref(false);
const addingUpdate = ref(false);
const showUpdateModal = ref(false);
const selectedTask = ref(null);

const newTask = ref({
  title: "",
  status: "to do",
});

const newUpdate = ref({
  message: "",
});

// Group tasks by status
const tasksByStatus = computed(() => {
  const grouped = {
    "to do": [],
    "in progress": [],
    done: [],
  };

  tasks.value.forEach((task) => {
    if (grouped[task.status]) {
      grouped[task.status].push(task);
    }
  });

  return grouped;
});

// Fetch tasks from API
async function fetchTasks() {
  loading.value = true;
  error.value = "";

  try {
    const response = await api.get("/tasks");
    if (response.data.success) {
      tasks.value = response.data.data;
    } else {
      error.value = "Failed to fetch tasks";
    }
  } catch (err) {
    error.value =
      err.response?.data?.error || err.message || "Failed to fetch tasks. Please try again.";
    console.error("Error fetching tasks:", err);
  } finally {
    loading.value = false;
  }
}

// Create new task (optimistic update)
async function handleCreateTask() {
  if (!newTask.value.title.trim()) return;

  const optimisticTask = {
    id: `temp-${Date.now()}`,
    title: newTask.value.title,
    status: newTask.value.status,
    creator_id: user.value.id,
    creator_email: user.value.email,
    assignee_id: null,
    assignee_email: null,
    updates: [],
    last_update: null,
    created_at: new Date().toISOString(),
  };

  // Optimistic update
  tasks.value.push(optimisticTask);
  creatingTask.value = true;

  const title = newTask.value.title;
  const status = newTask.value.status;

  // Reset form
  newTask.value = { title: "", status: "to do" };

  try {
    const response = await api.post("/tasks", { title, status });

    if (response.data.success) {
      // Replace optimistic task with real task
      const index = tasks.value.findIndex((t) => t.id === optimisticTask.id);
      if (index !== -1) {
        tasks.value[index] = {
          ...response.data.data,
          creator_email: user.value.email,
          assignee_email: null,
          updates: [],
          last_update: null,
        };
      }
    } else {
      throw new Error("Failed to create task");
    }
  } catch (err) {
    // Rollback optimistic update
    const index = tasks.value.findIndex((t) => t.id === optimisticTask.id);
    if (index !== -1) {
      tasks.value.splice(index, 1);
    }
    error.value =
      err.response?.data?.error || err.message || "Failed to create task. Please try again.";
    console.error("Error creating task:", err);
  } finally {
    creatingTask.value = false;
  }
}

function cancelCreateTask() {
  newTask.value = { title: "", status: "to do" };
}

// Add update to task (optimistic update)
function openUpdateModal(task) {
  selectedTask.value = task;
  newUpdate.value.message = "";
  showUpdateModal.value = true;
}

function closeUpdateModal() {
  showUpdateModal.value = false;
  selectedTask.value = null;
  newUpdate.value.message = "";
}

async function handleAddUpdate() {
  if (!newUpdate.value.message.trim() || !selectedTask.value) return;

  const task = selectedTask.value;
  const message = newUpdate.value.message;

  const optimisticUpdate = {
    id: `temp-${Date.now()}`,
    task_id: task.id,
    author_id: user.value.id,
    author_email: user.value.email,
    message: message,
    created_at: new Date().toISOString(),
  };

  // Optimistic update
  const taskIndex = tasks.value.findIndex((t) => t.id === task.id);
  if (taskIndex !== -1) {
    if (!tasks.value[taskIndex].updates) {
      tasks.value[taskIndex].updates = [];
    }
    tasks.value[taskIndex].updates.unshift(optimisticUpdate);
    tasks.value[taskIndex].last_update = optimisticUpdate;
  }

  addingUpdate.value = true;
  const originalMessage = newUpdate.value.message;
  newUpdate.value.message = "";

  try {
    const response = await api.post("/updates", {
      task_id: task.id,
      message: originalMessage,
    });

    if (response.data.success) {
      // Replace optimistic update with real update
      if (taskIndex !== -1) {
        const updateIndex = tasks.value[taskIndex].updates.findIndex(
          (u) => u.id === optimisticUpdate.id
        );
        if (updateIndex !== -1) {
          tasks.value[taskIndex].updates[updateIndex] = response.data.data;
          tasks.value[taskIndex].last_update = response.data.data;
        }
      }
      closeUpdateModal();
    } else {
      throw new Error("Failed to add update");
    }
  } catch (err) {
    // Rollback optimistic update
    if (taskIndex !== -1) {
      const updateIndex = tasks.value[taskIndex].updates.findIndex(
        (u) => u.id === optimisticUpdate.id
      );
      if (updateIndex !== -1) {
        tasks.value[taskIndex].updates.splice(updateIndex, 1);
        // Restore previous last update
        if (tasks.value[taskIndex].updates.length > 0) {
          tasks.value[taskIndex].last_update = tasks.value[taskIndex].updates[0];
        } else {
          tasks.value[taskIndex].last_update = null;
        }
      }
    }
    error.value =
      err.response?.data?.error || err.message || "Failed to add update. Please try again.";
    console.error("Error adding update:", err);
    newUpdate.value.message = originalMessage;
  } finally {
    addingUpdate.value = false;
  }
}

function handleLogout() {
  authLogout();
}

// Keyboard shortcuts
function handleKeydown(e) {
  if (e.key === "Escape" && showUpdateModal.value) {
    closeUpdateModal();
  }
}

onMounted(() => {
  fetchTasks();
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: var(--bg-color, #f5f5f5);
  color: var(--text-color, #333);
}

.dashboard-header {
  background: var(--header-bg, white);
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color, #333);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  font-size: 0.875rem;
  color: var(--text-color, #666);
}

.theme-toggle,
.logout-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  background: var(--button-bg, white);
  color: var(--text-color, #333);
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.theme-toggle:hover,
.logout-btn:hover {
  background: var(--button-hover, #f0f0f0);
}

.theme-toggle:focus,
.logout-btn:focus {
  outline: 2px solid var(--primary-color, #0066cc);
  outline-offset: 2px;
}

.dashboard-main {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.loading,
.error-message {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.error-message {
  background: #fee;
  color: #c33;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.retry-btn {
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  background: #c33;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.create-task-section {
  background: var(--card-bg, white);
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.create-task-section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.task-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 1rem;
}

.status-select {
  padding: 0.75rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 1rem;
  background: var(--input-bg, white);
  color: var(--text-color, #333);
}

.create-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.create-btn {
  background: var(--primary-color, #0066cc);
  color: white;
}

.create-btn:hover:not(:disabled) {
  background: var(--primary-hover, #0052a3);
}

.create-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  background: var(--button-bg, #f0f0f0);
  color: var(--text-color, #333);
}

.task-board {
  margin-top: 2rem;
}

.task-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.task-column {
  background: var(--card-bg, white);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.column-header {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: var(--text-color, #333);
  border-bottom: 2px solid var(--border-color, #ddd);
  padding-bottom: 0.5rem;
}

.task-count {
  font-weight: normal;
  color: var(--text-color, #666);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-card {
  background: var(--task-bg, #f9f9f9);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  padding: 1rem;
  transition: box-shadow 0.2s;
}

.task-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.task-title {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color, #333);
}

.task-meta {
  font-size: 0.875rem;
  color: var(--text-color, #666);
  margin-bottom: 0.5rem;
}

.task-meta span {
  display: block;
  margin: 0.25rem 0;
}

.task-update {
  font-size: 0.875rem;
  color: var(--text-color, #666);
  margin: 0.5rem 0;
  padding: 0.5rem;
  background: var(--update-bg, #f0f0f0);
  border-radius: 4px;
}

.update-author {
  display: block;
  margin-top: 0.25rem;
  font-style: italic;
}

.task-actions {
  margin-top: 0.75rem;
}

.update-btn {
  padding: 0.5rem 1rem;
  background: var(--primary-color, #0066cc);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.update-btn:hover {
  background: var(--primary-hover, #0052a3);
}

.update-btn:focus {
  outline: 2px solid var(--primary-color, #0066cc);
  outline-offset: 2px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card-bg, white);
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.modal-content h2 {
  margin: 0 0 0.5rem 0;
}

.modal-task-title {
  margin: 0 0 1rem 0;
  font-weight: 600;
  color: var(--text-color, #666);
}

.update-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color, #0066cc);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn:hover:not(:disabled) {
  background: var(--primary-hover, #0052a3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Dark theme */
:global(.dark) .dashboard-container {
  background: #1a1a1a;
  color: #e0e0e0;
}

:global(.dark) .dashboard-header {
  background: #2d2d2d;
}

:global(.dark) .create-task-section,
:global(.dark) .task-column,
:global(.dark) .modal-content {
  background: #2d2d2d;
}

:global(.dark) .task-card {
  background: #3a3a3a;
  border-color: #555;
}

:global(.dark) .task-input,
:global(.dark) .status-select,
:global(.dark) .update-textarea {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

:global(.dark) .theme-toggle,
:global(.dark) .logout-btn,
:global(.dark) .cancel-btn {
  background: #3a3a3a;
  border-color: #555;
  color: #e0e0e0;
}

/* Responsive */
@media (max-width: 768px) {
  .task-columns {
    grid-template-columns: 1fr;
  }

  .form-row {
    flex-direction: column;
  }

  .header-actions {
    flex-wrap: wrap;
  }
}
</style>
