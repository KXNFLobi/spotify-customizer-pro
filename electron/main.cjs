const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { Service } = require("./service.cjs");
const { validateTheme } = require("./theme.cjs");
let win, service;
const loginPath = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
app.requestSingleInstanceLock() || app.quit();
app.on("second-instance", () => {
  win?.show();
  win?.focus();
});
app.whenReady().then(() => {
  service = new Service(
    app.getPath("userData"),
    process.platform,
    undefined,
    app.isPackaged
      ? path.join(process.resourcesPath, "spicetify", "spicetify.exe")
      : path.join(__dirname, "..", "vendor", "spicetify", "spicetify.exe"),
  );
  win = new BrowserWindow({
    width: 1500,
    height: 960,
    minWidth: 1050,
    minHeight: 720,
    backgroundColor: "#0b0d12",
    title: "Spotify Customizer Pro",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  const dev = process.argv.includes("--dev") && !app.isPackaged;
  const source = dev ? "http://127.0.0.1:5173" : null;
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (e) => e.preventDefault());
  ipcMain.handle("scp", async (event, method, ...args) => {
    const url = event.senderFrame?.url || "";
    if (
      event.sender !== win.webContents ||
      !(dev
        ? url.startsWith(source + "/")
        : url ===
          require("node:url").pathToFileURL(
            path.join(__dirname, "../dist/index.html"),
          ).href)
    )
      throw Error("Origem não permitida");
    switch (method) {
      case "status":
        return {
          ...(await service.status()),
          startup: app.getLoginItemSettings({ path: loginPath }).openAtLogin,
        };
      case "apply":
        return service.apply(args[0]);
      case "restore":
        return service.restore();
      case "recover":
        return service.recover(args[0]);
      case "history":
        return service.history();
      case "profiles":
        return service.profiles();
      case "save":
        return service.save(args[0]);
      case "extensions":
        return service.extensions();
      case "toggleExtension":
        return service.toggleExtension(args[0], args[1]);
      case "startup":
        if (process.platform !== "win32" || !app.isPackaged)
          throw Error("Disponível na versão compilada para Windows.");
        if (typeof args[0] !== "boolean") throw Error("Valor inválido");
        app.setLoginItemSettings({
          openAtLogin: args[0],
          path: loginPath,
          args: [],
        });
        return app.getLoginItemSettings({ path: loginPath }).openAtLogin;
      case "import": {
        const r = await dialog.showOpenDialog(win, {
          filters: [{ name: "Tema JSON", extensions: ["json"] }],
          properties: ["openFile"],
        });
        if (r.canceled) return null;
        const st = await fs.stat(r.filePaths[0]);
        if (st.size > 150000) throw Error("Arquivo maior que 150 KB");
        return validateTheme(
          JSON.parse(await fs.readFile(r.filePaths[0], "utf8")),
        );
      }
      case "export": {
        const t = validateTheme(args[0]);
        const r = await dialog.showSaveDialog(win, {
          defaultPath: t.name.replace(/[^\w -]/g, "") + ".json",
          filters: [{ name: "Tema JSON", extensions: ["json"] }],
        });
        if (r.canceled) return false;
        await fs.writeFile(r.filePath, JSON.stringify(t, null, 2));
        return true;
      }
      case "plugin": {
        const r = await dialog.showOpenDialog(win, {
          filters: [{ name: "Plugin visual CSS local", extensions: ["css"] }],
          properties: ["openFile"],
        });
        if (r.canceled) return null;
        const st = await fs.stat(r.filePaths[0]);
        if (st.size > 50000) throw Error("CSS maior que 50 KB");
        const css = await fs.readFile(r.filePaths[0], "utf8");
        return { name: path.basename(r.filePaths[0]), css };
      }
      case "docs":
        await shell.openExternal("https://spicetify.app/docs/getting-started");
        return true;
      default:
        throw Error("Operação desconhecida");
    }
  });
  if (dev) win.loadURL(source);
  else win.loadFile(path.join(__dirname, "../dist/index.html"));
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
