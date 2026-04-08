-- Force reset admin password for entrepoker@gmail.com
-- Password: NWMHS2026
UPDATE users
SET password_hash = '$2a$12$LQb3eXKbFW/h.hsBzxMiqOWoqnoqXUvoE56ylDpmaDeLmfeww7wBe'
WHERE email = 'entrepoker@gmail.com';
