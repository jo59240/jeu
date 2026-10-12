// Le pont entre le jeu (la page) et l'application : sauvegardes sur disque et mises à jour.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ferme", {
  isDesktop: true,
  version: ipcRenderer.sendSync("app:version"),
  readSave: (key) => ipcRenderer.sendSync("save:read", key),
  writeSave: (key, json) => ipcRenderer.send("save:write", key, json),
  onUpdate: (cb) => ipcRenderer.on("update", (_e, payload) => cb(payload)),
  checkUpdate: () => ipcRenderer.send("update:check"),
  installUpdate: () => ipcRenderer.send("update:install"),
});
