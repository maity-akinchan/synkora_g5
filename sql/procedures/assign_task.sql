-- Purpose: atomically assign a task and create an activity; prevents assigning tasks already DONE.
DELIMITER $$

DROP PROCEDURE IF EXISTS assign_task$$
CREATE PROCEDURE assign_task(
  IN p_task_id VARCHAR(36),
  IN p_assignee_id VARCHAR(36)
)
BEGIN
  DECLARE v_status VARCHAR(30);
  DECLARE v_project_id VARCHAR(36);

  START TRANSACTION;

  SELECT status, project_id
  INTO v_status, v_project_id
  FROM Task
  WHERE id = p_task_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Task not found';
  END IF;

  IF v_status = 'DONE' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot assign a completed task';
  END IF;

  UPDATE Task
  SET assignee_id = p_assignee_id, status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP
  WHERE id = p_task_id;

  INSERT INTO Activity (id, project_id, type, data, created_at)
  VALUES (
    UUID(),
    v_project_id,
    'TASK_UPDATED',
    JSON_OBJECT('task_id', p_task_id, 'action', 'ASSIGNED', 'assignee_id', p_assignee_id),
    CURRENT_TIMESTAMP
  );

  COMMIT;
END$$

DELIMITER ;
