-- Link a recruited creator to their Zuva platform account (users.id) once
-- they've onboarded. Nullable: most creators in the pipeline have no
-- account yet. ON DELETE SET NULL so deleting a platform user never deletes
-- the recruitment record.
--
-- Run AFTER 2026-10-03-command-creators.sql. Safe either way:
--   * creators migration already run  -> this adds the column
--   * creators migration run after its 2026-10-04 update -> column already
--     exists and this file changes nothing
-- Safe to run more than once.

ALTER TABLE command_creators
  ADD COLUMN IF NOT EXISTS zuva_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- One recruitment record per platform user.
CREATE UNIQUE INDEX IF NOT EXISTS command_creators_zuva_user_id_key
  ON command_creators (zuva_user_id) WHERE zuva_user_id IS NOT NULL;
