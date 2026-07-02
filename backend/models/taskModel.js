const db = require("../config/db");

const priorityToDb = (priority) => {
  const values = { low: "Low", medium: "Medium", high: "High" };
  return values[priority] || "Medium";
};

const getAllTasks = (userId, filters, callback) => {
  const conditions = ["user_id = ?"];
  const values = [userId];

  if (filters.search) {
    conditions.push("(title LIKE ? OR description LIKE ?)");
    values.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.status === "completed") {
    conditions.push("completed = TRUE");
  }

  if (filters.status === "pending") {
    conditions.push("completed = FALSE");
  }

  if (["low", "medium", "high"].includes(filters.priority)) {
    conditions.push("priority = ?");
    values.push(priorityToDb(filters.priority));
  }

  db.query(
    `SELECT
       id,
       user_id,
       title,
       description,
       completed,
       LOWER(priority) AS priority,
       deadline,
       created_at
     FROM tasks
     WHERE ${conditions.join(" AND ")}
     ORDER BY
       FIELD(priority, 'High', 'Medium', 'Low'),
       CASE WHEN deadline IS NULL THEN 1 ELSE 0 END,
       deadline ASC,
       created_at DESC`,
    values,
    callback
  );
};

const createTask = (task, callback) => {
  db.query(
    "INSERT INTO tasks (user_id, title, description, completed, priority, deadline) VALUES (?, ?, ?, ?, ?, ?)",
    [task.userId, task.title, task.description, false, priorityToDb(task.priority), task.deadline],
    callback
  );
};

const updateTask = (id, task, callback) => {
  db.query(
    "UPDATE tasks SET title = ?, description = ?, completed = ?, priority = ?, deadline = ? WHERE id = ? AND user_id = ?",
    [
      task.title,
      task.description,
      Boolean(task.completed),
      priorityToDb(task.priority),
      task.deadline,
      id,
      task.userId,
    ],
    callback
  );
};

const deleteTask = (id, userId, callback) => {
  db.query("DELETE FROM tasks WHERE id = ? AND user_id = ?", [id, userId], callback);
};

const getStats = (userId, callback) => {
  db.query(
    `SELECT
       COUNT(*) AS total,
       SUM(completed = TRUE) AS completed,
       SUM(completed = FALSE) AS pending,
       SUM(priority = 'High') AS highPriority,
       SUM(deadline IS NOT NULL AND deadline < CURDATE() AND completed = FALSE) AS overdue,
       SUM(deadline = CURDATE() AND completed = FALSE) AS dueToday
     FROM tasks
     WHERE user_id = ?`,
    [userId],
    callback
  );
};

module.exports = { getAllTasks, createTask, updateTask, deleteTask, getStats };
