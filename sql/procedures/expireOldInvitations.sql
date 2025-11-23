-- Purpose: batch job to mark expired TeamInvitation rows as EXPIRED. Use scheduler/cron to call.
DELIMITER $$

DROP PROCEDURE IF EXISTS expire_old_invitations$$
CREATE PROCEDURE expire_old_invitations()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE v_id VARCHAR(36);

  DECLARE cur CURSOR FOR
    SELECT id FROM TeamInvitation WHERE status = 'PENDING' AND expires_at <= CURRENT_TIMESTAMP;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;

  read_loop: LOOP
    FETCH cur INTO v_id;
    IF done = 1 THEN
      LEAVE read_loop;
    END IF;

    UPDATE TeamInvitation
    SET status = 'EXPIRED'
    WHERE id = v_id;
  END LOOP;

  CLOSE cur;
END$$

DELIMITER ;
