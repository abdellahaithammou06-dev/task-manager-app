const API_URL = "/api/tasks";

const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#title");
const descriptionInput = document.querySelector("#description");
const taskList = document.querySelector("#task-list");
const message = document.querySelector("#message");

const setMessage = (text, type = "") => {
  message.textContent = text;
  message.className = `message ${type}`.trim();
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Erreur API");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const createTaskContent = (task) => {
  const content = document.createElement("div");
  content.className = "task-content";

  const title = document.createElement("h2");
  title.textContent = task.title;

  const description = document.createElement("p");
  description.textContent = task.description || "Sans description";

  content.append(title, description);
  return content;
};

const renderTasks = (tasks) => {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Aucune tache pour le moment.";
    taskList.append(empty);
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement("article");
    item.className = `task-item ${task.completed ? "done" : ""}`;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.textContent = task.completed ? "Reouvrir" : "Terminer";
    toggle.addEventListener("click", async () => {
      await request(`${API_URL}/${task.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...task, completed: !task.completed }),
      });
      await loadTasks();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "danger";
    remove.textContent = "Supprimer";
    remove.addEventListener("click", async () => {
      await request(`${API_URL}/${task.id}`, { method: "DELETE" });
      await loadTasks();
    });

    actions.append(toggle, remove);
    item.append(createTaskContent(task), actions);
    taskList.append(item);
  });
};

const loadTasks = async () => {
  try {
    setMessage("Chargement...");
    const tasks = await request(API_URL);
    renderTasks(tasks);
    setMessage("");
  } catch (error) {
    setMessage(error.message, "error");
  }
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await request(API_URL, {
      method: "POST",
      body: JSON.stringify({ title: titleInput.value, description: descriptionInput.value }),
    });

    form.reset();
    await loadTasks();
  } catch (error) {
    setMessage(error.message, "error");
  }
});

loadTasks();
