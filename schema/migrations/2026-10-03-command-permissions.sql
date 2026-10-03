-- Fixes "permission denied for table command_gmail_tokens" (Postgres 42501).
-- The service_role key the app uses had no table-level GRANT on the command_*
-- tables, so every server-side read/write was rejected.
--
-- Also locks the tables down: the earlier "Service role full access" policies
-- were FOR ALL USING (true) with no role, which opens the tables to the public
-- anon key too. service_role bypasses RLS, and all app access goes through
-- supabaseAdmin (src/lib/supabase.ts), so those policies aren't needed.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'command_prospects', 'command_emails', 'command_campaigns', 'command_tasks',
    'command_sports_events', 'command_funding', 'command_ai_conversations',
    'command_gmail_tokens', 'command_prospect_activity', 'command_sports_hub_config'
  ]
  LOOP
    EXECUTE format('GRANT ALL ON TABLE %I TO service_role', t);
    EXECUTE format('REVOKE ALL ON TABLE %I FROM anon, authenticated', t);
    EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON %I', t);
  END LOOP;
END $$;
