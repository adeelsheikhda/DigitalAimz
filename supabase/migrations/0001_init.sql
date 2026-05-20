-- ============================================================================
-- SEO Lead OS — initial schema, RLS, realtime, seed
-- Single shared team workspace (MVP). Authenticated users only.
-- ============================================================================

-- ---- PROFILES (mirrors auth.users) ----------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'member' check (role in ('lead', 'member')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- TEAM MEMBERS (assignment roster) -------------------------------------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  color text default '#8c8679',
  capacity int not null default 6,
  focus_project_id uuid,
  created_at timestamptz not null default now()
);

-- ---- PROJECTS --------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  color text default '#8c8679',
  priority text not null default 'mid' check (priority in ('critical','high','mid','low')),
  health int not null default 0 check (health between 0 and 100),
  note text,
  created_at timestamptz not null default now()
);

alter table public.team_members
  add constraint team_members_focus_project_fk
  foreign key (focus_project_id) references public.projects (id) on delete set null;

-- ---- TASKS -----------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assignee_id uuid references public.team_members (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  priority text not null default 'high' check (priority in ('critical','high','progress')),
  type text not null default 't-tech' check (type in ('t-tech','t-content','t-audit','t-link','t-report')),
  due text,
  done boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- ---- MONEY PAGES -----------------------------------------------------------
create table if not exists public.money_pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete set null,
  url text not null,
  keyword text,
  position int default 0,
  pos_change int default 0,
  impressions int default 0,
  ctr text,
  status text not null default 'stable' check (status in ('drop','rising','stable')),
  action text,
  created_at timestamptz not null default now()
);

-- ---- INTEGRATION CONNECTIONS ----------------------------------------------
-- Non-secret mapping only. Real tokens live in Supabase function secrets.
create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('trello','clickup','google')),
  config jsonb not null default '{}'::jsonb,
  secret_ref text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (provider)
);

