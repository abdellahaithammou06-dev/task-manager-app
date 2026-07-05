const API_URL = "/api/tasks";
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");
let editingTaskId = null;
let currentTasks = [];

if (!token) {
  window.location.href = "/login";
}

const searchInput = document.querySelector("#search");
const statusFilter = document.querySelector("#status-filter");
const priorityFilter = document.querySelector("#priority-filter");
const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#title");
const descriptionInput = document.querySelector("#description");
const priorityInput = document.querySelector("#priority");
const deadlineInput = document.querySelector("#deadline");
const submitButton = document.querySelector("#submit-button");
const cancelEditButton = document.querySelector("#cancel-edit");
const taskList = document.querySelector("#task-list");
const message = document.querySelector("#message");
const statElements = {
  total: document.querySelector("#stat-total"),
  completed: document.querySelector("#stat-completed"),
  pending: document.querySelector("#stat-pending"),
  overdue: document.querySelector("#stat-overdue"),
};

const initUserAvatar = (user) => {
  const avatar = document.querySelector("#user-avatar");
  const nameEl = document.querySelector("#avatar-name");
  if (!avatar || !user) return;

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const palette = ["#28715c","#b53b3b","#3467b5","#c97f2c","#7b4fa2","#2d7d8a","#c0395a","#3a8c6a"];
  const hash = user.name.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  avatar.style.background = palette[hash % palette.length];
  avatar.textContent = initials || "?";
  if (nameEl) nameEl.textContent = user.name;
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

if (user) {
  initUserAvatar(user);
  const userName = document.querySelector("#avatar-name");
  if (userName) userName.textContent = user.name;
  const dn = document.querySelector("#dropdown-name");
  const de = document.querySelector("#dropdown-email");
  if (dn) dn.textContent = user.name;
  if (de) de.textContent = user.email;
}

const userBtn = document.querySelector("#user-btn");
const dropdown = document.querySelector("#user-dropdown");

if (userBtn && dropdown) {
  userBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });
  document.addEventListener("click", () => dropdown.classList.remove("open"), { passive: true });
}

const dl = document.querySelector("#dropdown-logout");
if (dl) dl.addEventListener("click", logout);

const setMessage = (text, type = "") => {
  message.textContent = text;
  message.className = `message ${type}`.trim();
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return null;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Erreur API");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const formatDate = (value) => {
  if (!value) return "Aucune";
  return new Date(value).toLocaleDateString("fr-FR");
};

const normalizeDateInput = (value) => {
  if (!value) return "";
  return String(value).slice(0, 10);
};

const priorityLabel = (priority) => {
  const labels = { low: "Basse", medium: "Moyenne", high: "Haute" };
  return labels[priority] || "Moyenne";
};

const resetForm = () => {
  editingTaskId = null;
  form.reset();
  priorityInput.value = "medium";
  submitButton.textContent = "Ajouter";
  cancelEditButton.classList.add("hidden");
};

const updateStats = (stats) => {
  Object.entries(statElements).forEach(([key, element]) => {
    if (element) element.textContent = stats[key] || 0;
  });
};

const createTaskContent = (task) => {
  const content = document.createElement("div");
  content.className = "task-content";

  const title = document.createElement("h2");
  title.textContent = task.title;

  const description = document.createElement("p");
  description.textContent = task.description || "Sans description";

  const meta = document.createElement("p");
  meta.className = "task-meta";
  meta.textContent = `Priorite: ${priorityLabel(task.priority)} | Date limite: ${formatDate(task.deadline)}`;

  content.append(title, description, meta);
  return content;
};

const renderTasks = (tasks) => {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Aucune tache ne correspond aux criteres.";
    taskList.append(empty);
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement("article");
    item.className = `task-item priority-${task.priority} ${task.completed ? "done" : ""}`.trim();

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = task.completed ? "Reouvrir" : "Terminer";
    toggle.addEventListener("click", async () => {
      await request(`${API_URL}/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...task, completed: !task.completed, deadline: normalizeDateInput(task.deadline) || null }),
      });
      await refreshDashboard();
    });

    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Modifier";
    edit.addEventListener("click", () => {
      editingTaskId = task.id;
      titleInput.value = task.title;
      descriptionInput.value = task.description || "";
      priorityInput.value = task.priority || "medium";
      deadlineInput.value = normalizeDateInput(task.deadline);
      submitButton.textContent = "Enregistrer";
      cancelEditButton.classList.remove("hidden");
      titleInput.focus();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger";
    remove.textContent = "Supprimer";
    remove.addEventListener("click", async () => {
      await request(`${API_URL}/${task.id}`, { method: "DELETE" });
      if (editingTaskId === task.id) resetForm();
      await refreshDashboard();
    });

    actions.append(toggle, edit, remove);
    item.append(createTaskContent(task), actions);
    taskList.append(item);
  });
};

const buildTaskQuery = () => {
  const params = new URLSearchParams();

  if (searchInput.value.trim()) params.append("search", searchInput.value.trim());
  if (statusFilter.value) params.append("status", statusFilter.value);
  if (priorityFilter.value) params.append("priority", priorityFilter.value);

  const query = params.toString();
  return query ? `${API_URL}?${query}` : API_URL;
};

const loadTasks = async () => {
  currentTasks = await request(buildTaskQuery());
  if (!currentTasks) return;
  renderTasks(currentTasks);
};

const loadStats = async () => {
  const stats = await request(`${API_URL}/stats`);
  if (stats) updateStats(stats);
};

const refreshDashboard = async () => {
  try {
    setMessage("Chargement...");
    await Promise.all([loadTasks(), loadStats()]);
    setMessage("");
  } catch (error) {
    setMessage(error.message, "error");
  }
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    title: titleInput.value,
    description: descriptionInput.value,
    priority: priorityInput.value,
    deadline: deadlineInput.value || null,
  };

  try {
    if (editingTaskId) {
      const original = currentTasks.find((task) => task.id === editingTaskId);
      await request(`${API_URL}/${editingTaskId}`, {
        method: "PUT",
        body: JSON.stringify({ ...payload, completed: Boolean(original && original.completed) }),
      });
      setMessage("Tache modifiee avec succes.", "success");
    } else {
      await request(API_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage("Tache ajoutee avec succes.", "success");
    }

    resetForm();
    await refreshDashboard();
  } catch (error) {
    setMessage(error.message, "error");
  }
});

cancelEditButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", refreshDashboard);
statusFilter.addEventListener("change", refreshDashboard);
priorityFilter.addEventListener("change", refreshDashboard);

refreshDashboard();
