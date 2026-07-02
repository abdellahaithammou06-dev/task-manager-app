const Task = require("../models/taskModel");

const getTasks = (req, res) => {
  Task.getAllTasks(req.user.id, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
};

const createTask = (req, res) => {
  const { title, description = "", priority = "medium", deadline = null } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Le titre est obligatoire" });
  }

  const task = {
  userId: req.user.id,
  title: title.trim(),
  description: description.trim(),
  priority,
  deadline,
  };

  Task.createTask(task, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      id: result.insertId,
      user_id: req.user.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      deadline: task.deadline,
      completed: false,
    });
  });
};

const updateTask = (req, res) => {
  const { id } = req.params;
  const { title, description = "", completed = false } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Le titre est obligatoire" });
  }

  const task = {
    userId: req.user.id,
    title: title.trim(),
    description: description.trim(),
    completed,
  };

  Task.updateTask(id, task, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tache introuvable" });
    }

    res.json({
      id: Number(id),
      user_id: req.user.id,
      title: task.title,
      description: task.description,
      completed: Boolean(completed),
    });
  });
};

const deleteTask = (req, res) => {
  Task.deleteTask(req.params.id, req.user.id, (err, result) => {
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
