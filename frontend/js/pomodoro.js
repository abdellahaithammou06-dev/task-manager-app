const API_URL = "/api/tasks";
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "null");

if (!token) {
  window.location.href = "/login";
}

const WORK_DEFAULT = 25;
const BREAK_DEFAULT = 5;

let task = null;
let timer = null;
let timeLeft = WORK_DEFAULT * 60;
let isWorkPhase = true;
let isRunning = false;
let sessionCount = 0;
let workMinutes = WORK_DEFAULT;
let breakMinutes = BREAK_DEFAULT;
let currentAudio = null;

const timeDisplay = document.querySelector("#pomo-time");
const phaseDisplay = document.querySelector("#pomo-phase");
const ringProgress = document.querySelector("#pomo-ring-progress");
const startBtn = document.querySelector("#pomo-start");
const pauseBtn = document.querySelector("#pomo-pause");
const resetBtn = document.querySelector("#pomo-reset");
const completeBtn = document.querySelector("#pomo-complete");
const workInput = document.querySelector("#pomo-work-time");
const breakInput = document.querySelector("#pomo-break-time");
const sessionCountEl = document.querySelector("#pomo-session-count");
const dotsEl = document.querySelector("#pomo-dots");
const messageEl = document.querySelector("#pomo-message");
const taskTitleEl = document.querySelector("#pomo-task-title");
const taskMetaEl = document.querySelector("#pomo-task-meta");
const taskDetailsEl = document.querySelector("#pomo-task-details");
const noTaskEl = document.querySelector("#pomo-no-task");
const taskEyebrow = document.querySelector("#pomo-task-eyebrow");

const CIRCUMFERENCE = 628.32;

const setMessage = (text, type = "") => {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`.trim();
};

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const updateDisplay = () => {
  timeDisplay.textContent = formatTime(timeLeft);
  const totalSeconds = (isWorkPhase ? workMinutes : breakMinutes) * 60;
  const offset = CIRCUMFERENCE * (1 - timeLeft / totalSeconds);
  ringProgress.style.strokeDashoffset = offset;
  phaseDisplay.textContent = isWorkPhase ? "Travail" : "Pause";
  ringProgress.style.stroke = isWorkPhase ? "var(--green)" : "var(--blue)";
};

const updateDots = () => {
  dotsEl.innerHTML = "";
  for (let i = 0; i < sessionCount; i++) {
    const dot = document.createElement("span");
    dot.className = "pomo-dot";
    dotsEl.append(dot);
  }
  sessionCountEl.textContent = `Session ${sessionCount}`;
};

const stopNotification = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
};

const playNotification = () => {
  stopNotification();
  if (!isWorkPhase) {
    try {
      currentAudio = new Audio("../sounds/alarm.mp3");
      currentAudio.volume = 0.5;
      currentAudio.play();
    } catch {
    }
    return;
  }
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 660;
      osc2.type = "sine";
      gain2.gain.value = 0.3;
      osc2.start();
      osc2.stop(ctx.currentTime + 0.3);
    }, 350);
  } catch {
  }
};

const switchPhase = () => {
  isWorkPhase = !isWorkPhase;
  timeLeft = (isWorkPhase ? workMinutes : breakMinutes) * 60;
  playNotification();
  updateDisplay();
  if (isWorkPhase) {
    sessionCount++;
    updateDots();
  }
  startBtn.textContent = "Demarrer";
  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
  completeBtn.classList.toggle("hidden", isWorkPhase || !task);
  isRunning = false;
  clearInterval(timer);
  timer = null;
};

const tick = () => {
  timeLeft--;
  updateDisplay();
  if (timeLeft <= 0) {
    switchPhase();
  }
};

const startTimer = () => {
  if (isRunning) return;
  stopNotification();
  if (timeLeft <= 0) {
    timeLeft = (isWorkPhase ? workMinutes : breakMinutes) * 60;
  }
  isRunning = true;
  startBtn.classList.add("hidden");
  pauseBtn.classList.remove("hidden");
  timer = setInterval(tick, 1000);
};

const pauseTimer = () => {
  isRunning = false;
  clearInterval(timer);
  timer = null;
  startBtn.textContent = "Reprendre";
  startBtn.classList.remove("hidden");
  pauseBtn.classList.add("hidden");
};

const resetTimer = () => {
  stopNotification();
  pauseTimer();
  isWorkPhase = true;
  timeLeft = workMinutes * 60;
  sessionCount = 0;
  updateDisplay();
  updateDots();
  startBtn.textContent = "Demarrer";
  completeBtn.classList.add("hidden");
};

const loadSettings = () => {
  workMinutes = parseInt(workInput.value, 10) || WORK_DEFAULT;
  breakMinutes = parseInt(breakInput.value, 10) || BREAK_DEFAULT;
  if (!isRunning) {
    if (isWorkPhase) {
      timeLeft = workMinutes * 60;
    }
    updateDisplay();
  }
};

workInput.addEventListener("change", loadSettings);
breakInput.addEventListener("change", loadSettings);

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);

completeBtn.addEventListener("click", async () => {
  if (!task) return;
  stopNotification();
  try {
    await fetch(`${API_URL}/${task.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: task.title,
        description: task.description || "",
        priority: task.priority || "medium",
        deadline: task.deadline || null,
        completed: true,
      }),
    });
    task.completed = true;
    setMessage("Tache marquee comme terminee !", "success");
    completeBtn.classList.add("hidden");
    if (taskEyebrow) taskEyebrow.textContent = "Terminee";
  } catch (error) {
    setMessage(error.message, "error");
  }
});

const request = async (url) => {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
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

const loadTask = async () => {
  const params = new URLSearchParams(window.location.search);
  const taskId = params.get("id");
  if (!taskId) {
    taskDetailsEl.classList.add("hidden");
    noTaskEl.classList.remove("hidden");
    completeBtn.classList.add("hidden");
    return;
  }
  try {
    task = await request(`${API_URL}/${taskId}`);
    if (!task) return;
    taskDetailsEl.classList.remove("hidden");
    noTaskEl.classList.add("hidden");
    taskTitleEl.textContent = task.title;
    const labels = { low: "Basse", medium: "Moyenne", high: "Haute" };
    taskMetaEl.textContent = `Priorite: ${labels[task.priority] || "Moyenne"} | Limite: ${task.deadline ? new Date(task.deadline).toLocaleDateString("fr-FR") : "Aucune"}`;
    if (task.completed) {
      if (taskEyebrow) taskEyebrow.textContent = "Terminee";
      completeBtn.classList.add("hidden");
    } else {
      if (taskEyebrow) taskEyebrow.textContent = "En cours";
    }
  } catch (error) {
    setMessage(error.message, "error");
  }
};

const initUserAvatar = (user) => {
  const avatar = document.querySelector("#user-avatar");
  const nameEl = document.querySelector("#avatar-name");
  if (!avatar || !user) return;
  const initials = user.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
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

updateDisplay();
updateDots();
loadTask();
