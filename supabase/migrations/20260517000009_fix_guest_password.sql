-- Fix guest account: set non-matchable password hash and NULL token slots
UPDATE auth.users
SET
  encrypted_password = '$2a$10$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  confirmation_token = NULL,
  recovery_token = NULL,
  email_change_token_new = NULL,
  email_change = NULL
WHERE id = '00000000-0000-0000-0000-000000000001';
