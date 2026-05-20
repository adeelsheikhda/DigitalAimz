# Installation Guide — Windows Desktop App (.exe)

This builds the native Windows installer (`SEO Lead OS Setup x.y.z.exe`) from
the source, and explains how to install and run it. Building is done **once** on
any machine with Node.js; the resulting `.exe` is what you share with users.

> Prerequisite: finish [`SETUP.md`](SETUP.md) first — you'll need your Supabase
> **Project URL** and **anon key** to connect the app.

---

## A. Build the installer

You can build on Windows (recommended for a Windows target). Building Windows
installers on macOS/Linux also works but Windows is the smoothest.

1. Install **Node.js LTS** (v18 or newer): https://nodejs.org
2. Open a terminal in the repo and run:

   ```bash
   cd desktop
   npm install
   npm run dist
   ```

3. When it finishes, the installer is in **`desktop/dist/`**, named something
   like:

   ```
   SEO Lead OS Setup 1.0.0.exe
   ```

   That single file is the shareable installer.

> `npm run dist:dir` produces an *unpacked* app folder (no installer) for quick
> local testing — run `desktop/dist/win-unpacked/SEO Lead OS.exe`.

The portal (`web/`) is bundled into the app automatically, so the `.exe` is
self-contained and doesn't need the website to be deployed.

---

## B. Install on a Windows PC

1. Copy `SEO Lead OS Setup 1.0.0.exe` to the PC and double-click it.
2. Windows SmartScreen may warn because the app isn't code-signed — click
   **More info → Run anyway**. (To remove this warning permanently, sign the app;
   see "Code signing" below.)
3. Choose an install location, finish the wizard. A Desktop + Start Menu
   shortcut named **SEO Lead OS** is created.

---

## C. First run — connect to your workspace

The first time it launches, the app shows a **Setup** screen:

1. Paste your **Supabase Project URL** (e.g. `https://abcd1234.supabase.co`).
2. Paste your **anon public key** (`eyJ...`).
3. Click **Save & continue**.

These are stored locally on that PC. The app then shows the login screen — sign
in with the user you created in `SETUP.md`. From then on it opens straight to
the dashboard, in sync with the website and every other device.

> To change the connection later, the config lives in the app's user-data
> folder (`%APPDATA%/seo-lead-os/seo-lead-os.json`). Delete it to see the Setup
> screen again.

---

## D. (Optional) Code signing — remove the SmartScreen warning

Unsigned apps trigger a Windows warning. To sign:

1. Buy a Windows code-signing certificate (OV or EV) from a CA.
2. Set these env vars before `npm run dist`:
   ```bash
   set CSC_LINK=path\to\certificate.pfx
   set CSC_KEY_PASSWORD=your-cert-password
   ```
3. electron-builder signs the installer automatically.

---

## E. (Optional) Auto-updates

To let installed apps update themselves, add `electron-updater` and publish
releases (e.g. to GitHub Releases). Outline:

1. `npm install electron-updater` in `desktop/`.
2. Add a `publish` block to `electron-builder.yml` (e.g. `provider: github`).
3. Call `autoUpdater.checkForUpdatesAndNotify()` on app start in `main.js`.

This is optional and not required for the app to work.

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| `electron-builder` fails downloading binaries | Re-run `npm run dist`; check network/proxy. |
| App opens blank | Wrong Supabase URL/key. Delete `%APPDATA%/seo-lead-os/seo-lead-os.json` and re-enter on the Setup screen. |
| "Run anyway" warning | Expected for unsigned apps — see Code signing above. |
| Build fails on Linux/macOS for Windows target | Build on Windows, or install Wine; Windows is recommended. |
