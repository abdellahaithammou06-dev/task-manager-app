const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const createToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || "dev_secret_change_me",
    { expiresIn: "1d" }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nom, email et mot de passe sont obligatoires" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caracteres" });
    }

    User.findByEmail(email, async (err, users) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (users.length > 0) {
        return res.status(409).json({ error: "Cet email est deja utilise" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      User.createUser({ name, email, password: hashedPassword }, (createErr, result) => {
        if (createErr) {
          return res.status(500).json({ error: createErr.message });
        }

        const user = { id: result.insertId, name, email };
        const token = createToken(user);

        res.status(201).json({ message: "Compte cree avec succes", user, token });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe sont obligatoires" });
  }

  User.findByEmail(email, async (err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (users.length === 0) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const token = createToken(user);

    res.json({
      message: "Connexion reussie",
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  });
};

module.exports = { register, login };
