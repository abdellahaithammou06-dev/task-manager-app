const db = require("../config/db");

const findByEmail = (email, callback) => {
  db.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email], callback);
};

const createUser = (user, callback) => {
  db.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [user.name, user.email, user.password],
    callback
  );
};

module.exports = { findByEmail, createUser };
