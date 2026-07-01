const db = require("../config/db");

const getAllTasks = (callback) => {
  console.log("Exécution de la requête SQL...");

  db.query("SELECT * FROM tasks", (err, results) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return callback(err);
    }

    console.log("Résultat SQL :", results);

    callback(null, results);
  });
};

module.exports = { getAllTasks };