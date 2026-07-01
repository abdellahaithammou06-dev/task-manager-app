CREATE DATABASE IF NOT EXISTS task_manager;
USE task_manager;

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tasks (title, description, completed)
SELECT 'Premiere tache', 'Exemple de tache pour tester l application', FALSE
WHERE NOT EXISTS (SELECT 1 FROM tasks LIMIT 1);
