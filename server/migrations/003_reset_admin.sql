-- Reset admin: delete existing org/user so registration can be redone cleanly
-- Safe to run multiple times (idempotent)
DO $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT o.id INTO v_org_id
  FROM users u
  JOIN organizations o ON o.id = u.org_id
  WHERE u.email = 'entrepoker@gmail.com'
  LIMIT 1;

  IF v_org_id IS NOT NULL THEN
    DELETE FROM activities   WHERE org_id = v_org_id;
    DELETE FROM tasks        WHERE org_id = v_org_id;
    DELETE FROM deals        WHERE org_id = v_org_id;
    DELETE FROM contacts     WHERE org_id = v_org_id;
    DELETE FROM users        WHERE org_id = v_org_id;
    DELETE FROM organizations WHERE id = v_org_id;
  END IF;
END $$;
