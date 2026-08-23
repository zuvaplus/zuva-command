-- Gmail OAuth tokens (one row — Dexter's account)
CREATE TABLE IF NOT EXISTS command_gmail_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry_date BIGINT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prospect activity log
CREATE TABLE IF NOT EXISTS command_prospect_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES command_prospects(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- email_generated, email_sent, stage_changed, note_added, score_updated
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zuva Sports hub-school tracker config (one row, same "singleton" pattern as
-- command_gmail_tokens above). Neither storage option the task spec offered
-- fit cleanly: command_sports_events is a list of individual events with no
-- "parent" row to attach a JSONB column to, and stuffing JSON into a task's
-- notes field is fragile (a stray edit to that task's notes would corrupt
-- the tracker). A small dedicated config table is the same shape as the
-- Gmail tokens table above, so it fits the existing schema conventions.
CREATE TABLE IF NOT EXISTS command_sports_hub_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE command_gmail_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_prospect_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_sports_hub_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON command_gmail_tokens FOR ALL USING (true);
CREATE POLICY "Service role full access" ON command_prospect_activity FOR ALL USING (true);
CREATE POLICY "Service role full access" ON command_sports_hub_config FOR ALL USING (true);
