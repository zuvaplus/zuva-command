CREATE TABLE IF NOT EXISTS command_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  contact TEXT,
  email TEXT NOT NULL,
  industry TEXT,
  market TEXT,
  size TEXT DEFAULT 'SME',
  website TEXT,
  stage TEXT DEFAULT 'New Lead',
  score INTEGER DEFAULT 1,
  notes TEXT,
  emails_sent INTEGER DEFAULT 0,
  last_contact DATE,
  follow_up_due DATE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS command_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID REFERENCES command_prospects(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  opened BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS command_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_name TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  package_tier TEXT,
  status TEXT DEFAULT 'Pending',
  start_date DATE,
  end_date DATE,
  budget_usd DECIMAL(10,2),
  impressions_delivered INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  revenue_usd DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS command_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tab TEXT NOT NULL,
  task TEXT NOT NULL,
  status TEXT DEFAULT 'Not Started',
  priority TEXT DEFAULT 'Medium',
  depends_on TEXT,
  notes TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS command_sports_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  school_or_team TEXT,
  sport TEXT,
  venue TEXT,
  event_date TIMESTAMPTZ,
  cloudflare_stream_key TEXT,
  cloudflare_stream_uid TEXT,
  status TEXT DEFAULT 'Scheduled',
  viewer_peak INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS command_funding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name TEXT NOT NULL,
  organization TEXT NOT NULL,
  amount_requested DECIMAL(10,2),
  amount_approved DECIMAL(10,2),
  status TEXT DEFAULT 'Research',
  submitted_at DATE,
  decision_date DATE,
  notes TEXT,
  next_action TEXT,
  next_action_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS command_ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO command_funding (program_name, organization, amount_requested, status, notes, next_action, next_action_date) VALUES
('Black Entrepreneurship Loan Fund', 'FACE Coalition', 25000, 'Deferred', 'Declined pre-revenue. Reapply 3 months after operations commence. Reviewer knows the file.', 'Reapply June-July 2027 after 3 months operating history post-launch', '2027-06-01'),
('Black Entrepreneur Startup Program (BESP)', 'Futurpreneur Canada', 75000, 'Research', 'Up to $75,000 collateral-free ($25K Futurpreneur + $50K BDC). Apply immediately after March 2027 launch. Business must be market-ready.', 'Prepare business plan and cash flow projections. Apply at launch.', '2027-03-01'),
('Startup Financing', 'BDC', 10000, 'Research', 'BDC startup programs for pre-revenue businesses. More flexible than banks. Can stack with Futurpreneur.', 'Research current BDC startup programs at bdc.ca', '2026-09-01'),
('Personal Line of Credit (bridge)', 'RBC', 15000, 'Research', 'Personal LOC for pilot camera purchase. Ask bank about maximum unsecured personal LOC.', 'Call RBC and ask: maximum unsecured personal LOC available', '2026-09-01');

ALTER TABLE command_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_sports_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_funding ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON command_prospects FOR ALL USING (true);
CREATE POLICY "Service role full access" ON command_emails FOR ALL USING (true);
CREATE POLICY "Service role full access" ON command_campaigns FOR ALL USING (true);
CREATE POLICY "Service role full access" ON command_tasks FOR ALL USING (true);
CREATE POLICY "Service role full access" ON command_sports_events FOR ALL USING (true);
CREATE POLICY "Service role full access" ON command_funding FOR ALL USING (true);
CREATE POLICY "Service role full access" ON command_ai_conversations FOR ALL USING (true);
