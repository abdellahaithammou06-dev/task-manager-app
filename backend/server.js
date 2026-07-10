require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const db = require("./config/db");
const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const frontendPath = path.join(__dirname, "..", "frontend");

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

db.connect((err) => {
  if (err) {
    console.error("Erreur MySQL:", err.message);
    return;
  }
  console.log("Connecte a MySQL");
});

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "pages", "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(frontendPath, "pages", "dashboard.html"));
});

app.get("/stats", (req, res) => {
  res.sendFile(path.join(frontendPath, "pages", "stats.html"));
});

app.get("/pomodoro", (req, res) => {
  res.sendFile(path.join(frontendPath, "pages", "pomodoro.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(frontendPath, "pages", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(frontendPath, "pages", "register.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur demarre sur http://localhost:${PORT}`);
});
