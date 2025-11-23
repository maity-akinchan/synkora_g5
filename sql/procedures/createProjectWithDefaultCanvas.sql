-- Purpose: create a Project, plus a default Canvas row and optional GitRepository stub — all in one transaction.
DELIMITER $$

DROP PROCEDURE IF EXISTS create_project_with_default_canvas$$
CREATE PROCEDURE create_project_with_default_canvas(
  IN p_project_id VARCHAR(36),
  IN p_name VARCHAR(255),
  IN p_description TEXT,
  IN p_team_id VARCHAR(36),
  IN p_created_by_id VARCHAR(36)
)
BEGIN
  START TRANSACTION;

  INSERT INTO Project (id, name, description, team_id, created_by_id, created_at, updated_at)
  VALUES (p_project_id, p_name, p_description, p_team_id, p_created_by_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

  INSERT INTO Canvas (id, project_id, state, version, created_at, updated_at)
  VALUES (UUID(), p_project_id, '{}', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

  COMMIT;
END$$

DELIMITER ;
