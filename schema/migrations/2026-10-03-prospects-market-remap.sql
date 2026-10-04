-- Remap legacy market labels on existing prospects to the expanded market
-- list (src/lib/markets.ts). Same mapping CSV import applies via
-- LEGACY_MARKET_MAP. Safe to run more than once.
--
-- Scores are NOT recalculated here: they may have been set by hand in the
-- CRM. The four diaspora labels were already high-value and map to
-- high-value markets, so their scores don't change; "Trinidad & Tobago"
-- rows were scored as non-high-value and are now high-value.

-- Preview what will change (optional — run on its own first):
-- SELECT market, COUNT(*) FROM command_prospects
-- WHERE market IN ('African Diaspora (UK)', 'Caribbean Diaspora (UK)',
--                  'African Diaspora (USA)', 'African Diaspora (Canada)', 'Trinidad & Tobago')
-- GROUP BY market;

UPDATE command_prospects
SET
  market = CASE market
    WHEN 'African Diaspora (UK)'     THEN 'UK (Diaspora)'
    WHEN 'Caribbean Diaspora (UK)'   THEN 'UK (Diaspora)'
    WHEN 'African Diaspora (USA)'    THEN 'North America (Diaspora)'
    WHEN 'African Diaspora (Canada)' THEN 'North America (Diaspora)'
    WHEN 'Trinidad & Tobago'         THEN 'Trinidad and Tobago'
  END,
  updated_at = NOW()
WHERE market IN (
  'African Diaspora (UK)',
  'Caribbean Diaspora (UK)',
  'African Diaspora (USA)',
  'African Diaspora (Canada)',
  'Trinidad & Tobago'
);
