-- 1. BEFORE UPDATE triggers: update `updated_at` timestamp
-- (Create one per frequently-updated table)
-- ------------------------

CREATE TRIGGER trg_project_updated_at
BEFORE UPDATE ON Project
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_task_updated_at
BEFORE UPDATE ON Task
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_markdownfile_updated_at
BEFORE UPDATE ON MarkdownFile
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_canvas_updated_at
BEFORE UPDATE ON Canvas
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_spreadsheet_updated_at
BEFORE UPDATE ON Spreadsheet
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_gitrepo_updated_at
BEFORE UPDATE ON GitRepository
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

-- ------------------------
-- 2. Task activity logging
-- - AFTER INSERT → TASK_CREATED
-- - AFTER UPDATE → TASK_UPDATED (and if status becomes 'DONE' log TASK_COMPLETED)
-- - AFTER DELETE → (optional) log TASK_UPDATED with a deletion note or skip (we'll log TASK_UPDATED with deleted flag)
-- ------------------------

CREATE TRIGGER trg_task_after_insert
AFTER INSERT ON Task
FOR EACH ROW
BEGIN
  -- Insert TASK_CREATED activity
  INSERT INTO Activity (id, project_id, type, data, created_at)
  VALUES (
    UUID(),
    NEW.project_id,
    'TASK_CREATED',
    JSON_OBJECT('task_id', NEW.id, 'title', NEW.title, 'creator', NEW.created_by_id),
    CURRENT_TIMESTAMP
  );
END$$

CREATE TRIGGER trg_task_after_update
AFTER UPDATE ON Task
FOR EACH ROW
BEGIN
  -- If status changed, log update and possibly completion
  IF (OLD.status <> NEW.status) THEN
    IF (NEW.status = 'DONE') THEN
      INSERT INTO Activity (id, project_id, type, data, created_at)
      VALUES (
        UUID(),
        NEW.project_id,
        'TASK_COMPLETED',
        JSON_OBJECT('task_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status, 'assignee', NEW.assignee_id),
        CURRENT_TIMESTAMP
      );
    ELSE
      INSERT INTO Activity (id, project_id, type, data, created_at)
      VALUES (
        UUID(),
        NEW.project_id,
        'TASK_UPDATED',
        JSON_OBJECT('task_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status, 'assignee', NEW.assignee_id),
        CURRENT_TIMESTAMP
      );
    END IF;
  ELSE
    -- If other fields changed (title, assignee, position, priority), also log TASK_UPDATED
    -- We check a couple of representative fields; extend as needed.
    IF (OLD.title <> NEW.title) OR (IFNULL(OLD.assignee_id,'') <> IFNULL(NEW.assignee_id,'')) OR (OLD.position <> NEW.position) OR (OLD.priority <> NEW.priority) THEN
      INSERT INTO Activity (id, project_id, type, data, created_at)
      VALUES (
        UUID(),
        NEW.project_id,
        'TASK_UPDATED',
        JSON_OBJECT('task_id', NEW.id, 'note', 'attributes changed', 'assignee', NEW.assignee_id),
        CURRENT_TIMESTAMP
      );
    END IF;
  END IF;
END$$

CREATE TRIGGER trg_task_after_delete
AFTER DELETE ON Task
FOR EACH ROW
BEGIN
  -- If a task is deleted, log a TASK_UPDATED with deleted flag (activity types don't include TASK_DELETED)
  INSERT INTO Activity (id, project_id, type, data, created_at)
  VALUES (
    UUID(),
    OLD.project_id,
    'TASK_UPDATED',
    JSON_OBJECT('task_id', OLD.id, 'action', 'DELETED', 'old_status', OLD.status),
    CURRENT_TIMESTAMP
  );
END$$

-- ------------------------
-- 3. TeamMember: when a member is added, log MEMBER_JOINED
-- ------------------------
CREATE TRIGGER trg_teammember_after_insert
AFTER INSERT ON TeamMember
FOR EACH ROW
BEGIN
  INSERT INTO Activity (id, project_id, type, data, created_at)
  VALUES (
    UUID(),
    NULL, -- TeamMember isn't directly tied to a single project; set NULL or optionally derive recent project
    'MEMBER_JOINED',
    JSON_OBJECT('team_id', NEW.team_id, 'user_id', NEW.user_id, 'role', NEW.role),
    CURRENT_TIMESTAMP
  );
END$$

-- ------------------------
-- 4. GitCommit: on new commit insert, log GIT_COMMIT activity for the related project (via GitRepository)
-- ------------------------
CREATE TRIGGER trg_gitcommit_after_insert
AFTER INSERT ON GitCommit
FOR EACH ROW
BEGIN
  DECLARE v_project_id VARCHAR(36);

  -- find project_id from repository
  SELECT project_id INTO v_project_id FROM GitRepository WHERE id = NEW.repository_id LIMIT 1;

  -- If repository found, insert activity
  IF v_project_id IS NOT NULL THEN
    INSERT INTO Activity (id, project_id, type, data, created_at)
    VALUES (
      UUID(),
      v_project_id,
      'GIT_COMMIT',
      JSON_OBJECT('commit_id', NEW.id, 'sha', NEW.sha, 'message', NEW.message, 'author', NEW.author, 'url', NEW.url),
      CURRENT_TIMESTAMP
    );
  END IF;
END$$

-- ------------------------
-- 5. MarkdownFile: log creation and updates
-- ------------------------
CREATE TRIGGER trg_markdownfile_after_insert
AFTER INSERT ON MarkdownFile
FOR EACH ROW
BEGIN
  INSERT INTO Activity (id, project_id, type, data, created_at)
  VALUES (
    UUID(),
    NEW.project_id,
    'MARKDOWN_CREATED',
    JSON_OBJECT('markdown_id', NEW.id, 'title', NEW.title),
    CURRENT_TIMESTAMP
  );
END$$

CREATE TRIGGER trg_markdownfile_after_update
AFTER UPDATE ON MarkdownFile
FOR EACH ROW
BEGIN
  INSERT INTO Activity (id, project_id, type, data, created_at)
  VALUES (
    UUID(),
    NEW.project_id,
    'MARKDOWN_UPDATED',
    JSON_OBJECT('markdown_id', NEW.id, 'title', NEW.title),
    CURRENT_TIMESTAMP
  );
END$$

-- ------------------------
-- 6. AIMessage: when assistant responds, log AI_SUGGESTION
-- ------------------------
CREATE TRIGGER trg_aimessage_after_insert
AFTER INSERT ON AIMessage
FOR EACH ROW
BEGIN
  IF (NEW.role = 'assistant') THEN
    INSERT INTO Activity (id, project_id, type, data, created_at)
    VALUES (
      UUID(),
      NEW.project_id,
      'AI_SUGGESTION',
      JSON_OBJECT('aimessage_id', NEW.id, 'user_id', NEW.user_id, 'summary', LEFT(NEW.content, 200)),
      CURRENT_TIMESTAMP
    );
  END IF;
END$$

-- ------------------------
-- 7. Project: log creation and simple updates (optional)
-- ------------------------
CREATE TRIGGER trg_project_after_insert
AFTER INSERT ON Project
FOR EACH ROW
BEGIN
  INSERT INTO Activity (id, project_id, type, data, created_at)
  VALUES (
    UUID(),
    NEW.id,
    'MARKDOWN_CREATED', -- reuse an activity type? better to create PROJECT_CREATED but our enum doesn't have it; using MARKDOWN_CREATED is not ideal.
    JSON_OBJECT('project_id', NEW.id, 'name', NEW.name),
    CURRENT_TIMESTAMP
  );
END$$

-- If you want to log project updates, you can add a similar AFTER UPDATE trigger.

-- =====================================================
-- End triggers
-- =====================================================
DELIMITER ;