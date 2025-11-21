--Purpose: accept a team invitation atomically — marks invitation ACCEPTED and inserts TeamMember. Prevents duplicates via unique constraint.
DELIMITER $$

DROP PROCEDURE IF EXISTS accept_team_invitation$$
CREATE PROCEDURE accept_team_invitation(
  IN p_invitation_id VARCHAR(36),
  IN p_user_id VARCHAR(36)
)
BEGIN
  DECLARE v_team_id VARCHAR(36);
  DECLARE v_status VARCHAR(20);

  START TRANSACTION;

  SELECT team_id, status
  INTO v_team_id, v_status
  FROM TeamInvitation
  WHERE id = p_invitation_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invitation not found';
  END IF;

  IF v_status <> 'PENDING' THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invitation not pending';
  END IF;

  -- mark accepted
  UPDATE TeamInvitation
  SET status = 'ACCEPTED', expires_at = expires_at -- keep expires_at as-is
  WHERE id = p_invitation_id;

  -- attempt to insert team member; unique constraint avoids dup
  INSERT INTO TeamMember (id, team_id, user_id, role, created_at)
  VALUES (UUID(), v_team_id, p_user_id, 'EDITOR', CURRENT_TIMESTAMP);

  COMMIT;
END$$

DELIMITER ;
