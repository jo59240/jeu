// Thèmes du jeu : « viking » (par défaut) ou « classique » (l'ancien design, intact). On passe de l'un à l'autre dans le menu (☰ Menu › 🎨 Thème),
// ou avec ?theme=classic / ?theme=viking dans l'adresse. Le choix est mémorisé.
export type ThemeId = "viking" | "classic";

const KEY = "ferme-theme";

function readTheme(): ThemeId {
  const q = new URLSearchParams(location.search).get("theme");
  if (q === "classic" || q === "viking") return q;
  try {
    const v = localStorage.getItem(KEY);
    if (v === "classic" || v === "viking") return v;
  } catch {
    /* réglage par défaut */
  }
  return "viking";
}

export const THEME: ThemeId = readTheme();
export const isViking = () => THEME === "viking";

// Mémorise le thème choisi (l'appelant recharge la page pour qu'il s'applique partout).
export function saveTheme(t: ThemeId) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* tant pis */
  }
}

// L'interface (CSS) suit l'attribut data-theme de la page.
export function applyThemeAttr() {
  document.documentElement.dataset.theme = THEME;
  if (isViking()) document.title = "Ferme viking";
}

// ---------- couleurs : la palette « nordique » appliquée à tout ce qui se dessine ----------

function hexToRgb(c: string): [number, number, number, number] | null {
  let m = /^#([0-9a-f]{3})$/i.exec(c);
  if (m) return [...[...m[1]].map((x) => parseInt(x + x, 16)), 1] as [number, number, number, number];
  m = /^#([0-9a-f]{6})$/i.exec(c);
  if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), 1];
  const r = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(c);
  if (r) return [Number(r[1]), Number(r[2]), Number(r[3]), r[4] === undefined ? 1 : Number(r[4])];
  return null;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

const cache = new Map<string, string>();

// Le « grain viking » : rouges profonds, bois patinés, verts sombres, gris d'acier un peu froids, crème plutôt que blanc.
export function remapColor(c: string): string {
  const hit = cache.get(c);
  if (hit !== undefined) return hit;
  const rgb = hexToRgb(c);
  let out = c;
  if (rgb) {
    const [r, g, b, a] = rgb;
    let [h, s, l] = rgbToHsl(r, g, b);
    if (s < 0.1) {
      // gris et blancs : l'acier est un peu froid, les blancs deviennent crème
      if (l > 0.93) {
        h = 40;
        s = 0.28;
        l = 0.9;
      } else {
        h = 215;
        s = Math.min(0.14, s + 0.07);
        l *= 0.94;
      }
    } else if (h < 22 || h >= 345) {
      h = 4; // rouges : le rouge sombre des boucliers et des toits
      s = Math.min(1, s * 0.9);
      l *= 0.8;
    } else if (h < 50) {
      s *= 0.8; // bois, cuir, terre : patinés
      l *= 0.87;
    } else if (h < 70) {
      s *= 0.72; // paille, or : plus mat
      l *= 0.9;
    } else if (h < 170) {
      s *= 0.8; // verts : sapin et mousse
      l *= 0.88;
    } else if (h < 265) {
      s *= 0.75; // bleus : acier et fjord
      l *= 0.9;
    } else {
      s *= 0.8;
    }
    const [nr, ng, nb] = hslToRgb(h, Math.max(0, Math.min(1, s)), Math.max(0, Math.min(1, l)));
    out = a < 1 ? `rgba(${nr},${ng},${nb},${a})` : `rgb(${nr},${ng},${nb})`;
  }
  cache.set(c, out);
  return out;
}

