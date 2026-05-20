# Integrations Guide — Trello, ClickUp, Google Tasks

The app can mirror your tasks into Trello, ClickUp, and/or Google Tasks. Sync
runs inside **Supabase Edge Functions**, so the API secrets live on the server,
never in the browser or the `.exe`. You click **Sync now** on the
**Integrations** page in the app and tasks flow out (and completion status flows
back).

> Prerequisite: the Supabase CLI, linked to your project (see end of
> [`SETUP.md`](SETUP.md)):
> ```bash
> npm install -g supabase
> supabase login
> supabase link --project-ref <your-project-ref>
> ```

You only need to set up the provider(s) you actually use.

---

## Deploy the functions

```bash
supabase functions deploy sync-trello
supabase functions deploy sync-clickup
supabase functions deploy sync-google-tasks
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
provided to functions automatically by Supabase — you don't set those.

---

## Trello

1. Get an **API key**: log in to Trello, visit
   https://trello.com/power-ups/admin → create a Power-Up → copy the **API key**.
2. Generate a **token**: on the same page click "Token" (or visit the
   authorization URL it gives you) and approve. Copy the token.
3. Find your **list ID**: open your Trello board, add `.json` to the board URL,
   and find the `id` of the list you want tasks in. (Or use any Trello list-ID
   helper.)
4. Set the secrets:
   ```bash
   supabase secrets set TRELLO_KEY=xxxx TRELLO_TOKEN=xxxx TRELLO_LIST_ID=xxxx
   ```
5. In the app → **Integrations → Trello → Sync now**. Each task becomes a card;
   completing a card marks the task done on the next sync.

---

## ClickUp

1. Get a **personal API token**: ClickUp → avatar → **Settings → Apps →
   API Token → Generate**.
2. Find your **list ID**: open the target List in ClickUp; the URL contains it,
   or use **List settings → Copy link**. It's the numeric id after `/li/` or in
   the link.
3. Set the secrets:
   ```bash
   supabase secrets set CLICKUP_TOKEN=pk_xxxx CLICKUP_LIST_ID=123456789
   ```
4. In the app → **Integrations → ClickUp → Sync now**.

> ClickUp statuses vary per space. The function maps to `to do` / `complete`;
> if your list uses different status names, adjust the `status` value in
> `supabase/functions/sync-clickup/index.ts` and redeploy.

---

## Google Tasks

This one needs a Google OAuth client (a bit more setup).

1. Go to **https://console.cloud.google.com** → create/select a project.
2. **APIs & Services → Library →** enable **Google Tasks API**.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Configure the consent screen (External, add your email as a test user).
   - Application type: **Web application**. Add an authorized redirect URI you
     can use to capture a code, e.g. `https://developers.google.com/oauthplayground`.
4. Get a **refresh token** (easiest via the OAuth Playground):
   - Open https://developers.google.com/oauthplayground
   - Gear icon → tick **Use your own OAuth credentials**, paste your client ID +
     secret.
   - In the scope box add `https://www.googleapis.com/auth/tasks`, authorize,
     then **Exchange authorization code for tokens**. Copy the **refresh token**.
5. Find your **tasklist ID**: with a token you can `GET`
   `https://tasks.googleapis.com/tasks/v1/users/@me/lists`; the default list id
   is often `@default` — you can use that literally.
6. Set the secrets:
   ```bash
   supabase secrets set \
     GOOGLE_CLIENT_ID=xxxx \
     GOOGLE_CLIENT_SECRET=xxxx \
     GOOGLE_REFRESH_TOKEN=xxxx \
     GOOGLE_TASKLIST_ID=@default
   ```
7. In the app → **Integrations → Google Tasks → Sync now**.

---

## How sync works

- **Push** (default on every "Sync now"): each task is created as a
  card/task/Google Task the first time, then updated on later syncs. A mapping
  is stored in the `task_sync_map` table so the same task always maps to the
  same external item — no duplicates.
- **Pull**: completion status from the external tool is read back and applied to
  the task's `done` flag.
- The **Integrations** page shows **Connected** when the matching secrets are
  present, **Not configured** otherwise.

## Security notes

- Secrets are stored as Supabase **function secrets** (server-side env), never
  exposed to clients.
- The `integration_connections` and `task_sync_map` tables have no client
  policies — only the service role (inside the functions) can touch them.
- Every function verifies the caller is a logged-in user before doing anything.

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| Badge stays "Not configured" | Secrets missing/mistyped. Re-run `supabase secrets set ...` and redeploy the function. |
| "unauthorized" toast | You're not logged in, or the JWT expired — sign in again. |
| Google "auth failed" | Refresh token revoked/expired, or wrong client id/secret. Regenerate the refresh token. |
| Tasks duplicated | Don't delete rows from `task_sync_map`; it's what prevents duplicates. |
