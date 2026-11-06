const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("desktop", {
  invoke: (method, ...args) => ipcRenderer.invoke("scp", method, ...args),
});
