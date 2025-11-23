-- Inputs: project_id = 'proj-uuid-1', task_id = 'task-uuid-1', new_pos = 3
-- Purpose: place a task at a new position and shift others accordingly. Use FOR UPDATE to lock project tasks.
SET @project_id = 'proj-uuid-1';
SET @task_id = 'task-uuid-1';
SET @new_pos = 3;

START TRANSACTION;

-- Lock tasks in the project
SELECT id, position FROM Task WHERE project_id = @project_id FOR UPDATE;

-- Get old position
SELECT position INTO @old_pos FROM Task WHERE id = @task_id;

-- If moving down (old_pos < new_pos), decrement positions in (old_pos+1 .. new_pos)
IF @old_pos < @new_pos THEN
  UPDATE Task
  SET position = position - 1
  WHERE project_id = @project_id AND position > @old_pos AND position <= @new_pos;
ELSEIF @old_pos > @new_pos THEN
  -- moving up: increment positions in (new_pos .. old_pos-1)
  UPDATE Task
  SET position = position + 1
  WHERE project_id = @project_id AND position >= @new_pos AND position < @old_pos;
END IF;

-- set moved task to new_pos
UPDATE Task
SET position = @new_pos, updated_at = CURRENT_TIMESTAMP
WHERE id = @task_id;

COMMIT;
