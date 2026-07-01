const Task = require("../models/taskModel");

const getTasks = (req, res) => {
  Task.getAllTasks((err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};

const createTask = (req, res) => {
  const { title, description = "" } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Le titre est obligatoire" });
  }

  Task.createTask({ title: title.trim(), description: description.trim() }, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({ id: result.insertId, title: title.trim(), description: description.trim(), completed: false });
  });
};

const updateTask = (req, res) => {
  const { id } = req.params;
  const { title, description = "", completed = false } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Le titre est obligatoire" });
  }

  Task.updateTask(id, { title: title.trim(), description: description.trim(), completed }, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tache introuvable" });
    }

    res.json({ id: Number(id), title: title.trim(), description: description.trim(), completed: Boolean(completed) });
  });
};

const deleteTask = (req, res) => {
  Task.deleteTask(req.params.id, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tache introuvable" });
    }

    res.status(204).send();
  });
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
