const API_URL = "/api/tasks";
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token) {
  window.location.href = "/login";
}

const userName = document.querySelector("#user-name");
const logoutButton = document.querySelector("#logout-button");
const message = document.querySelector("#message");

const statElements = {
  total: document.querySelector("#stat-total"),
  completed: document.querySelector("#stat-completed"),
  pending: document.querySelector("#stat-pending"),
  overdue: document.querySelector("#stat-overdue"),
};

let chartData = null;

if (userName && user) {
  userName.textContent = user.name;
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  });
}

const setMessage = (text, type = "") => {
  message.textContent = text;
  message.className = `message ${type}`.trim();
};

const request = async (url) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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

  return response.json();
};

const updateStats = (stats) => {
  Object.entries(statElements).forEach(([key, element]) => {
    if (element) element.textContent = stats[key] || 0;
  });
};

const getThemeColors = () => {
  const styles = getComputedStyle(document.documentElement);
  return {
    text: styles.getPropertyValue("--text").trim(),
    muted: styles.getPropertyValue("--muted").trim(),
    border: styles.getPropertyValue("--border").trim(),
    panel: styles.getPropertyValue("--panel").trim(),
    green: styles.getPropertyValue("--green").trim(),
    red: styles.getPropertyValue("--red").trim(),
    amber: styles.getPropertyValue("--amber").trim(),
    blue: styles.getPropertyValue("--blue").trim(),
  };
};

const setupCanvas = (canvas) => {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width: rect.width, height: rect.height };
};

const clearCanvas = (ctx, width, height, colors) => {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = colors.panel;
  ctx.fillRect(0, 0, width, height);
};

const drawLabel = (ctx, text, x, y, colors, align = "center") => {
  ctx.fillStyle = colors.muted;
  ctx.font = "700 12px Arial";
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
};

const drawBarChart = (canvas, items) => {
  const colors = getThemeColors();
  const { ctx, width, height } = setupCanvas(canvas);
  const padding = 42;
  const chartHeight = height - padding * 2;
  const max = Math.max(...items.map((item) => item.value), 1);
  const barWidth = Math.min(72, (width - padding * 2) / items.length - 18);

  clearCanvas(ctx, width, height, colors);

  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  items.forEach((item, index) => {
    const x = padding + ((width - padding * 2) / items.length) * index + 18;
    const barHeight = (item.value / max) * (chartHeight - 12);
    const y = height - padding - barHeight;

    ctx.fillStyle = item.color;
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = colors.text;
    ctx.font = "700 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(item.value, x + barWidth / 2, y - 8);
    drawLabel(ctx, item.label, x + barWidth / 2, height - 16, colors);
  });
};

const drawLineChart = (canvas, items) => {
  const colors = getThemeColors();
  const { ctx, width, height } = setupCanvas(canvas);
  const padding = 44;
  const max = Math.max(...items.map((item) => item.value), 1);
  const step = (width - padding * 2) / Math.max(items.length - 1, 1);

  clearCanvas(ctx, width, height, colors);

  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i += 1) {
    const y = padding + ((height - padding * 2) / 3) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  ctx.strokeStyle = colors.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  items.forEach((item, index) => {
    const x = padding + step * index;
    const y = height - padding - (item.value / max) * (height - padding * 2);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  items.forEach((item, index) => {
    const x = padding + step * index;
    const y = height - padding - (item.value / max) * (height - padding * 2);
    ctx.fillStyle = item.color || colors.blue;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.text;
    ctx.font = "700 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText(item.value, x, y - 12);
    drawLabel(ctx, item.label, x, height - 16, colors);
  });
};

const getDeadlineGroups = (tasks) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return tasks.reduce(
    (groups, task) => {
      if (!task.deadline) {
        groups.noDeadline += 1;
        return groups;
      }

      const deadline = new Date(task.deadline);
      deadline.setHours(0, 0, 0, 0);

      if (!task.completed && deadline < today) groups.overdue += 1;
      else if (!task.completed && deadline.getTime() === today.getTime()) groups.today += 1;
      else groups.upcoming += 1;

      return groups;
    },
    { overdue: 0, today: 0, upcoming: 0, noDeadline: 0 }
  );
};

const buildChartData = (stats, tasks) => {
  const colors = getThemeColors();
  const priority = tasks.reduce(
    (totals, task) => {
      totals[task.priority || "medium"] += 1;
      return totals;
    },
    { high: 0, medium: 0, low: 0 }
  );
  const deadlines = getDeadlineGroups(tasks);

  return {
    status: [
      { label: "Total", value: stats.total, color: colors.blue },
      { label: "Terminees", value: stats.completed, color: colors.green },
      { label: "En cours", value: stats.pending, color: colors.amber },
      { label: "En retard", value: stats.overdue, color: colors.red },
    ],
    priority: [
      { label: "Haute", value: priority.high, color: colors.red },
      { label: "Moyenne", value: priority.medium, color: colors.amber },
      { label: "Basse", value: priority.low, color: colors.green },
    ],
    deadlines: [
      { label: "Retard", value: deadlines.overdue, color: colors.red },
      { label: "Aujourd'hui", value: deadlines.today, color: colors.amber },
      { label: "A venir", value: deadlines.upcoming, color: colors.blue },
      { label: "Sans date", value: deadlines.noDeadline, color: colors.green },
    ],
  };
};

const renderCharts = () => {
  if (!chartData) return;
  drawLineChart(document.querySelector("#status-chart"), chartData.status);
  drawBarChart(document.querySelector("#priority-chart"), chartData.priority);
  drawLineChart(document.querySelector("#deadline-chart"), chartData.deadlines);
};

const loadStatsPage = async () => {
  try {
    setMessage("Chargement...");
    const [stats, tasks] = await Promise.all([request(`${API_URL}/stats`), request(API_URL)]);
    if (!stats || !tasks) return;

    updateStats(stats);
    chartData = buildChartData(stats, tasks);
    renderCharts();
    setMessage("");
  } catch (error) {
    setMessage(error.message, "error");
  }
};

window.addEventListener("resize", renderCharts);
window.addEventListener("themechange", loadStatsPage);

loadStatsPage();