-- ---- TASK SYNC MAP (two-way external sync) --------------------------------
create table if not exists public.task_sync_map (
  task_id uuid not null references public.tasks (id) on delete cascade,
  provider text not null check (provider in ('trello','clickup','google')),
  external_id text not null,
  updated_at timestamptz not null default now(),
  primary key (task_id, provider)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- MVP: any authenticated user (the team) can read/write workspace data.
-- integration_connections + task_sync_map are service-role only.
-- ============================================================================
alter table public.profiles               enable row level security;
alter table public.team_members           enable row level security;
alter table public.projects               enable row level security;
alter table public.tasks                  enable row level security;
alter table public.money_pages            enable row level security;
alter table public.integration_connections enable row level security;
alter table public.task_sync_map          enable row level security;

-- profiles: a user manages their own row; everyone authenticated can read.
drop policy if exists "profiles_read"  on public.profiles;
drop policy if exists "profiles_write" on public.profiles;
create policy "profiles_read"  on public.profiles for select to authenticated using (true);
create policy "profiles_write" on public.profiles for update to authenticated using (auth.uid() = id);

-- shared workspace tables: full access to authenticated users.
do $$
declare t text;
begin
  foreach t in array array['team_members','projects','tasks','money_pages']
  loop
    execute format('drop policy if exists "%1$s_all" on public.%1$s;', t);
    execute format('create policy "%1$s_all" on public.%1$s for all to authenticated using (true) with check (true);', t);
  end loop;
end$$;

-- integration_connections + task_sync_map: no policies for authenticated =>
-- only the service role (Edge Functions) can touch them.

-- ============================================================================
-- REALTIME — broadcast changes so every device stays in sync
-- ============================================================================
do $$
begin
  alter publication supabase_realtime add table public.tasks;
  alter publication supabase_realtime add table public.projects;
  alter publication supabase_realtime add table public.money_pages;
  alter publication supabase_realtime add table public.team_members;
exception when others then null;
end$$;

-- ============================================================================
-- SEED — mirrors the original prototype so the app looks identical on day one
-- ============================================================================
insert into public.projects (name, url, color, priority, health, note) values
  ('Airport Transfer DE','de-transfer.com','#d4522a','critical',72,'Money site. Pos drops on 2 key pages. Assign tech + content fix this week.'),
  ('Custom Packaging','packboxco.com','#e8a020','high',55,'Content gap vs competitors. Need 3 new service pages + backlinks.'),
  ('Client Site B','client-b.com','#7b52d4','high',40,'404 errors hurting crawl. Fix tech issues before adding content.'),
  ('Social Media Services','smm-client.com','#2a6dd4','mid',80,'Stable. Keep momentum. Run weekly report.'),
  ('Client Site A','client-a.com','#2ab87a','low',90,'Almost done. Schema task remaining.'),
  ('Ecomm Store','ecomm.com','#8c7030','low',95,'Maintenance only. No active tasks needed this week.')
on conflict do nothing;

insert into public.team_members (name, role, color, capacity, focus_project_id) values
  ('Zara','Content Writer','#d4522a',6,(select id from public.projects where name='Custom Packaging')),
  ('Bilal','Tech SEO','#2a6dd4',7,(select id from public.projects where name='Airport Transfer DE')),
  ('Hira','Link Builder','#2ab87a',6,(select id from public.projects where name='Client Site B')),
  ('Usman','SEO Analyst','#7b52d4',6,(select id from public.projects where name='Social Media Services'))
on conflict do nothing;

insert into public.tasks (title, assignee_id, project_id, priority, type, due, done) values
  ('Fix title tag on /airport-transfer-munich page',(select id from public.team_members where name='Bilal'),(select id from public.projects where name='Airport Transfer DE'),'critical','t-tech','Today',false),
  ('Write 1500w guide: "Munich to Frankfurt transfer"',(select id from public.team_members where name='Zara'),(select id from public.projects where name='Airport Transfer DE'),'critical','t-content','Today',false),
  ('Build 5 contextual backlinks to /packaging-boxes',(select id from public.team_members where name='Hira'),(select id from public.projects where name='Custom Packaging'),'high','t-link','Thu',false),
  ('Fix 404 errors in GSC — 12 URLs flagged',(select id from public.team_members where name='Bilal'),(select id from public.projects where name='Client Site B'),'high','t-tech','Wed',false),
  ('Update meta descriptions for top 10 product pages',(select id from public.team_members where name='Zara'),(select id from public.projects where name='Custom Packaging'),'high','t-content','Fri',false),
  ('Run weekly rank tracking report — all projects',(select id from public.team_members where name='Usman'),(select id from public.projects where name='Social Media Services'),'progress','t-report','Fri',false),
  ('Submit updated sitemap to GSC',(select id from public.team_members where name='Bilal'),(select id from public.projects where name='Ecomm Store'),'progress','t-tech','Today',true),
  ('Add schema markup to /services page',(select id from public.team_members where name='Bilal'),(select id from public.projects where name='Client Site A'),'progress','t-tech','Thu',false),
  ('Keyword research: packaging niche gaps',(select id from public.team_members where name='Usman'),(select id from public.projects where name='Custom Packaging'),'high','t-audit','Wed',false),
  ('Internal linking audit — airport site',(select id from public.team_members where name='Usman'),(select id from public.projects where name='Airport Transfer DE'),'critical','t-audit','Today',false),
  ('Outreach list: 20 prospects for Custom Packaging',(select id from public.team_members where name='Hira'),(select id from public.projects where name='Custom Packaging'),'progress','t-link','Fri',false),
  ('Competitor gap analysis — SMM client',(select id from public.team_members where name='Usman'),(select id from public.projects where name='Social Media Services'),'progress','t-audit','Fri',true)
on conflict do nothing;

insert into public.money_pages (project_id, url, keyword, position, pos_change, impressions, ctr, status, action) values
  ((select id from public.projects where name='Airport Transfer DE'),'/airport-transfer-munich','airport transfer munich',4,-2,8400,'6.2%','drop','Update title + add FAQ'),
  ((select id from public.projects where name='Custom Packaging'),'/custom-packaging-boxes','custom packaging boxes uk',2,0,12100,'8.1%','stable','Monitor'),
  ((select id from public.projects where name='Social Media Services'),'/instagram-followers','buy instagram followers',7,1,5300,'3.4%','rising','Add social proof section'),
  ((select id from public.projects where name='Airport Transfer DE'),'/airport-transfer-frankfurt','airport transfer frankfurt',11,-4,6700,'2.1%','drop','Full content refresh needed'),
  ((select id from public.projects where name='Custom Packaging'),'/eco-packaging-wholesale','eco packaging wholesale',6,-1,4200,'4.7%','drop','Add E-E-A-T signals'),
  ((select id from public.projects where name='Social Media Services'),'/smm-panel-services','smm panel cheap',3,2,3900,'5.9%','rising','Monitor + protect'),
  ((select id from public.projects where name='Custom Packaging'),'/branded-boxes-uk','branded boxes uk',14,-6,7800,'1.8%','drop','URGENT: backlinks + content'),
  ((select id from public.projects where name='Airport Transfer DE'),'/airport-zurich-transfer','zurich airport transfer',5,0,3100,'5.1%','stable','Internal linking boost')
on conflict do nothing;
