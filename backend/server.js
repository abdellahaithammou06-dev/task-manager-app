require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./config/db");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Connexion à MySQL
db.connect((err) => {
  if (err) {
    console.error("❌ Erreur MySQL :", err.message);
    return;
  }
  console.log("✅ Connecté à MySQL");
});

// Route de test
app.get("/", (req, res) => {
  res.send("API Task Manager fonctionne !");
});

// Routes des tâches
app.use("/api/tasks", taskRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});