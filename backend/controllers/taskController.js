const Task = require("../models/taskModel");

const normalizePriority = (priority) => {
  return ["low", "medium", "high"].includes(priority) ? priority : "medium";
};

const getTasks = (req, res) => {
  const filters = {
    search: (req.query.search || "").trim(),
    status: req.query.status || "",
    priority: req.query.priority || "",
  };

  Task.getAllTasks(req.user.id, filters, (err, results) => {
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
    priority: normalizePriority(priority),
    deadline: deadline || null,
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
  const { title, description = "", completed = false, priority = "medium", deadline = null } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Le titre est obligatoire" });
  }

  const task = {
    userId: req.user.id,
    title: title.trim(),
    description: description.trim(),
    completed,
    priority: normalizePriority(priority),
    deadline: deadline || null,
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
      priority: task.priority,
      deadline: task.deadline,
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

const getStats = (req, res) => {
  Task.getStats(req.user.id, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const stats = results[0] || {};
    res.json({
      total: Number(stats.total || 0),
      completed: Number(stats.completed || 0),
      pending: Number(stats.pending || 0),
      highPriority: Number(stats.highPriority || 0),
      overdue: Number(stats.overdue || 0),
      dueToday: Number(stats.dueToday || 0),
    });
  });
};

const getTask = (req, res) => {
  Task.getTaskById(req.params.id, req.user.id, (err, task) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!task) return res.status(404).json({ error: "Tache introuvable" });
    res.json(task);
  });
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getStats, getTask };
