-- Creators module: founding-creator recruitment pipeline.
-- Option lists mirror src/lib/creators.ts; country uses src/lib/markets.ts
-- (validated in the app, not here, since that list is long and changes).

CREATE TABLE IF NOT EXISTS command_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  primary_platform TEXT NOT NULL DEFAULT 'YouTube'
    CHECK (primary_platform IN ('YouTube', 'TikTok', 'Instagram', 'Facebook', 'X', 'Other')),
  profile_url TEXT,
  followers INTEGER CHECK (followers >= 0),
  avg_views INTEGER CHECK (avg_views >= 0),
  country TEXT,
  content_category TEXT CHECK (content_category IN (
    'entertainment', 'music', 'comedy', 'drama_series', 'news', 'nature', 'sports',
    'tech_innovation', 'science_education', 'health_wellness', 'documentary',
    'discussion_debate', 'interview', 'lifestyle_culture', 'other'
  )),
  primary_language TEXT,
  audience_diaspora_pct INTEGER CHECK (audience_diaspora_pct BETWEEN 0 AND 100),
  pain_signal BOOLEAN NOT NULL DEFAULT FALSE,
  stage TEXT NOT NULL DEFAULT 'Identified' CHECK (stage IN (
    'Identified', 'Contacted', 'Replied', 'Call Booked', 'Verbal Yes',
    'Signed', 'Onboarded', 'Declined', 'Parked'
  )),
  source TEXT,
  proposed_tier TEXT NOT NULL DEFAULT 'None'
    CHECK (proposed_tier IN ('Anchor', 'Core', 'Emerging', 'None')),
  -- 0–6, calculated by the app (src/lib/creators.ts recruitScore). Editable;
  -- recruit_score_manual = TRUE once edited by hand, so later changes to
  -- followers / diaspora % / pain signal don't overwrite a hand-set score.
  recruit_score INTEGER NOT NULL DEFAULT 0 CHECK (recruit_score BETWEEN 0 AND 6),
  recruit_score_manual BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  last_contact DATE,
  follow_up_due DATE,
  contact_method TEXT CHECK (contact_method IN ('DM', 'Email', 'WhatsApp', 'Referral')),
  -- Email address or WhatsApp number (+country code) only. Never bank or
  -- payment details — the CHECK rejects anything that isn't one of the two.
  contact_detail TEXT CHECK (
    contact_detail IS NULL
    OR contact_detail ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    OR contact_detail ~ '^\+[0-9][0-9 ()-]{6,19}$'
  ),
  -- The creator's account on the Zuva platform, linked once onboarded.
  -- (Also added by 2026-10-04-creators-zuva-user-id.sql for databases
  -- where this file was already run before the column existed.)
  zuva_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If an earlier version of this script already created the table without
-- zuva_user_id, CREATE TABLE IF NOT EXISTS skipped it — add it here so the
-- index below never fails. No-op when the column exists.
ALTER TABLE command_creators
  ADD COLUMN IF NOT EXISTS zuva_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Backstop against duplicate creators (the app also dedupes on a looser
-- normalised URL and on display name + platform).
CREATE UNIQUE INDEX IF NOT EXISTS command_creators_profile_url_key
  ON command_creators (lower(profile_url)) WHERE profile_url IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS command_creators_zuva_user_id_key
  ON command_creators (zuva_user_id) WHERE zuva_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS command_creators_stage_idx ON command_creators (stage);
CREATE INDEX IF NOT EXISTS command_creators_follow_up_due_idx ON command_creators (follow_up_due);

CREATE TABLE IF NOT EXISTS command_creator_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES command_creators(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- created, imported, stage_changed, score_updated, notes_updated, contacted
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS command_creator_activity_creator_idx
  ON command_creator_activity (creator_id, created_at DESC);

-- Same access model as the other command_* tables after
-- 2026-10-03-command-permissions.sql: only the server's service_role key can
-- read or write; RLS on with no policies blocks the public anon key.
ALTER TABLE command_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_creator_activity ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE command_creators, command_creator_activity TO service_role;
REVOKE ALL ON TABLE command_creators, command_creator_activity FROM anon, authenticated;
