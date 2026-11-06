import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Palette,
  SlidersHorizontal,
  Code2,
  Puzzle,
  History,
  Settings,
  Music2,
  Check,
  ArrowUpRight,
  Download,
  Upload,
  Save,
  RotateCcw,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  Heart,
  Search,
  Home,
  Library,
  ChevronRight,
  ShieldCheck,
  Loader2,
  Plus,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { css } from "@codemirror/lang-css";
import { api, themes, Theme, Status, Entry, Extension } from "./model";
import "./style.css";
const pages = [
  ["Temas", Palette],
  ["Editor visual", SlidersHorizontal],
  ["CSS personalizado", Code2],
  ["Plugins e extensões", Puzzle],
  ["Histórico e backups", History],
  ["Configurações", Settings],
] as const;
function App() {
  const [page, setPage] = useState<string>("Temas"),
    [theme, setTheme] = useState<Theme>(themes[1]),
    [profiles, setProfiles] = useState<Theme[]>([]),
    [status, setStatus] = useState<Status | null>(null),
    [history, setHistory] = useState<Entry[]>([]),
    [extensions, setExtensions] = useState<Extension[]>([]),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(false),
    [undo, setUndo] = useState<Theme[]>([]);
  const notify = (message: string, bad = false) => {
    setNotice(message);
    setError(bad);
  };
  async function refresh() {
    const s = await api<Status>("status");
    setStatus(s);
    setProfiles(await api<Theme[]>("profiles"));
    setHistory(await api<Entry[]>("history"));
    setExtensions(await api<Extension[]>("extensions"));
  }
  useEffect(() => {
    if (window.desktop) refresh().catch((e) => notify(e.message, true));
  }, []);
  const action = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      notify((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  };
  function update(p: Partial<Theme>) {
    setUndo((u) => [...u.slice(-49), theme]);
    setTheme((t) => ({ ...t, ...p }));
  }
  const color = (key: keyof Theme, label: string) => (
    <label className="color-field" key={key}>
      <span>{label}</span>
      <span className="color-value">
        <input
          aria-label={label}
          type="color"
          value={String(theme[key])}
          onChange={(e) => update({ [key]: e.target.value })}
        />
        {theme[key]}
      </span>
    </label>
  );
  const slider = (
    key: keyof Theme,
    label: string,
    min: number,
    max: number,
    step = 1,
    unit = "px",
  ) => (
    <label className="slider-field" key={key}>
      <span>
        {label}
        <b>
          {theme[key]}
          {unit}
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number(theme[key])}
        onChange={(e) => update({ [key]: +e.target.value })}
      />
    </label>
  );
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">
            <Music2 size={23} />
          </div>
          <div>
            Spotify Customizer<span>PRO STUDIO</span>
          </div>
        </div>
        <div className="workspace-label">SEU ESPAÇO CRIATIVO</div>
        <nav>
          {pages.map(([name, Icon]) => (
            <button
              key={name}
              className={page === name ? "active" : ""}
              onClick={() => setPage(name)}
            >
              <Icon size={19} />
              {name}
              {page === name && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="safe">
            <ShieldCheck size={21} />
            <div>
              Personalize com segurança<small>Backups antes de aplicar</small>
            </div>
          </div>
          <p>Feito para o seu jeito de ouvir.</p>
          <span className="version">DESKTOP · v1.0.0</span>
        </div>
      </aside>
      <main>
        <header>
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} /> <span>{page}</span>
          </div>
          <button
            className="status"
            onClick={() => action(refresh)}
            disabled={busy}
          >
            <i className={status?.ready ? "online" : ""} />
            {status?.ready
              ? "Spicetify conectado"
              : window.desktop
                ? "Verificar conexão"
                : "Prévia no navegador"}
            <RotateCcw size={13} />
          </button>
        </header>
        <div className="heading">
          <div className="eyebrow">PERSONALIZAÇÃO SEM LIMITES VISUAIS</div>
          <h1>{page === "Temas" ? "Sua música. Seu estilo." : page}</h1>
          <p>Transforme o visual do Spotify em uma experiência só sua.</p>
        </div>
        {!window.desktop && (
          <div className="banner">
            Prévia visual. Aplicação, arquivos e backups ficam disponíveis ao
            executar com Electron.
          </div>
        )}
        {notice && (
          <div role="status" className={"notice " + (error ? "error" : "")}>
            <span>{notice}</span>
            <button aria-label="Fechar mensagem" onClick={() => setNotice("")}>
              ×
            </button>
          </div>
        )}
        <div className="studio">
          <section className="controls">
            {page === "Temas" && (
              <>
                <div className="section-title">
                  <h2>Explore os temas</h2>
                  <span>08 SELECIONADOS</span>
                </div>
                <p className="section-description">
                  Um novo clima para cada play.
                </p>
                <div className="theme-grid">
                  {themes.map((t, i) => (
                    <button
                      key={t.name}
                      onClick={() => update(t)}
                      className={
                        "theme-card " +
                        (theme.name === t.name ? "selected" : "")
                      }
                    >
                      <div
                        className="mini"
                        style={{ background: t.background, color: t.accent }}
                      >
                        <div
                          className="mini-nav"
                          style={{ background: t.surface }}
                        >
                          <i />
                          <i />
                          <i />
                        </div>
                        <div className="mini-content">
                          <div
                            className="mini-top"
                            style={{ background: t.surface }}
                          />
                          <div className="mini-covers">
                            {[0, 1, 2].map((n) => (
                              <i
                                key={n}
                                style={{
                                  background: [t.accent, t.button, t.muted][n],
                                  opacity: 0.8 - n * 0.18,
                                  borderRadius: t.coverRadius + "%",
                                }}
                              />
                            ))}
                          </div>
                          <div className="mini-lines">
                            <i />
                            <i />
                          </div>
                        </div>
                        <div
                          className="mini-player"
                          style={{ background: t.surface }}
                        >
                          <span style={{ background: t.accent }} />
                        </div>
                        {theme.name === t.name && (
                          <div className="selected-check">
                            <Check size={12} />
                          </div>
                        )}
                      </div>
                      <div className="theme-name">
                        {t.name}
                        <span>
                          {i === 1 ? "POPULAR" : i === 0 ? "OLED" : ""}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="custom-callout">
                  <div className="custom-icon">
                    <SlidersHorizontal size={21} />
                  </div>
                  <div>
                    <strong>Um tema com a sua assinatura</strong>
                    <p>Ajuste cada detalhe no editor visual.</p>
                  </div>
                  <button
                    aria-label="Abrir editor visual"
                    onClick={() => setPage("Editor visual")}
                  >
                    <ArrowUpRight size={21} />
                  </button>
                </div>
              </>
            )}
            {page === "Editor visual" && (
              <>
                <div className="section-title">
                  <h2>Seu tema, nos detalhes</h2>
                  <button
                    onClick={() => {
                      if (undo.length) {
                        setTheme(undo[undo.length - 1]);
                        setUndo(undo.slice(0, -1));
                      }
                    }}
                    disabled={!undo.length}
                  >
                    Desfazer
                  </button>
                </div>
                <label className="field">
                  Nome do tema
                  <input
                    value={theme.name}
                    maxLength={70}
                    onChange={(e) => update({ name: e.target.value })}
                  />
                </label>
                <h3>Paleta de cores</h3>
                <div className="colors">
                  {color("accent", "Cor principal")}
                  {color("background", "Fundo")}
                  {color("surface", "Superfícies")}
                  {color("text", "Texto")}
                  {color("muted", "Texto secundário")}
                  {color("button", "Botões")}
                  {color("icon", "Ícones")}
                </div>
                <button
                  className="text-button"
                  onClick={() => update({ background: "#000000" })}
                >
                  Usar preto AMOLED
                </button>
                <h3>Forma e layout</h3>
                {slider("radius", "Bordas arredondadas", 0, 32)}
                {slider("coverRadius", "Formato das capas", 0, 50, 1, "%")}
                {slider("spacing", "Espaço entre músicas", 0, 24)}
                {slider("sidebarWidth", "Largura da barra lateral", 180, 360)}
                {slider("playerHeight", "Altura do player", 64, 130)}
                {slider("progressHeight", "Progresso e volume", 2, 12)}
                {slider("opacity", "Opacidade dos cards", 0.4, 1, 0.05, "")}
                {slider("transition", "Transições", 0, 600, 10, "ms")}
                <h3>Tipografia</h3>
                <label className="field">
                  Fonte
                  <select
                    value={theme.font}
                    onChange={(e) =>
                      update({ font: e.target.value as Theme["font"] })
                    }
                  >
                    {["Segoe UI", "Arial", "Verdana", "Georgia"].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </label>
                {slider("fontSize", "Tamanho do texto", 11, 20)}
                <label className="field">
                  Peso
                  <select
                    value={theme.weight}
                    onChange={(e) =>
                      update({ weight: e.target.value as Theme["weight"] })
                    }
                  >
                    {["400", "500", "600", "700"].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {page === "CSS personalizado" && (
              <>
                <h2>CSS personalizado</h2>
                <p className="section-description">
                  Regras locais anexadas ao tema. Seletores podem mudar após
                  atualizações do Spotify.
                </p>
                <CodeMirror
                  value={theme.css}
                  height="390px"
                  theme="dark"
                  extensions={[css()]}
                  onChange={(value) => update({ css: value })}
                />
                <p className="hint">
                  A prévia representa os controles visuais. O CSS livre será
                  interpretado somente pelo Spotify, após aplicar. Importações e
                  URLs externas são bloqueadas.
                </p>
              </>
            )}
            {page === "Plugins e extensões" && (
              <>
                <h2>Plugins visuais</h2>
                <p className="section-description">
                  Importe um arquivo .css de sua confiança. As regras serão
                  incorporadas ao tema e poderão ser removidas no editor CSS.
                </p>
                <button
                  className="button"
                  disabled={busy}
                  onClick={() =>
                    action(async () => {
                      const p = await api("plugin");
                      if (p) {
                        update({
                          css:
                            theme.css +
                            "\n/* " +
                            p.name.replace(/\*\//g, "") +
                            " */\n" +
                            p.css,
                        });
                        notify(
                          "Plugin CSS incorporado. Revise no editor e aplique o tema.",
                        );
                      }
                    })
                  }
                >
                  <Plus size={16} />
                  Importar plugin CSS
                </button>
                <h3>Extensões locais do Spicetify</h3>
                <p className="hint">
                  JavaScript tem acesso ao cliente Spotify. Ative somente
                  extensões confiáveis. Compatibilidade não certificada; os
                  arquivos devem estar previamente instalados na pasta
                  Extensions do Spicetify.
                </p>
                {!extensions.length && (
                  <div className="empty">
                    Nenhuma extensão local encontrada.
                  </div>
                )}
                {extensions.map((x) => (
                  <div className="list-row" key={x.name}>
                    <div>
                      <strong>{x.name}</strong>
                      <small>{x.compatibility}</small>
                    </div>
                    <button
                      disabled={busy || !status?.ready}
                      onClick={() => {
                        if (
                          confirm(
                            "Alterar esta extensão executará código local no Spotify. Você confia no autor?",
                          )
                        )
                          action(async () => {
                            notify(
                              await api("toggleExtension", x.name, !x.enabled),
                            );
                            await refresh();
                          });
                      }}
                    >
                      {x.enabled ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                ))}
              </>
            )}
            {page === "Histórico e backups" && (
              <>
                <h2>Histórico e backups</h2>
                <p className="section-description">
                  Backups locais não são apagados automaticamente. Recuperar
                  restaura os arquivos originais do Spotify e a configuração
                  salva.
                </p>
                {!history.length && (
                  <div className="empty">Nenhuma operação registrada.</div>
                )}
                {history.map((e, i) => (
                  <div className="history-row" key={i}>
                    <div>
                      <strong>{e.action}</strong>
                      <small>
                        {new Date(e.date).toLocaleString("pt-BR")} · {e.name}
                      </small>
                      {e.error && (
                        <small className="error-text">{e.error}</small>
                      )}
                    </div>
                    {e.backup && (
                      <button
                        disabled={busy || !status?.ready}
                        onClick={() => {
                          if (
                            confirm(
                              "Recuperar este backup? O Spotify voltará aos arquivos originais, com a configuração salva.",
                            )
                          )
                            action(async () => {
                              notify(await api("recover", e.backup));
                              await refresh();
                            });
                        }}
                      >
                        Recuperar
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
            {page === "Configurações" && (
              <>
                <h2>Instalação e preferências</h2>
                <div className="diagnostics">
                  <strong>
                    {status?.ready
                      ? "Pronto para aplicar"
                      : "Configuração necessária"}
                  </strong>
                  <p>
                    {status?.error ||
                      "Abra no Electron para detectar a instalação."}
                  </p>
                  <p>Spicetify: {status?.spicetify || "Não detectado"}</p>
                  <p>Spotify: {status?.spotify || "Não detectado"}</p>
                  <p>Configuração: {status?.config || "Não detectada"}</p>
                  <p>{status?.compatibility}</p>
                </div>
                <div className="button-row">
                  <button
                    className="button"
                    disabled={busy}
                    onClick={() => action(refresh)}
                  >
                    Verificar novamente
                  </button>
                  <button
                    className="button"
                    onClick={() =>
                      action(async () => {
                        await api("docs");
                      })
                    }
                  >
                    Guia oficial <ArrowUpRight size={15} />
                  </button>
                </div>
                <label className="startup">
                  <input
                    type="checkbox"
                    checked={status?.startup || false}
                    disabled={busy}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      action(async () => {
                        await api("startup", checked);
                        await refresh();
                        notify("Preferência atualizada.");
                      });
                    }}
                  />{" "}
                  Iniciar junto com o Windows
                </label>
                <h3>Perfis salvos</h3>
                <p className="hint">
                  Cada perfil guarda os controles visuais e o CSS. Arquivos JSON
                  importados passam por validação antes de aplicar.
                </p>
                {!profiles.length && (
                  <div className="empty">
                    Salve seu primeiro perfil no rodapé.
                  </div>
                )}
                {profiles.map((p) => (
                  <button
                    className="profile"
                    key={p.name}
                    onClick={() => {
                      update(p);
                      notify("Perfil carregado na prévia.");
                    }}
                  >
                    <i style={{ background: p.accent }} />
                    {p.name}
                    <ChevronRight size={16} />
                  </button>
                ))}
              </>
            )}
          </section>
          <section className="preview-panel">
            <div className="preview-title">
              <span>
                <i />
                PRÉ-VISUALIZAÇÃO AO VIVO
              </span>
              <span>Representação visual</span>
            </div>
            <Preview theme={theme} />
            <div className="preview-caption">
              <span className="swatch" style={{ background: theme.accent }} />
              <div>
                <strong>{theme.name}</strong>
                <small>Confira os detalhes antes de aplicar</small>
              </div>
              <button
                onClick={() => setPage("Editor visual")}
                aria-label="Editar tema"
              >
                <SlidersHorizontal size={18} />
              </button>
            </div>
            <div className="preview-note">
              <ShieldCheck size={17} />
              <p>
                O Spicetify verifica a aplicação. O visual final depende da
                versão do Spotify; transparência entre janelas não é suportada.
              </p>
            </div>
          </section>
        </div>
        <footer>
          <div className="footer-tools">
            <button
              disabled={busy}
              onClick={() =>
                action(async () => {
                  setProfiles(await api("save", theme));
                  notify("Perfil salvo.");
                })
              }
            >
              <Save size={16} />
              Salvar perfil
            </button>
            <button
              disabled={busy}
              onClick={() =>
                action(async () => {
                  if (await api("export", theme)) notify("Tema exportado.");
                })
              }
            >
              <Download size={16} />
              Exportar
            </button>
            <button
              disabled={busy}
              onClick={() =>
                action(async () => {
                  const t = await api<Theme | null>("import");
                  if (t) {
                    update(t);
                    notify("Tema importado na prévia.");
                  }
                })
              }
            >
              <Upload size={16} />
              Importar
            </button>
          </div>
          <div className="footer-tools">
            <button
              disabled={busy || !status?.ready}
              onClick={() => {
                if (
                  confirm(
                    "Restaurar os arquivos originais do Spotify pelo Spicetify?",
                  )
                )
                  action(async () => {
                    notify(await api("restore"));
                    await refresh();
                  });
              }}
            >
              <RotateCcw size={16} />
              Restaurar original
            </button>
            <button
              className="primary"
              disabled={busy || !status?.ready}
              onClick={() => {
                if (
                  confirm(
                    "Aplicar o tema? O Spicetify poderá reiniciar o Spotify. Um backup será criado antes.",
                  )
                )
                  action(async () => {
                    notify(await api("apply", theme));
                    await refresh();
                  });
              }}
            >
              {busy ? (
                <Loader2 size={17} className="spin" />
              ) : (
                <Check size={17} />
              )}{" "}
              {busy ? "Processando…" : "Aplicar no Spotify"}
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
function Preview({ theme: t }: { theme: Theme }) {
  return (
    <div
      className="spotify-preview"
      style={
        {
          background: t.background,
          color: t.text,
          fontFamily: `"${t.font}", Arial, sans-serif`,
          fontSize: t.fontSize,
          fontWeight: +t.weight,
          borderRadius: t.radius,
          "--accent": t.accent,
          "--surface": t.surface,
          "--muted": t.muted,
          "--transition": t.transition + "ms",
        } as React.CSSProperties
      }
    >
      <div className="sp-body">
        <div
          className="sp-nav"
          style={{
            background: t.surface,
            width: t.sidebarWidth / 2.5,
            color: t.icon,
          }}
        >
          <Music2 size={24} />
          <Home size={17} />
          <Search size={17} />
          <Library size={17} />
          <div className="tiny-cover" />
          <div className="tiny-cover two" />
          <div className="tiny-cover three" />
        </div>
        <div className="sp-main">
          <div className="sp-top">
            <span>‹　›</span>
            <span className="avatar">M</span>
          </div>
          <h3>Seu próximo repeat.</h3>
          <div className="chips">
            <span style={{ background: t.accent, color: t.background }}>
              Tudo
            </span>
            <span>Música</span>
            <span>Podcasts</span>
          </div>
          <h4>Feito para você</h4>
          <div className="album-grid">
            {["Purple hours", "Entre frequências", "Depois das 22h"].map(
              (s, i) => (
                <div
                  className="album"
                  key={s}
                  style={{
                    background: `color-mix(in srgb, ${t.surface} ${t.opacity * 100}%, transparent)`,
                    borderRadius: t.radius,
                  }}
                >
                  <div
                    className={"art art" + i}
                    style={{ borderRadius: t.coverRadius + "%" }}
                  >
                    <span>
                      {["NIGHT\nWAVES", "DAILY\nMIX", "LATE\nNIGHTS"][i]}
                    </span>
                    <Music2 size={22} />
                  </div>
                  <strong>{s}</strong>
                  <small>Seu universo sonoro</small>
                </div>
              ),
            )}
          </div>
          <h4>Suas favoritas</h4>
          {[
            "A melhor parte do dia",
            "Um lugar para voltar",
            "Deixa o som levar",
          ].map((name, i) => (
            <div
              className="track"
              key={name}
              style={{
                marginBlock: t.spacing / 2,
                paddingBlock: 5 + t.spacing / 3,
              }}
            >
              <span>{i + 1}</span>
              <div
                className={"track-cover art" + i}
                style={{ borderRadius: t.coverRadius + "%" }}
              />
              <div>
                <strong>{name}</strong>
                <small>Artista independente</small>
              </div>
              <Heart size={12} color={t.icon} />
              <small>3:4{i}</small>
            </div>
          ))}
        </div>
      </div>
      <div
        className="sp-player"
        style={{ background: t.surface, minHeight: t.playerHeight * 0.8 }}
      >
        <div className="playing">
          <div
            className="track-cover art0"
            style={{ borderRadius: t.coverRadius + "%" }}
          />
          <div>
            <strong>Purple hours</strong>
            <small>Seu universo sonoro</small>
          </div>
          <Heart size={12} color={t.accent} />
        </div>
        <div className="playback">
          <div>
            <SkipBack size={12} />
            <span style={{ background: t.button, color: t.background }}>
              <Play size={13} fill="currentColor" />
            </span>
            <SkipForward size={12} />
          </div>
          <div className="progress-line">
            <small>1:24</small>
            <i style={{ height: t.progressHeight }}>
              <b style={{ background: t.accent }} />
            </i>
            <small>3:42</small>
          </div>
        </div>
        <div className="volume">
          <Volume2 size={14} />
          <i style={{ height: t.progressHeight, background: t.accent }} />
        </div>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
