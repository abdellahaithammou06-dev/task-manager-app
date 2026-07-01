const db = require("../config/db");

const getAllTasks = (callback) => {
  db.query("SELECT * FROM tasks ORDER BY created_at DESC", callback);
};

const createTask = (task, callback) => {
  db.query(
    "INSERT INTO tasks (title, description, completed) VALUES (?, ?, ?)",
    [task.title, task.description, false],
    callback
  );
};

const updateTask = (id, task, callback) => {
  db.query(
    "UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?",
    [task.title, task.description, Boolean(task.completed), id],
    callback
  );
};

const deleteTask = (id, callback) => {
  db.query("DELETE FROM tasks WHERE id = ?", [id], callback);
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask };
