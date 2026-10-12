// Application de bureau : une fenêtre qui charge le jeu (dist/index.html), les sauvegardes sur disque, les mises à jour par GitHub Releases.
const { app, BrowserWindow, ipcMain, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");

if (process.env.FERME_SHOT) app.disableHardwareAcceleration(); // essai de capture : rendu logiciel
let win = null;
const isDev = process.argv.includes("--dev"); // npm run electron:dev : on charge le serveur de développement (npm run dev dans un autre terminal)
const savesDir = () => path.join(app.getPath("userData"), "saves");
const saveFile = (key) => path.join(savesDir(), key.replace(/[^a-z0-9_-]/gi, "_") + ".json");

// ---------- sauvegardes sur disque (copie de sécurité de celles du navigateur intégré) ----------
const pending = new Map(); // clé → contenu à écrire (on regroupe les écritures)
let flushTimer = null;
function flush() {
  flushTimer = null;
  fs.mkdirSync(savesDir(), { recursive: true });
  for (const [key, json] of pending) {
    const file = saveFile(key);
    try {
      if (fs.existsSync(file)) fs.copyFileSync(file, file + ".bak"); // la partie précédente reste disponible
      fs.writeFileSync(file + ".tmp", json);
      fs.renameSync(file + ".tmp", file);
    } catch (e) {
      console.error("sauvegarde impossible", e);
    }
  }
  pending.clear();
}
ipcMain.on("save:write", (_e, key, json) => {
  pending.set(key, json);
  if (!flushTimer) flushTimer = setTimeout(flush, 1500);
});
ipcMain.on("save:read", (e, key) => {
  try {
    e.returnValue = fs.readFileSync(saveFile(key), "utf8");
  } catch {
    e.returnValue = null;
  }
});
ipcMain.on("app:version", (e) => {
  e.returnValue = app.getVersion();
});
app.on("before-quit", () => {
  if (pending.size) flush();
});

// ---------- mises à jour (GitHub Releases) ----------
const send = (payload) => win && !win.isDestroyed() && win.webContents.send("update", payload);
let updater = null;
function setupUpdater() {
  if (!app.isPackaged) return; // pas de mise à jour en développement
  const { autoUpdater } = require("electron-updater");
  updater = autoUpdater;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true; // installée à la fermeture du jeu si le joueur ne redémarre pas tout de suite
  autoUpdater.on("checking-for-update", () => send({ state: "checking" }));
  autoUpdater.on("update-available", (info) => send({ state: "downloading", version: info.version, percent: 0 }));
  autoUpdater.on("update-not-available", () => send({ state: "none" }));
  autoUpdater.on("download-progress", (p) => send({ state: "downloading", percent: Math.round(p.percent) }));
  autoUpdater.on("update-downloaded", (info) => send({ state: "ready", version: info.version }));
  autoUpdater.on("error", (err) => send({ state: "error", message: String((err && err.message) || err).slice(0, 160) }));
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 4000); // au lancement
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 4 * 3600 * 1000); // puis toutes les 4 heures
}
ipcMain.on("update:check", () => {
  if (!updater) return send({ state: "dev" });
  updater.checkForUpdates().catch(() => {});
});
ipcMain.on("update:install", () => updater && updater.quitAndInstall());

// ---------- fenêtre ----------
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0f5088",
    title: "Ferme",
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, "preload.cjs"), contextIsolation: true, nodeIntegration: false },
  });
  Menu.setApplicationMenu(null);
  if (isDev) win.loadURL("http://127.0.0.1:5175/");
  else win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  if (process.env.FERME_SHOT) {
    // essai : capture d'écran de la fenêtre puis on quitte
    win.webContents.once("did-finish-load", () =>
      setTimeout(async () => {
        const img = await win.webContents.capturePage();
        fs.writeFileSync(process.env.FERME_SHOT, img.toPNG());
        app.quit();
      }, 5000),
    );
  }
  win.webContents.on("before-input-event", (_e, input) => {
    if (input.type === "keyDown" && input.key === "F11") win.setFullScreen(!win.isFullScreen());
  });
}

app.whenReady().then(() => {
  createWindow();
  setupUpdater();
  app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});
app.on("window-all-closed", () => app.quit());
