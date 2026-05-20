# Setup Guide — Backend + Website

This gets the online database running and (optionally) deploys the website.
Takes about 15 minutes. No coding required.

---

## 1. Create the database (Supabase)

1. Go to **https://supabase.com** → sign up (free tier is enough to start).
2. Click **New project**. Pick a name (e.g. `seo-lead-os`), a strong database
   password, and a region close to your team. Wait ~2 minutes for it to build.
3. In the project, open **SQL Editor** → **New query**.
4. Open `supabase/migrations/0001_init.sql` from this repo, copy its entire
   contents, paste into the editor, and click **Run**.
   - This creates all tables, security rules, realtime, and seeds the demo data
     (the projects/tasks/money pages you saw in the prototype).
5. Open **Project Settings → API** and copy two values — you'll need them next:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **anon public** key (a long `eyJ...` string)

> The anon key is meant to be public/shipped to clients. Your data is protected
> by Row Level Security, which only lets **logged-in** users read/write.

---

## 2. Create your first login

1. In Supabase, open **Authentication → Users → Add user → Create new user**.
2. Enter your email + a password, and tick **Auto Confirm User**.
3. (Optional) Repeat for each team member who should log in. The roster of
   people you *assign tasks to* (Zara, Bilal, …) is separate and already seeded
   in the `team_members` table — edit it under **Table Editor → team_members**.

### Email confirmation (optional)
By default Supabase asks new sign-ups to confirm their email. For a small team
you can turn this off under **Authentication → Providers → Email →** disable
"Confirm email", or just create users manually as above with Auto Confirm.

---

## 3. Try it locally (optional but recommended)

```bash
cp web/js/config.sample.js web/js/config.js
```

Edit `web/js/config.js` and paste your Project URL + anon key:

```js
window.__CONFIG = {
  SUPABASE_URL: "https://abcd1234.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi...",
};
```

Then serve the folder and open the printed URL:

```bash
npx serve web
```

Log in with the user you created. You should see the seeded projects, tasks,
money pages, and team load — all live.

---

## 4. Deploy the website (so any device can use it)

The `web/` folder is plain static files — host it anywhere. **Netlify** example:

1. Push this repo to GitHub (already on branch
   `claude/seo-lead-os-windows-app-gPOvE`).
2. On **https://netlify.com** → **Add new site → Import an existing project** →
   pick the repo.
3. Build settings:
   - **Build command:** leave empty
   - **Publish directory:** `web`
4. Before the first deploy, make sure `web/js/config.js` contains your real
   Supabase URL + anon key (commit it, or generate it in a build step).
   - Simple path: commit a `web/js/config.js` with your values (safe — anon key
     is public).
   - CI path: add a build command that writes `config.js` from environment
     variables `SUPABASE_URL` / `SUPABASE_ANON_KEY`.
5. Deploy. Share the URL with your team. They log in from any browser/phone.

> **Cloudflare Pages / Vercel / GitHub Pages** work the same way — publish the
> `web` directory.

---

## 5. (Optional) Install the Supabase CLI for functions & migrations

Only needed for the task-manager integrations (next guide) or to manage the
schema from the command line.

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>   # ref is in your project URL
supabase db push                                  # applies migrations/*.sql
```

➡️ Continue to [`INSTALLATION.md`](INSTALLATION.md) to build the Windows app, or
[`INTEGRATIONS.md`](INTEGRATIONS.md) to connect Trello/ClickUp/Google Tasks.

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| Yellow "Supabase is not configured" banner | `web/js/config.js` still has placeholder values. Paste your real URL + anon key. |
| Login says "Invalid login credentials" | User doesn't exist or wrong password. Create/confirm the user in Authentication → Users. |
| Logged in but no data | Re-run `0001_init.sql`; confirm tables exist under Table Editor. |
| Data doesn't sync between devices | Realtime is enabled by the migration. Confirm under Database → Replication that `tasks/projects/...` are in the `supabase_realtime` publication. |
