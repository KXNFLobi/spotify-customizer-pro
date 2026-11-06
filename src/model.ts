export type Theme = {
  schemaVersion: 1;
  name: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  button: string;
  icon: string;
  radius: number;
  coverRadius: number;
  spacing: number;
  fontSize: number;
  font: "Segoe UI" | "Arial" | "Verdana" | "Georgia";
  weight: "400" | "500" | "600" | "700";
  opacity: number;
  transition: number;
  sidebarWidth: number;
  playerHeight: number;
  progressHeight: number;
  css: string;
};
const base: Theme = {
  schemaVersion: 1,
  name: "Spotify Classic",
  accent: "#1ed760",
  background: "#121212",
  surface: "#1c1c1c",
  text: "#ffffff",
  muted: "#a7a7a7",
  button: "#1ed760",
  icon: "#c9c9ce",
  radius: 12,
  coverRadius: 6,
  spacing: 4,
  fontSize: 14,
  font: "Segoe UI",
  weight: "400",
  opacity: 1,
  transition: 180,
  sidebarWidth: 240,
  playerHeight: 88,
  progressHeight: 4,
  css: "",
};
export const themes: Theme[] = [
  { ...base, name: "AMOLED Black", background: "#000000", surface: "#101010" },
  {
    ...base,
    name: "Midnight Purple",
    accent: "#a78bfa",
    button: "#a78bfa",
    background: "#100f19",
    surface: "#1d192b",
    muted: "#a5a0b9",
    radius: 16,
  },
  {
    ...base,
    name: "Cyberpunk Neon",
    accent: "#00ffd1",
    button: "#ff44ce",
    background: "#0b0a18",
    surface: "#17142c",
    icon: "#00ffd1",
    radius: 4,
  },
  {
    ...base,
    name: "Glassmorphism",
    accent: "#93c5fd",
    button: "#93c5fd",
    background: "#131d30",
    surface: "#293b56",
    opacity: 0.6,
    radius: 24,
  },
  {
    ...base,
    name: "Minimal White",
    accent: "#15803d",
    button: "#15803d",
    background: "#fafafa",
    surface: "#eeeeee",
    text: "#18181b",
    muted: "#52525b",
    icon: "#333333",
  },
  {
    ...base,
    name: "Dark Blue",
    background: "#081321",
    surface: "#11243a",
    accent: "#38bdf8",
    button: "#38bdf8",
  },
  {
    ...base,
    name: "RGB Gamer",
    background: "#0c0c13",
    surface: "#191925",
    accent: "#e879f9",
    button: "#e879f9",
    css: "@keyframes scp-rgb { 0% {border-color:#ff4488} 50% {border-color:#44ffbb} 100% {border-color:#ff4488} }\n.main-nowPlayingBar-nowPlayingBar {border-top:2px solid; animation:scp-rgb 6s linear infinite;}",
  },
  base,
];
export type Status = {
  platform: string;
  spicetify: string;
  config: string;
  spotify: string;
  ready: boolean;
  error: string;
  compatibility: string;
  startup: boolean;
};
export type Entry = {
  date: string;
  action: string;
  name?: string;
  backup?: string;
  error?: string;
};
export type Extension = {
  name: string;
  enabled: boolean;
  compatibility: string;
};
declare global {
  interface Window {
    desktop?: { invoke: (method: string, ...args: unknown[]) => Promise<any> };
  }
}
export async function api<T = any>(
  method: string,
  ...args: unknown[]
): Promise<T> {
  if (!window.desktop)
    throw Error(
      "Abra pelo aplicativo Electron. O navegador oferece somente a prévia visual.",
    );
  return window.desktop.invoke(method, ...args);
}
