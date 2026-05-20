# SEO Lead OS

A command center for an SEO team lead — projects, task delegation, money-page
tracking, team load, and an 80/20 strategy view. Runs as a **website/online
portal** and a **native Windows desktop app**, both backed by the same online
database so you can view, update, delete, and delegate tasks from any device.

## What's in the box

| Path | What it is |
|------|------------|
| `web/` | The portal — vanilla HTML/CSS/JS, no build step. Deploy anywhere static. |
| `desktop/` | Electron wrapper that packages the portal into a Windows `.exe`. |
| `supabase/` | Database schema + Row Level Security + Edge Functions for integrations. |
| `docs/` | Setup, installation, and integration guides. |

## Architecture

```
   Desktop .exe (Electron)  ─┐
                             ├─►  Supabase  ◄──►  Trello / ClickUp / Google Tasks
   Website / any browser   ─┘   (Postgres + Auth      (via Edge Functions)
                                 + Realtime + Functions)
```

- **One backend, Supabase**: hosted Postgres, authentication, an auto-generated
  secure API, realtime sync, and serverless functions — no separate servers to
  run. The portal talks to it directly; data is protected by Row Level Security.
- **Realtime**: a change on one device shows up on all the others instantly.
- **Integrations**: Trello, ClickUp, and Google Tasks sync runs inside Supabase
  Edge Functions, so API secrets never touch the browser or the `.exe`.

## Quickstart

1. **Stand up the backend** → [`docs/SETUP.md`](docs/SETUP.md)
2. **Deploy the website** (optional but recommended) → [`docs/SETUP.md`](docs/SETUP.md)
3. **Build & install the Windows app** → [`docs/INSTALLATION.md`](docs/INSTALLATION.md)
4. **Wire up Trello / ClickUp / Google Tasks** → [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md)

## Run the website locally

```bash
cp web/js/config.sample.js web/js/config.js   # then paste your Supabase URL + anon key
npx serve web                                  # open the printed http://localhost:... URL
```
