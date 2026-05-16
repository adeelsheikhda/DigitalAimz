-- DigitalAimz — Tasks Table
-- Run this in Supabase SQL Editor after 001_initial_schema.sql

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  department VARCHAR(20) CHECK (department IN ('ceo','hr','sales','finance','marketing','seo','unassigned')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','cancelled')),
  due_date DATE,
  ai_assigned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tasks_department ON tasks(department);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Sample tasks
INSERT INTO tasks (title, description, department, priority, status) VALUES
('Follow up with Nkosi Consulting', 'Proposal sent 2 weeks ago — no response. High value lead at $15k.', 'sales', 'high', 'todo'),
('Disavow spam backlinks on zelajet.com', 'Telegram link scheme detected. File Google Disavow immediately.', 'seo', 'high', 'todo'),
('Screen 3 new SEO candidates', 'Resume text added for Sarah Chen, Marcus Williams, Priya Patel.', 'hr', 'medium', 'todo'),
('Chase overdue invoice INV-2026-035', 'Nkosi Consulting — $6,500 — 30 days overdue.', 'finance', 'high', 'todo'),
('Create 3 reel hooks for AI content series', 'Build on the Claude = Full Business Team angle.', 'marketing', 'medium', 'todo');
