--Purpose: recent activities for a given user’s projects (useful for activity feed).
DROP VIEW IF EXISTS v_user_activity;
CREATE VIEW v_user_activity AS
SELECT
  a.id AS activity_id,
  a.project_id,
  a.type,
  a.data,
  a.created_at
FROM Activity a
WHERE a.project_id IN (
  SELECT p.id FROM Project p
  WHERE p.team_id IN (
    SELECT tm.team_id FROM TeamMember tm WHERE tm.user_id = (SELECT id FROM `User` WHERE id = NULL) -- placeholder
  )
);
