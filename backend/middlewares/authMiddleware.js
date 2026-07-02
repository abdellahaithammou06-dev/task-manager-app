const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token manquant" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");

    db.query(
      "SELECT id, name, email FROM users WHERE id = ? LIMIT 1",
      [decoded.id],
      (err, users) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (users.length === 0) {
          return res.status(401).json({ error: "Compte introuvable. Reconnectez-vous." });
        }

        req.user = users[0];
        next();
      }
    );
  } catch (error) {
    res.status(401).json({ error: "Token invalide" });
  }
};

module.exports = authMiddleware;