// Applique la palette à ce contexte de dessin : toute couleur donnée à fillStyle / strokeStyle passe par remapColor (thème viking seulement).
// Les dégradés, les motifs et les modes de fusion (nuit, saisons) ne sont pas touchés.
export function themeContext(g: CanvasRenderingContext2D) {
  if (!isViking()) return;
  for (const prop of ["fillStyle", "strokeStyle"] as const) {
    const desc = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, prop);
    if (!desc?.set || !desc.get) continue;
    Object.defineProperty(g, prop, {
      configurable: true,
      get() {
        return desc.get!.call(g);
      },
      set(v: unknown) {
        desc.set!.call(g, typeof v === "string" && g.globalCompositeOperation === "source-over" ? remapColor(v) : v);
      },
    });
  }
}

// ---------- mots : le vocabulaire viking ----------

const LABELS: Record<string, string> = {
  Maison: "Maison longue",
  "Camp de bûcheron": "Camp de bûcherons",
  Dépôt: "Entrepôt",
  Puits: "Puits sacré",
  "Camp de chasseur": "Camp de chasse",
  Boucherie: "Fumoir",
  Port: "Port de drakkars",
  Rucher: "Rucher d'hydromel",
  "Maison du soigneur": "Cabane de la völva",
  Église: "Temple d'Odin",
  Étable: "Étable",
  Porcherie: "Porcherie",
  Taverne: "Salle de banquet",
  "Garde-manger": "Cellier",
  "garde-manger": "cellier",
  taverne: "salle de banquet",
  Chemin: "Chemin",
  "Camp de bûcherons": "Camp de bûcherons",
  maison: "maison longue",
  dépôt: "entrepôt",
  église: "temple d'Odin",
  boucherie: "fumoir",
  "maison du soigneur": "cabane de la völva",
  "camp de chasseur": "camp de chasse",
  rucher: "rucher d'hydromel",
  puits: "puits sacré",
  port: "port de drakkars",
};

// Le nom d'un bâtiment dans le thème courant (les mots inconnus restent tels quels).
export const tl = (text: string): string => (isViking() ? LABELS[text] ?? text : text);

const VIKING_NAMES: Record<string, string> = {
  Gaspard: "Ragnar",
  Léa: "Astrid",
  Hugo: "Bjorn",
  Maëlle: "Freydis",
  Tom: "Leif",
  Nina: "Sigrid",
  Paul: "Ivar",
  Zoé: "Thyra",
  Jules: "Ulf",
  Camille: "Helga",
};

// Le prénom affiché (la sauvegarde garde le prénom d'origine : on peut revenir au thème classique sans rien perdre).
export const vn = (name: string): string => (isViking() ? VIKING_NAMES[name] ?? name : name);

// ---------- style des chemins (thème viking) : on peut les essayer depuis ☰ Menu ----------
export const ROAD_STYLES = [
  { id: "realiste", label: "Chemin de terre réaliste" },
  { id: "terre", label: "Sentier de terre" },
  { id: "pave", label: "Pavés de pierre" },
  { id: "traces", label: "Traces de charrette" },
  { id: "planches", label: "Passerelle de planches" },
  { id: "poudre", label: "Piste de terre claire" },
] as const;
export type RoadStyle = (typeof ROAD_STYLES)[number]["id"];

const ROAD_KEY = "ferme-roadstyle";
function readRoadStyle(): RoadStyle {
  const q = new URLSearchParams(location.search).get("roadstyle");
  if (q && ROAD_STYLES.some((r) => r.id === q)) return q as RoadStyle;
  try {
    const v = localStorage.getItem(ROAD_KEY);
    if (v && ROAD_STYLES.some((r) => r.id === v)) return v as RoadStyle;
  } catch {
    /* style par défaut */
  }
  return "realiste";
}
let roadStyle: RoadStyle = readRoadStyle();
export const getRoadStyle = () => roadStyle;
export function cycleRoadStyle(): RoadStyle {
  roadStyle = ROAD_STYLES[(ROAD_STYLES.findIndex((r) => r.id === roadStyle) + 1) % ROAD_STYLES.length].id;
  try {
    localStorage.setItem(ROAD_KEY, roadStyle);
  } catch {
    /* tant pis */
  }
  return roadStyle;
}
