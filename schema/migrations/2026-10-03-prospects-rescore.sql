-- Re-score existing prospects with the current qualifyLead
-- (src/lib/qualifyLead.ts, 2026-10-03 high-value market list).
-- Review first with query 4 in schema/queries/2026-10-03-prospect-review.sql.
--
-- - Skips any prospect whose score was changed by hand in the CRM (it has a
--   score_updated activity). Edits made directly in Supabase's Table Editor
--   aren't logged, so those can't be detected and WILL be overwritten.
-- - Logs each change as a 'score_rescored' activity — deliberately not
--   'score_updated', so a re-score is never mistaken for a hand edit later.
-- - The CASE lists below mirror qualifyLead.ts as of this date. Safe to run
--   more than once (a second run changes nothing).

WITH hand_edited AS (
  SELECT DISTINCT prospect_id FROM command_prospect_activity
  WHERE activity_type = 'score_updated' AND prospect_id IS NOT NULL
),
rescored AS (
  SELECT id, score AS old_score,
    LEAST(5, ROUND(
      (CASE WHEN industry IN (
        'Fashion & Apparel', 'Beauty & Haircare', 'Food & Beverage', 'Music & Entertainment',
        'Film & Media', 'Financial Services', 'Telecom', 'Tech & Apps'
      ) THEN 2 ELSE 1 END)
    + (CASE WHEN market IN (
        'Nigeria', 'Ghana', 'South Africa', 'Kenya', 'Zimbabwe', 'Jamaica', 'Trinidad and Tobago',
        'UK (Diaspora)', 'North America (Diaspora)', 'Europe (Diaspora)', 'Australia (Diaspora)'
      ) THEN 2 ELSE 1 END)
    + (CASE size WHEN 'Enterprise' THEN 1 WHEN 'Mid-Market' THEN 0.5 ELSE 0 END)
    ))::int AS new_score
  FROM command_prospects
),
updated AS (
  UPDATE command_prospects p
  SET score = r.new_score, updated_at = NOW()
  FROM rescored r
  WHERE p.id = r.id
    AND p.score IS DISTINCT FROM r.new_score
    AND p.id NOT IN (SELECT prospect_id FROM hand_edited)
  RETURNING p.id, r.old_score, r.new_score
)
INSERT INTO command_prospect_activity (prospect_id, activity_type, description, metadata)
SELECT
  id,
  'score_rescored',
  'Score recalculated from ' || COALESCE(old_score::text, 'none') || ' to ' || new_score || ' (expanded market list)',
  jsonb_build_object('old_score', old_score, 'new_score', new_score)
FROM updated;
