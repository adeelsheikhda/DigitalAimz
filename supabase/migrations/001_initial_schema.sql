-- DigitalAimz AI Business OS — Initial Schema
-- Run this in your Supabase SQL editor

-- ===================================================
-- DECISIONS (the approve/skip queue — core of the OS)
-- ===================================================
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent VARCHAR(20) NOT NULL CHECK (agent IN ('ceo','hr','sales','finance','marketing','seo')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  payload JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','skipped')),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  decided_at TIMESTAMPTZ,
  outcome JSONB DEFAULT '{}'
);

CREATE INDEX idx_decisions_status ON decisions(status);
CREATE INDEX idx_decisions_agent ON decisions(agent);
CREATE INDEX idx_decisions_created ON decisions(created_at DESC);

-- ===================================================
-- HR: Candidates
-- ===================================================
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT NOT NULL,
  resume_text TEXT,
  resume_url TEXT,
  ai_score INTEGER CHECK (ai_score BETWEEN 0 AND 100),
  ai_summary TEXT,
  strengths JSONB DEFAULT '[]',
  weaknesses JSONB DEFAULT '[]',
  status VARCHAR(30) DEFAULT 'new' CHECK (status IN ('new','screened','interview_scheduled','rejected','hired')),
  interview_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================
-- SALES: Leads
-- ===================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  stage VARCHAR(30) DEFAULT 'new' CHECK (stage IN ('new','contacted','qualified','proposal','negotiation','won','lost')),
  value DECIMAL(12,2),
  last_contact TIMESTAMPTZ,
  notes TEXT,
  ai_follow_up TEXT,
  ai_priority_score INTEGER CHECK (ai_priority_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_priority ON leads(ai_priority_score DESC);

-- ===================================================
-- FINANCE: Invoices
-- ===================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(5) DEFAULT 'USD',
  due_date DATE NOT NULL,
  issued_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','overdue','flagged','disputed')),
  invoice_number TEXT UNIQUE,
  items JSONB DEFAULT '[]',
  ai_flag TEXT,
  days_overdue INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due ON invoices(due_date);

-- ===================================================
-- MARKETING: Content Pieces
-- ===================================================
CREATE TABLE IF NOT EXISTS content_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(30) CHECK (platform IN ('instagram','tiktok','youtube','linkedin','twitter')),
  content_type VARCHAR(30) CHECK (content_type IN ('reel','post','story','caption','hook','thread')),
  title TEXT,
  hook TEXT,
  body TEXT,
  cta TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','approved','published','archived')),
  performance JSONB DEFAULT '{"views":0,"likes":0,"shares":0,"saves":0,"comments":0}',
  ai_analysis TEXT,
  ai_hook_suggestions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- ===================================================
-- SEO: Research + Content
-- ===================================================
CREATE TABLE IF NOT EXISTS seo_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  target_url TEXT,
  search_volume INTEGER,
  keyword_difficulty INTEGER,
  competitor_urls JSONB DEFAULT '[]',
  competitor_analysis JSONB DEFAULT '[]',
  content_brief TEXT,
  draft_content TEXT,
  word_count INTEGER,
  search_intent VARCHAR(30) CHECK (search_intent IN ('informational','commercial','transactional','navigational')),
  estimated_rank_potential INTEGER CHECK (estimated_rank_potential BETWEEN 1 AND 100),
  status VARCHAR(20) DEFAULT 'researching' CHECK (status IN ('researching','briefed','drafted','approved','published')),
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_seo_keyword ON seo_content(keyword);
CREATE INDEX idx_seo_status ON seo_content(status);

-- ===================================================
-- CEO: Daily Briefings
-- ===================================================
CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_date DATE DEFAULT CURRENT_DATE UNIQUE,
  summary TEXT,
  hr_summary TEXT,
  sales_summary TEXT,
  finance_summary TEXT,
  marketing_summary TEXT,
  seo_summary TEXT,
  tasks_assigned JSONB DEFAULT '[]',
  kpis JSONB DEFAULT '{}',
  alerts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================
-- AGENT ACTIVITY LOG
-- ===================================================
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent VARCHAR(20) NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_logs_agent ON agent_logs(agent);
CREATE INDEX idx_logs_created ON agent_logs(created_at DESC);

-- ===================================================
-- SEED DATA (for demo/testing)
-- ===================================================

-- Sample candidates
INSERT INTO candidates (name, email, position, resume_text, status) VALUES
('Sarah Chen', 'sarah.chen@email.com', 'Senior SEO Strategist',
 'Sarah Chen — 6 years SEO, ex-HubSpot. Led organic growth from 50k to 2M monthly visitors. Expert in technical SEO, content strategy, AI-driven optimization. Python for scraping, GA4, Ahrefs, Semrush. Built and managed a team of 4 SEO specialists.',
 'new'),
('Marcus Williams', 'marcus.w@email.com', 'Sales Development Rep',
 'Marcus Williams — 3 years B2B SaaS sales. Consistent 120% quota attainment. Outreach.io, HubSpot CRM expert. Generated $1.2M ARR pipeline last quarter. Strong cold calling and email sequencing skills.',
 'new'),
('Priya Patel', 'priya.patel@dev.com', 'Full Stack Developer',
 'Priya Patel — 4 years Next.js/React, Node.js, PostgreSQL. Open source contributor. Built SaaS apps from 0 to 10k users. Strong TypeScript, API design, Supabase/Firebase. Available immediately.',
 'new');

-- Sample leads
INSERT INTO leads (name, company, email, source, stage, value, last_contact, notes) VALUES
('James Harrington', 'GrowthLab Agency', 'james@growthlab.io', 'LinkedIn', 'qualified', 8500, NOW() - INTERVAL '3 days', 'Interested in full SEO retainer. Asked for case studies. Follow up with proposal.'),
('Fatima Al-Rashid', 'Dubai Aesthetics Co', 'fatima@dubaiesthetics.ae', 'Referral', 'contacted', 12000, NOW() - INTERVAL '7 days', 'Referred by Halcyon Aesthetics. Wants social media + SEO package. Budget confirmed.'),
('Thomas Brennan', 'SkyTech Ltd', 'tbrennan@skytech.com', 'Cold Outreach', 'new', 5000, NOW() - INTERVAL '1 day', 'Opened 3 emails, no reply. Tech startup, needs content marketing strategy.'),
('Aisha Nkosi', 'Nkosi Consulting', 'aisha@nkosiconsult.com', 'Website', 'proposal', 15000, NOW() - INTERVAL '14 days', 'Sent proposal 2 weeks ago. No response. High value — needs immediate follow up.');

-- Sample invoices
INSERT INTO invoices (client, amount, currency, due_date, issued_date, status, invoice_number) VALUES
('GrowthLab Agency', 3500.00, 'USD', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '45 days', 'overdue', 'INV-2026-041'),
('Dubai Aesthetics Co', 2800.00, 'USD', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '35 days', 'overdue', 'INV-2026-038'),
('SkyTech Ltd', 1200.00, 'USD', CURRENT_DATE + INTERVAL '10 days', CURRENT_DATE - INTERVAL '20 days', 'unpaid', 'INV-2026-045'),
('Nkosi Consulting', 6500.00, 'USD', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '60 days', 'overdue', 'INV-2026-035'),
('Halcyon Aesthetics Dubai', 4200.00, 'USD', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE - INTERVAL '25 days', 'unpaid', 'INV-2026-047');

-- Sample content pieces
INSERT INTO content_pieces (platform, content_type, title, hook, status, performance) VALUES
('instagram', 'reel', 'Claude = Full Business Team',
 'I replaced my entire team with Claude. Here''s what happened after 30 days.',
 'published', '{"views":24500,"likes":1820,"shares":340,"saves":892,"comments":156}'),
('instagram', 'reel', 'Zero to Rank #1 with 0 Backlinks',
 'My client ranked #1 in 60 days with zero backlinks. This is exactly how.',
 'draft', '{"views":0,"likes":0,"shares":0,"saves":0,"comments":0}'),
('tiktok', 'reel', 'AI SEO Strategy 2026',
 'Google is not the same game anymore. Here''s how the top 1% are ranking now.',
 'approved', '{"views":8200,"likes":620,"shares":98,"saves":445,"comments":67}');

-- Sample SEO content
INSERT INTO seo_content (keyword, search_volume, keyword_difficulty, search_intent, status) VALUES
('AI business automation tools', 8900, 42, 'commercial', 'researching'),
('how to rank on google without backlinks', 3200, 38, 'informational', 'researching'),
('best SEO agency Dubai', 1400, 55, 'commercial', 'researching');
