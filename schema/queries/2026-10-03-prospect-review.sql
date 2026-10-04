-- READ-ONLY review queries for command_prospects (nothing here changes data).
-- Supabase's SQL Editor only shows the result of the LAST statement it runs,
-- so run each numbered query on its own: select just that query's text, then Run.

-- 1. Every distinct market with a row count, flagged if it's not in the
--    current list (src/lib/markets.ts).
SELECT
  COALESCE(market, '(blank)') AS market,
  COUNT(*) AS prospects,
  CASE WHEN market IS NULL THEN '-'
       WHEN market IN (
    'UK (Diaspora)', 'Europe (Diaspora)', 'North America (Diaspora)', 'Australia (Diaspora)',
    'Asia (Diaspora)', 'South America (Diaspora)', 'Pan-African', 'Pan-Caribbean', 'Algeria',
    'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cameroon',
    'Central African Republic', 'Chad', 'Comoros', 'Congo (Republic)', 'DR Congo',
    'Cote d''Ivoire', 'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini',
    'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho',
    'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco',
    'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe', 'Senegal',
    'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania',
    'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe', 'Antigua and Barbuda', 'Bahamas',
    'Barbados', 'Belize', 'Cuba', 'Dominica', 'Dominican Republic', 'Grenada', 'Guyana', 'Haiti',
    'Jamaica', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
    'Suriname', 'Trinidad and Tobago', 'Other'
       ) THEN 'yes' ELSE 'NO' END AS in_new_list
FROM command_prospects
GROUP BY market
ORDER BY in_new_list, prospects DESC, market;

-- 2. Every prospect whose market is not in the current list.
SELECT id, company, market, industry, size, score
FROM command_prospects
WHERE market IS NOT NULL
  AND market NOT IN (
    'UK (Diaspora)', 'Europe (Diaspora)', 'North America (Diaspora)', 'Australia (Diaspora)',
    'Asia (Diaspora)', 'South America (Diaspora)', 'Pan-African', 'Pan-Caribbean', 'Algeria',
    'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cameroon',
    'Central African Republic', 'Chad', 'Comoros', 'Congo (Republic)', 'DR Congo',
    'Cote d''Ivoire', 'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea', 'Eswatini',
    'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Kenya', 'Lesotho',
    'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco',
    'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe', 'Senegal',
    'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan', 'Tanzania',
    'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe', 'Antigua and Barbuda', 'Bahamas',
    'Barbados', 'Belize', 'Cuba', 'Dominica', 'Dominican Republic', 'Grenada', 'Guyana', 'Haiti',
    'Jamaica', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
    'Suriname', 'Trinidad and Tobago', 'Other'
  )
ORDER BY market, company;

-- 3. Hand-edited scores: every score change made with the CRM's score
--    buttons (logged as score_updated). Edits made directly in Supabase's
--    Table Editor are NOT logged and won't appear here.
SELECT p.company, a.description, a.created_at
FROM command_prospect_activity a
JOIN command_prospects p ON p.id = a.prospect_id
WHERE a.activity_type = 'score_updated'
ORDER BY p.company, a.created_at;

-- 4. Re-score preview: every prospect whose score would change under the
--    new qualifyLead, with before/after. Hand-edited rows are listed but
--    marked SKIP — the re-score migration leaves them alone.
--    rows_that_will_change = how many rows the migration would update.
WITH hand_edited AS (
  SELECT DISTINCT prospect_id FROM command_prospect_activity
  WHERE activity_type = 'score_updated' AND prospect_id IS NOT NULL
),
rescored AS (
  SELECT id, company, industry, market, size, score AS old_score,
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
)
SELECT
  r.company, r.industry, r.market, r.size, r.old_score, r.new_score,
  CASE WHEN h.prospect_id IS NOT NULL THEN 'SKIP (hand-edited)' ELSE 'will change' END AS action,
  COUNT(*) FILTER (WHERE h.prospect_id IS NULL) OVER () AS rows_that_will_change
FROM rescored r
LEFT JOIN hand_edited h ON h.prospect_id = r.id
WHERE r.old_score IS DISTINCT FROM r.new_score
ORDER BY action DESC, r.company;
