SET @task_id = UUID();
SET @project_id = 'proj-uuid-1';
SET @title = 'New task via transaction';
SET @creator = 'user-uuid-1';

START TRANSACTION;

INSERT INTO Task (id, title, description, position, project_id, created_by_id, created_at, updated_at, status, priority)
VALUES (@task_id, @title, 'descr', 1, @project_id, @creator, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'TODO', 'MEDIUM');

INSERT INTO Activity (id, project_id, type, data, created_at)
VALUES (UUID(), @project_id, 'TASK_CREATED', JSON_OBJECT('task_id', @task_id, 'title', @title), CURRENT_TIMESTAMP);

COMMIT;
