const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { Service } = require("../electron/service.cjs");
const { theme } = require("./theme.test.cjs");
async function setup(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "scp-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const config = path.join(dir, "spicetify", "config-xpui.ini");
  await fs.mkdir(path.dirname(config));
  await fs.writeFile(config, "current_theme = Previous\n");
  const s = new Service(path.join(dir, "app"));
  s.guard = async () => ({ config, ready: true });
  return { s, dir, config };
}
test("não altera tema nem configuração se backup oficial falha", async (t) => {
  const { s, config } = await setup(t);
  s.run = async () => {
    throw Error("incompatível");
  };
  await assert.rejects(s.apply(theme), /Backup .* preservado/);
  assert.equal(await fs.readFile(config, "utf8"), "current_theme = Previous\n");
  assert.equal(
    await fs
      .stat(path.join(path.dirname(config), "Themes", "SCP"))
      .catch(() => null),
    null,
  );
  assert.equal((await s.history())[0].action, "Aplicação falhou");
});
test("backup precede configuração e apply", async (t) => {
  const { s, config } = await setup(t);
  const calls = [];
  s.run = async (a) => {
    calls.push(a);
    if (a[0] === "backup") {
      assert.equal(
        await fs
          .stat(path.join(path.dirname(config), "Themes"))
          .catch(() => null),
        null,
      );
    }
    return "";
  };
  await s.apply(theme);
  assert.deepEqual(
    calls.map((a) => a[0]),
    ["backup", "config", "apply"],
  );
  assert.match(
    await fs.readFile(
      path.join(path.dirname(config), "Themes", "SCP", "color.ini"),
      "utf8",
    ),
    /\[Custom\]/,
  );
  const h = await s.history();
  assert.equal(h[0].action, "Tema aplicado");
  assert.ok(
    await fs.stat(path.join(s.root, "backups", h[0].backup, "config-xpui.ini")),
  );
});
test("impede operações simultâneas e traversal de backup", async (t) => {
  const { s } = await setup(t);
  s.busy = true;
  await assert.rejects(s.restore(), /andamento/);
  await assert.rejects(s.recover("../x"), /inválido/);
});
test("restauração usa restore e remove tema da configuração", async (t) => {
  const { s } = await setup(t);
  const calls = [];
  s.run = async (a) => {
    calls.push(a);
    return "";
  };
  await s.restore();
  assert.deepEqual(calls[0], ["restore"]);
  assert.equal(calls[1][2], "");
});
test("recuperação mantém Spotify original e repõe configuração salva", async (t) => {
  const { s, config } = await setup(t);
  const id = await s.snapshot(config);
  await fs.writeFile(config, "changed");
  s.run = async () => "";
  await s.recover(id);
  assert.equal(await fs.readFile(config, "utf8"), "current_theme = Previous\n");
});
test("preserva backup existente antes do ciclo oficial restore backup", async (t) => {
  const { s, config } = await setup(t);
  const dir = path.join(path.dirname(config), "Backup");
  await fs.mkdir(dir);
  await fs.writeFile(path.join(dir, "xpui.spa"), "original");
  const calls = [];
  s.run = async (a) => {
    calls.push(a);
    return "";
  };
  await s.apply(theme);
  assert.deepEqual(calls[0], ["restore", "backup"]);
  const h = await s.history();
  assert.equal(
    await fs.readFile(
      path.join(s.root, "backups", h[0].backup, "Backup", "xpui.spa"),
      "utf8",
    ),
    "original",
  );
});
test("recuperação mantém metadados do backup oficial atual", async (t) => {
  const { s, config } = await setup(t);
  await fs.writeFile(
    config,
    "[Setting]\ncurrent_theme = Old\n[Backup]\nversion = old\n",
  );
  const id = await s.snapshot(config);
  await fs.writeFile(
    config,
    "[Setting]\ncurrent_theme = New\n[Backup]\nversion = new\n",
  );
  s.run = async () => "";
  await s.recover(id);
  const value = await fs.readFile(config, "utf8");
  assert.match(value, /current_theme = Old/);
  assert.match(value, /version = new/);
  assert.doesNotMatch(value, /version = old/);
});
test("Spotify atualizado em estado original cria backup sem restaurar a versão antiga", async (t) => {
  const { s, config, dir } = await setup(t);
  const spotify = path.join(dir, "Spotify");
  await fs.mkdir(path.join(spotify, "Apps"), { recursive: true });
  await fs.writeFile(path.join(spotify, "Apps", "xpui.spa"), "new");
  await fs.writeFile(config, "spotify_path = " + spotify + "\n");
  await fs.mkdir(path.join(path.dirname(config), "Backup"));
  await fs.writeFile(
    path.join(path.dirname(config), "Backup", "xpui.spa"),
    "old",
  );
  const calls = [];
  s.run = async (a) => {
    calls.push(a);
    return "";
  };
  await s.apply(theme);
  assert.deepEqual(calls[0], ["backup"]);
});
test("motor incluído funciona sem Spicetify no PATH e aceita config recém-criada", async (t) => {
  const { dir } = await setup(t);
  const bundle = path.join(dir, "spicetify.exe");
  await fs.writeFile(bundle, "fixture");
  const config = path.join(dir, "config-xpui.ini");
  const spotify = path.join(dir, "Spotify");
  await fs.mkdir(spotify);
  await fs.writeFile(path.join(spotify, "Spotify.exe"), "fixture");
  await fs.writeFile(config, "spotify_path = " + spotify + "\n");
  const calls = [];
  const s = new Service(
    path.join(dir, "portable"),
    "win32",
    async (exe, args) => {
      calls.push({ exe, args });
      if (exe === "where.exe") throw Error("not found");
      return {
        stdout:
          args[0] === "-v"
            ? "2.46.4"
            : "Default config-xpui.ini generated\n" + config + "\n",
      };
    },
    bundle,
  );
  const state = await s.status();
  assert.equal(state.ready, true);
  assert.equal(s.exe, bundle);
  assert.equal(state.config, config);
  assert.ok(calls.some((c) => c.exe === bundle));
});
test("primeiro uso inicializa configuração automaticamente sem aplicar ou alterar Spotify", async (t) => {
  const { dir } = await setup(t);
  const config = path.join(dir, "new-config-xpui.ini");
  const calls = [];
  const s = new Service(dir);
  s.exe = "bundled.exe";
  s.run = async (args) => {
    calls.push(args);
    if (args[0] === "-c") return config;
    if (args[0] === "config") {
      await fs.writeFile(config, "spotify_path = auto\n");
      return "";
    }
    throw Error("Comando não esperado");
  };
  assert.equal(await s.config(), config);
  assert.deepEqual(calls, [["-c"], ["config"]]);
});
