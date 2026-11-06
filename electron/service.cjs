const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { validateTheme, renderTheme } = require("./theme.cjs");
const exec = promisify(execFile);
const exists = async (p) => !!p && !!(await fs.stat(p).catch(() => null));
async function atomic(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file + ".tmp", data);
  await fs.rename(file + ".tmp", file);
}
class Service {
  constructor(
    root,
    platform = process.platform,
    runner = exec,
    bundledPath = null,
  ) {
    this.root = root;
    this.platform = platform;
    this.runner = runner;
    this.busy = false;
    this.bundledPath = bundledPath;
  }
  async run(args) {
    if (!this.exe)
      throw Error(
        "Motor Spicetify não encontrado. Use a distribuição portátil completa ou configure o CLI oficial.",
      );
    const r = await this.runner(this.exe, args, {
      windowsHide: true,
      timeout: 180000,
      maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, NO_COLOR: "1" },
    });
    return r.stdout.trim();
  }
  async config() {
    const output = await this.run(["-c"]);
    const file = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => path.isAbsolute(line))
      .at(-1);
    if (!file)
      throw Error(
        "O motor Spicetify não informou um caminho de configuração válido.",
      );
    if (!(await exists(file))) {
      // Primeiro uso: inicializa só a configuração do CLI, sem backup/apply no Spotify.
      await this.run(["config"]);
      if (!(await exists(file)))
        throw Error(
          "Não foi possível inicializar o motor Spicetify. Confira o diagnóstico.",
        );
    }
    return file;
  }
  async status() {
    let exe = null;
    for (const p of [
      path.join(process.env.LOCALAPPDATA || "", "spicetify", "spicetify.exe"),
      path.join(
        process.env.USERPROFILE || "",
        "spicetify-cli",
        "spicetify.exe",
      ),
    ])
      if (await exists(p)) {
        exe = p;
        break;
      }
    if (!exe && this.platform === "win32") {
      const r = await this.runner("where.exe", ["spicetify.exe"], {
        windowsHide: true,
      }).catch(() => null);
      exe = r?.stdout.split(/\r?\n/).find((p) => path.isAbsolute(p.trim()));
    }
    if (!exe && (await exists(this.bundledPath))) exe = this.bundledPath;
    this.exe = exe?.trim();
    let version = "",
      config = "",
      spotify = "",
      error = "";
    if (this.exe)
      try {
        version = await this.run(["-v"]);
        config = await this.config();
        const ini = await fs.readFile(config, "utf8");
        spotify = ini.match(/^spotify_path\s*=\s*(.+)$/m)?.[1].trim() || "";
      } catch (e) {
        error = e.message;
      }
    const spotifyFound = await exists(path.join(spotify, "Spotify.exe"));
    const store = /WindowsApps/i.test(spotify);
    return {
      platform: this.platform,
      spicetify: version,
      config,
      spotify,
      ready:
        this.platform === "win32" &&
        !!version &&
        !!config &&
        spotifyFound &&
        !store &&
        !error,
      error:
        error ||
        (store
          ? "Instalação Microsoft Store não suportada neste aplicativo. Use o instalador desktop do Spotify."
          : !spotifyFound
            ? "Configure spotify_path no Spicetify para a instalação desktop."
            : ""),
      compatibility:
        "A compatibilidade exata é verificada pelo Spicetify durante backup/apply. Seletores visuais podem variar entre versões.",
    };
  }
  async exclusive(fn) {
    if (this.busy) throw Error("Outra operação está em andamento.");
    this.busy = true;
    try {
      return await fn();
    } finally {
      this.busy = false;
    }
  }
  async guard() {
    const s = await this.status();
    if (!s.ready)
      throw Error(
        s.error || "A aplicação exige Windows 11 e Spicetify configurado.",
      );
    return s;
  }
  async history() {
    return JSON.parse(
      await fs
        .readFile(path.join(this.root, "history.json"), "utf8")
        .catch(() => "[]"),
    );
  }
  async record(event) {
    const h = await this.history();
    h.unshift({ date: new Date().toISOString(), ...event });
    await atomic(
      path.join(this.root, "history.json"),
      JSON.stringify(h.slice(0, 200), null, 2),
    );
  }
  async prepareBackup(config) {
    const ini = await fs.readFile(config, "utf8");
    const spotify = ini.match(/^spotify_path\s*=\s*(.+)$/m)?.[1].trim();
    const stock = spotify
      ? (await fs.readdir(path.join(spotify, "Apps")).catch(() => [])).some(
          (f) => f.endsWith(".spa"),
        )
      : false;
    const backup = path.join(path.dirname(config), "Backup");
    const files = await fs.readdir(backup).catch(() => []);
    if (!stock && files.some((f) => f.endsWith(".spa")))
      await this.run(["restore", "backup"]);
    else await this.run(["backup"]);
  }
  async snapshot(config) {
    const id =
      Date.now() + "-" + require("node:crypto").randomBytes(4).toString("hex");
    const dir = path.join(this.root, "backups", id);
    await fs.mkdir(dir, { recursive: true });
    await fs.copyFile(config, path.join(dir, "config-xpui.ini"));
    for (const sub of ["Themes/SCP", "Backup"]) {
      const p = path.join(path.dirname(config), sub);
      if (await exists(p))
        await fs.cp(p, path.join(dir, sub), { recursive: true });
    }
    await atomic(
      path.join(dir, "manifest.json"),
      JSON.stringify({ id, date: new Date().toISOString(), config }),
    );
    return id;
  }
  async apply(theme) {
    const t = validateTheme(theme);
    return this.exclusive(async () => {
      const s = await this.guard();
      const backup = await this.snapshot(s.config);
      await this.record({ action: "Backup criado", backup, name: t.name });
      try {
        // O backup oficial deve concluir antes de escrever o tema ou alterar a configuração.
        await this.prepareBackup(s.config);
        const dest = path.join(path.dirname(s.config), "Themes", "SCP");
        const files = renderTheme(t);
        await atomic(path.join(dest, "color.ini"), files.ini);
        await atomic(path.join(dest, "user.css"), files.css);
        await this.run([
          "config",
          "current_theme",
          "SCP",
          "color_scheme",
          "Custom",
          "inject_css",
          "1",
          "replace_colors",
          "1",
        ]);
        await this.run(["apply"]);
        await this.record({ action: "Tema aplicado", name: t.name, backup });
        return "Tema aplicado. Se necessário, reabra o Spotify.";
      } catch (e) {
        await this.record({
          action: "Aplicação falhou",
          name: t.name,
          backup,
          error: e.message,
        });
        throw Error(
          `A aplicação falhou. Backup ${backup} preservado. Use Restaurar original ou recuperar configuração. ${e.message}`,
        );
      }
    });
  }
  async restore() {
    return this.exclusive(async () => {
      const s = await this.guard();
      const backup = await this.snapshot(s.config);
      await this.run(["restore"]);
      await this.run([
        "config",
        "current_theme",
        "",
        "color_scheme",
        "",
        "inject_css",
        "0",
        "replace_colors",
        "0",
      ]);
      await this.record({ action: "Spotify original restaurado", backup });
      return "Arquivos originais restaurados pelo Spicetify. Reabra o Spotify.";
    });
  }
  async recover(id) {
    if (!/^\d+-[a-f0-9]{8}$/.test(id)) throw Error("Backup inválido");
    return this.exclusive(async () => {
      const s = await this.guard();
      const dir = path.join(this.root, "backups", id);
      const meta = JSON.parse(
        await fs.readFile(path.join(dir, "manifest.json"), "utf8"),
      );
      if (meta.config !== s.config)
        throw Error("Este backup pertence a outra instalação.");
      await this.snapshot(s.config);
      await this.run(["restore"]);
      const current = await fs.readFile(s.config, "utf8");
      let saved = await fs.readFile(path.join(dir, "config-xpui.ini"), "utf8");
      const section = /^\[Backup\][\s\S]*?(?=^\[|(?![\s\S]))/im;
      const active = current.match(section)?.[0];
      if (active) {
        saved = saved.replace(section, "").trimEnd() + "\n\n" + active;
      }
      await atomic(s.config, saved);
      const theme = path.join(dir, "Themes", "SCP");
      const dest = path.join(path.dirname(s.config), "Themes", "SCP");
      await fs.rm(dest, { recursive: true, force: true });
      if (await exists(theme)) await fs.cp(theme, dest, { recursive: true });
      await this.record({
        action: "Configuração recuperada; Spotify original",
        backup: id,
      });
      return "Configuração recuperada e Spotify original restaurado. Para reaplicar o tema anterior, use spicetify apply.";
    });
  }
  async profiles() {
    return JSON.parse(
      await fs
        .readFile(path.join(this.root, "profiles.json"), "utf8")
        .catch(() => "[]"),
    );
  }
  async save(theme) {
    const t = validateTheme(theme);
    const list = await this.profiles();
    const next = list.filter((p) => p.name !== t.name);
    next.push(t);
    await atomic(
      path.join(this.root, "profiles.json"),
      JSON.stringify(next, null, 2),
    );
    return next;
  }
  async extensions() {
    const s = await this.status();
    if (!s.config) return [];
    const ini = await fs.readFile(s.config, "utf8");
    const enabled = (ini.match(/^extensions\s*=\s*(.*)$/m)?.[1] || "").split(
      "|",
    );
    const dir = path.join(path.dirname(s.config), "Extensions");
    const files = await fs.readdir(dir).catch(() => []);
    return files
      .filter((f) => /^[\w.-]+\.js$/.test(f))
      .map((name) => ({
        name,
        enabled: enabled.includes(name),
        compatibility:
          "Não certificada; depende do autor e da versão do Spotify",
      }));
  }
  async toggleExtension(name, on) {
    if (typeof on !== "boolean" || !/^[\w.-]+\.js$/.test(name))
      throw Error("Extensão inválida");
    return this.exclusive(async () => {
      const s = await this.guard();
      if (!(await this.extensions()).some((x) => x.name === name))
        throw Error("Extensão local não encontrada");
      const backup = await this.snapshot(s.config);
      await this.prepareBackup(s.config);
      await this.run(["config", "extensions", name + (on ? "" : "-")]);
      await this.run(["apply"]);
      await this.record({
        action: on ? "Extensão ativada" : "Extensão desativada",
        name,
        backup,
      });
      return "Extensões atualizadas.";
    });
  }
}
module.exports = { Service, atomic };
