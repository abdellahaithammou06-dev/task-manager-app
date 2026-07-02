const db = require("../config/db");

const getAllTasks = (userId, callback) => {
  db.query(
    "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    callback
  );
};

const createTask = (task, callback) => {
  db.query(
    "INSERT INTO tasks (user_id, title, description, completed, priority, deadline) VALUES (?, ?, ?, ?, ?, ?)",
    [task.userId, task.title, task.description, false, task.priority, task.deadline],
    callback
  );
};

const updateTask = (id, task, callback) => {
  db.query(
    "UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ? AND user_id = ?",
    [task.title, task.description, Boolean(task.completed), id, task.userId],
    callback
  );
};

const deleteTask = (id, userId, callback) => {
  db.query("DELETE FROM tasks WHERE id = ? AND user_id = ?", [id, userId], callback);
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };
