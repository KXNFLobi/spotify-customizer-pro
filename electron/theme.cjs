const { z } = require("zod");
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const themeSchema = z
  .object({
    schemaVersion: z.literal(1),
    name: z.string().trim().min(1).max(70),
    accent: hex,
    background: hex,
    surface: hex,
    text: hex,
    muted: hex,
    button: hex,
    icon: hex,
    radius: z.number().min(0).max(32),
    coverRadius: z.number().min(0).max(50),
    spacing: z.number().min(0).max(24),
    fontSize: z.number().min(11).max(20),
    font: z.enum(["Segoe UI", "Arial", "Verdana", "Georgia"]),
    weight: z.enum(["400", "500", "600", "700"]),
    opacity: z.number().min(0.4).max(1),
    transition: z.number().min(0).max(600),
    sidebarWidth: z.number().min(180).max(360),
    playerHeight: z.number().min(64).max(130),
    progressHeight: z.number().min(2).max(12),
    css: z.string().max(100000),
  })
  .strict();
function validateTheme(input) {
  const t = themeSchema.parse(input);
  if (
    /\\|@import|url\s*\(|expression\s*\(|<\/style/i.test(
      t.css.replace(/\/\*[\s\S]*?\*\//g, ""),
    )
  )
    throw new Error(
      "CSS externo (url/@import) não é permitido. Use apenas regras locais.",
    );
  return t;
}
function renderTheme(input) {
  const t = validateTheme(input);
  return {
    ini: `[Custom]\ntext = ${t.text.slice(1)}\nsubtext = ${t.muted.slice(1)}\nmain = ${t.background.slice(1)}\nsidebar = ${t.surface.slice(1)}\nplayer = ${t.surface.slice(1)}\ncard = ${t.surface.slice(1)}\nshadow = 000000\nselected-row = ${t.accent.slice(1)}\nbutton = ${t.button.slice(1)}\nbutton-active = ${t.accent.slice(1)}\nbutton-disabled = ${t.muted.slice(1)}\ntab-active = ${t.surface.slice(1)}\nnotification = ${t.surface.slice(1)}\nnotification-error = e34d59\nmisc = ${t.accent.slice(1)}\n`,
    css: `/* Gerado pelo Spotify Customizer Pro. Seletores dependem da versão do Spotify. */
:root { --scp-accent:${t.accent}; --scp-icon:${t.icon}; --scp-radius:${t.radius}px; }
body,button,input { font-family:"${t.font}",sans-serif !important; font-size:${t.fontSize}px; font-weight:${t.weight}; }
.main-rootlist-rootlist, .Root__nav-bar { min-width:${t.sidebarWidth}px; }
.Root__main-view, .main-card-card, .main-yourLibraryX-entryPoints, .main-topBar-background { border-radius:${t.radius}px !important; }
.main-card-card { background:rgba(${parseInt(t.surface.slice(1, 3), 16)},${parseInt(t.surface.slice(3, 5), 16)},${parseInt(t.surface.slice(5, 7), 16)},${t.opacity}); }
.main-trackList-trackListRow { margin-block:${t.spacing / 2}px; }
.main-image-image, .main-cardImage-image { border-radius:${t.coverRadius}% !important; }
.main-nowPlayingBar-nowPlayingBar { min-height:${t.playerHeight}px; }
.playback-progressbar, .progress-bar { --progress-bar-height:${t.progressHeight}px; --fg-color:${t.accent}; }
.main-playButton-PlayButton { color:${t.button} !important; }
.main-genericButton-button svg, .main-globalNav-navLink svg { color:${t.icon}; }
.main-card-card, .main-trackList-trackListRow, button { transition:background-color ${t.transition}ms, border-radius ${t.transition}ms; }
.main-trackList-trackListRow:hover { background-color:${t.surface}; }
${t.css}\n`,
  };
}
module.exports = { validateTheme, renderTheme };
