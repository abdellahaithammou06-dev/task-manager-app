const Task = require("../models/taskModel");

const getTasks = (req, res) => {
  console.log("Le contrôleur est appelé");

  Task.getAllTasks((err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};

module.exports = { getTasks };