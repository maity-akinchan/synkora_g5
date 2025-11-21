--Purpose: quick joined view of tasks with project, assignee and creator names.
DROP VIEW IF EXISTS v_project_task_details;
CREATE VIEW v_project_task_details AS
SELECT
  t.id AS task_id,
  t.title,
  t.status,
  t.priority,
  t.position,
  t.due_date,
  p.id AS project_id,
  p.name AS project_name,
  tm_assignee.id AS assignee_id,
  tm_assignee.name AS assignee_name,
  tm_creator.id AS creator_id,
  tm_creator.name AS creator_name
FROM Task t
JOIN Project p ON t.project_id = p.id
LEFT JOIN `User` tm_assignee ON t.assignee_id = tm_assignee.id
JOIN `User` tm_creator ON t.created_by_id = tm_creator.id;
