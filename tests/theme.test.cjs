const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateTheme, renderTheme } = require("../electron/theme.cjs");
const theme = {
  schemaVersion: 1,
  name: "Teste",
  accent: "#1ed760",
  background: "#000000",
  surface: "#141414",
  text: "#ffffff",
  muted: "#aaaaaa",
  button: "#1ed760",
  icon: "#ffffff",
  radius: 12,
  coverRadius: 50,
  spacing: 6,
  fontSize: 14,
  font: "Segoe UI",
  weight: "400",
  opacity: 0.8,
  transition: 180,
  sidebarWidth: 240,
  playerHeight: 88,
  progressHeight: 4,
  css: ".test {color:red}",
};
test("gera esquema e CSS com valores validados", () => {
  const r = renderTheme(theme);
  assert.match(r.ini, /main = 000000/);
  assert.match(r.ini, /\[Custom\]/);
  assert.match(r.css, /border-radius:50%/);
  assert.match(r.css, /\.test \{color:red\}/);
});
test("rejeita injeção por cores, fontes e propriedades desconhecidas", () => {
  for (const t of [
    { ...theme, accent: "#fff;evil" },
    { ...theme, font: "Arial;evil" },
    { ...theme, command: "rm" },
    { ...theme, radius: 900 },
  ])
    assert.throws(() => validateTheme(t));
});
test("bloqueia importações e recursos externos no CSS", () => {
  for (const css of [
    '@import "https://x";',
    "div{background:URL (https://x)}",
    "a{width:expression(x)}",
  ])
    assert.throws(() => validateTheme({ ...theme, css }));
});
module.exports = { theme };
