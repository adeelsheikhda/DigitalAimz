const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const Store = require("electron-store");

const store = new Store({ name: "seo-lead-os" });

// Web assets are copied into the build as "extraResources/web" (see
// electron-builder.yml). In dev we load them straight from ../web.
function webDir() {
  const packaged = path.join(process.resourcesPath, "web");
  if (app.isPackaged && fs.existsSync(packaged)) return packaged;
  return path.join(__dirname, "..", "web");
}

function hasConfig() {
  return !!store.get("supabaseUrl") && !!store.get("supabaseAnonKey");
}

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#f5f3ee",
    title: "SEO Lead OS",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: false, // preload injects window.__CONFIG into the page
      nodeIntegration: false,
      sandbox: false,
    },
  });
  win.setMenuBarVisibility(false);

  if (hasConfig()) {
    win.loadFile(path.join(webDir(), "login.html"));
  } else {
    win.loadFile(path.join(__dirname, "settings.html"));
  }
}

// Renderer (settings.html) saves credentials, then we reload into the app.
ipcMain.handle("save-config", (_e, { url, anonKey }) => {
  store.set("supabaseUrl", String(url || "").trim());
  store.set("supabaseAnonKey", String(anonKey || "").trim());
  win.loadFile(path.join(webDir(), "login.html"));
  return true;
});

// preload asks for the stored config to inject before the portal scripts run.
ipcMain.on("get-config-sync", (e) => {
  e.returnValue = {
    SUPABASE_URL: store.get("supabaseUrl") || "",
    SUPABASE_ANON_KEY: store.get("supabaseAnonKey") || "",
  };
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
