export type AgentName = 'ceo' | 'hr' | 'sales' | 'finance' | 'marketing' | 'seo'

export type DecisionStatus = 'pending' | 'approved' | 'skipped'

export interface Decision {
  id: string
  agent: AgentName
  title: string
  description: string
  action_type: string
  payload: Record<string, unknown>
  status: DecisionStatus
  priority: number
  created_at: string
  decided_at: string | null
  outcome: Record<string, unknown>
}

export interface Candidate {
  id: string
  name: string
  email: string | null
  phone: string | null
  position: string
  resume_text: string | null
  resume_url: string | null
  ai_score: number | null
  ai_summary: string | null
  strengths: string[]
  weaknesses: string[]
  status: 'new' | 'screened' | 'interview_scheduled' | 'rejected' | 'hired'
  interview_time: string | null
  created_at: string
}

export interface Lead {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  source: string | null
  stage: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  value: number | null
  last_contact: string | null
  notes: string | null
  ai_follow_up: string | null
  ai_priority_score: number | null
  created_at: string
}

export interface Invoice {
  id: string
  client: string
  amount: number
  currency: string
  due_date: string
  issued_date: string
  status: 'unpaid' | 'paid' | 'overdue' | 'flagged' | 'disputed'
  invoice_number: string | null
  items: InvoiceItem[]
  ai_flag: string | null
  days_overdue: number
  created_at: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface ContentPiece {
  id: string
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter' | null
  content_type: 'reel' | 'post' | 'story' | 'caption' | 'hook' | 'thread' | null
  title: string | null
  hook: string | null
  body: string | null
  cta: string | null
  status: 'draft' | 'approved' | 'published' | 'archived'
  performance: ContentPerformance
  ai_analysis: string | null
  ai_hook_suggestions: string[]
  created_at: string
  published_at: string | null
}

export interface ContentPerformance {
  views: number
  likes: number
  shares: number
  saves: number
  comments: number
}

export interface SeoContent {
  id: string
  keyword: string
  target_url: string | null
  search_volume: number | null
  keyword_difficulty: number | null
  competitor_urls: string[]
  competitor_analysis: CompetitorAnalysis[]
  content_brief: string | null
  draft_content: string | null
  word_count: number | null
  search_intent: 'informational' | 'commercial' | 'transactional' | 'navigational' | null
  estimated_rank_potential: number | null
  status: 'researching' | 'briefed' | 'drafted' | 'approved' | 'published'
  created_at: string
  published_at: string | null
}

export interface CompetitorAnalysis {
  url: string
  title: string
  word_count: number
  key_topics: string[]
  content_gaps: string[]
  score: number
}

export interface Briefing {
  id: string
  briefing_date: string
  summary: string | null
  hr_summary: string | null
  sales_summary: string | null
  finance_summary: string | null
  marketing_summary: string | null
  seo_summary: string | null
  tasks_assigned: BriefingTask[]
  kpis: Record<string, number | string>
  alerts: BriefingAlert[]
  created_at: string
}

export interface BriefingTask {
  department: AgentName
  task: string
  priority: 'high' | 'medium' | 'low'
  due: string
}

export interface BriefingAlert {
  level: 'critical' | 'warning' | 'info'
  department: AgentName
  message: string
}

export interface AgentLog {
  id: string
  agent: AgentName
  action: string
  details: Record<string, unknown>
  success: boolean
  error_message: string | null
  duration_ms: number | null
  created_at: string
}

export interface DashboardStats {
  pending_decisions: number
  open_leads: number
  overdue_invoices: number
  active_candidates: number
  pipeline_value: number
  overdue_amount: number
}
