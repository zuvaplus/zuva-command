-- "Global" was in the old market list but has no equivalent in the new one.
-- Moves any such prospects to "Other" so they can be re-tagged by hand.
-- Score is unaffected (neither value is high-value). Safe to run more than once.

UPDATE command_prospects
SET market = 'Other', updated_at = NOW()
WHERE market = 'Global';
