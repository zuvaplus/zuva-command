-- Allow prospects without an email address.
-- CSV import and Add Prospect now accept a blank email; those rows are stored
-- with email = NULL and tagged 'needs-email' in command_prospects.tags.
-- Run this BEFORE importing or adding any prospect without an email,
-- otherwise those inserts fail the NOT NULL constraint.

ALTER TABLE command_prospects ALTER COLUMN email DROP NOT NULL;

-- Normalise any blank emails that already exist to NULL + needs-email tag,
-- so they behave the same as new email-less prospects.
UPDATE command_prospects
SET
  email = NULL,
  tags = array_append(COALESCE(tags, ARRAY[]::text[]), 'needs-email'),
  updated_at = NOW()
WHERE (email IS NULL OR btrim(email) = '')
  AND NOT ('needs-email' = ANY (COALESCE(tags, ARRAY[]::text[])));
