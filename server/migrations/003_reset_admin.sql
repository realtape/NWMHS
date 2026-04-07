-- Reset admin password for entrepoker@gmail.com to NWMHS2026
UPDATE users
SET password_hash = '$2a$12$3.9cvlkUn7fumaQ26wLrEudPfgXEvDJyREgUO//3xH8R5wGqEpITm'
WHERE email = 'entrepoker@gmail.com';
