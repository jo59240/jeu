// Le style « peint » du thème viking : sol de terre marbrée, murets de pierre, bâtiments vus en coupe (sans toit) avec leur intérieur meublé.
// Chaque bâtiment est dessiné une fois dans une image (cache) puis recopié : seuls les éléments qui bougent (animaux, niveaux, fumée…) sont dessinés en direct.
// Le thème classique n'utilise rien de ce fichier.
import { themeContext } from "./theme";

const C = 64; // pixels du monde par case (comme dans draw.ts)

// ---------- outils ----------

// Générateur pseudo-aléatoire : le même dessin à chaque fois, sans rien sauvegarder.
export function prand(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type G = CanvasRenderingContext2D;
const cache = new Map<string, HTMLCanvasElement>();

// Dessine (une seule fois par clé) un bâtiment de `size` cases dans une image à double résolution, puis la recopie à sa place dans le monde.
export function blit(g: G, key: string, gx: number, gy: number, size: number, paint: (c: G) => void) {
  let cv = cache.get(key);
  if (!cv) {
    cv = document.createElement("canvas");
    cv.width = cv.height = size * C * 2;
    const c = cv.getContext("2d")!;
    themeContext(c);
    c.scale(2, 2);
    paint(c);
    realism(c, size);
    cache.set(key, cv);
  }
  g.drawImage(cv, gx * C, gy * C, size * C, size * C);
}

// Le réalisme : une lumière douce en diagonale, des taches d'usure et de saleté, un grain fin et des coulures, uniquement là où quelque chose est dessiné.
function realism(c: G, size: number) {
  const W = size * C;
  const r = prand(size * 1013 + W);
  c.save();
  c.globalCompositeOperation = "source-atop";
  const gr = c.createLinearGradient(0, 0, W, W);
  gr.addColorStop(0, "rgba(255,244,214,0.11)");
  gr.addColorStop(0.5, "rgba(0,0,0,0)");
  gr.addColorStop(1, "rgba(20,10,0,0.16)");
  c.fillStyle = gr;
  c.fillRect(0, 0, W, W);
  for (let i = 0; i < W / 4; i++) { // taches d'usure
    c.fillStyle = r() < 0.6 ? `rgba(30,20,8,${0.04 + r() * 0.06})` : `rgba(255,240,205,${0.03 + r() * 0.05})`;
    c.beginPath();
    c.ellipse(r() * W, r() * W, 6 + r() * 24, 4 + r() * 14, r() * 3, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = "rgba(15,8,2,0.06)"; // coulures de pluie
  c.lineWidth = 1;
  for (let i = 0; i < W / 3; i++) {
    const x = r() * W;
    const y = r() * W;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + (r() - 0.5) * 2, y + 6 + r() * 16);
    c.stroke();
  }
  const n = Math.round((W * W) / 12);
  for (let i = 0; i < n; i++) { // grain
    const s = 0.6 + r() * 1.1;
    c.fillStyle = r() < 0.55 ? `rgba(0,0,0,${0.07 + r() * 0.1})` : `rgba(255,240,205,${0.06 + r() * 0.09})`;
    c.fillRect(r() * W, r() * W, s, s);
  }
  c.restore();
}

// Du relief sur un corps elliptique (animal, vêtement) : lumière en haut à gauche, ombre en bas à droite, poils ou fils. Dessiné dans le repère courant, centré en (cx, cy).
export function furShade(g: G, cx: number, cy: number, rx: number, ry: number, seed: number, fur = true, strength = 1) {
  const r = prand(seed);
  g.save();
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  g.clip();
  const gr = g.createLinearGradient(cx - rx * 0.7, cy - ry, cx + rx * 0.7, cy + ry);
  gr.addColorStop(0, `rgba(255,246,222,${0.2 * strength})`);
  gr.addColorStop(0.45, "rgba(0,0,0,0)");
  gr.addColorStop(1, `rgba(12,6,0,${0.3 * strength})`);
  g.fillStyle = gr;
  g.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  const n = Math.round(rx * ry * 0.09);
  g.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const x = cx + (r() * 2 - 1) * rx;
    const y = cy + (r() * 2 - 1) * ry;
    const dark = r() < 0.6;
    g.strokeStyle = dark ? `rgba(15,8,2,${0.14 * strength + r() * 0.08})` : `rgba(255,244,214,${0.1 * strength + r() * 0.06})`;
    g.lineWidth = 0.7 + r() * 0.5;
    const a = fur ? (r() - 0.5) * 0.9 : r() < 0.5 ? 0 : Math.PI / 2; // poils le long du corps, ou trame et chaîne d'un tissu
    const l = fur ? 1.5 + r() * 2.5 : 1.2 + r() * 1.8;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  g.restore();
}

const DIRTS = ["#9a7b54", "#7f6340", "#a58660", "#74593a", "#8a6e49"];

// Terre battue marbrée dans un rectangle arrondi, avec quelques touffes d'herbe et des cailloux.
export function dirtGround(g: G, x: number, y: number, w: number, h: number, rad: number, seed: number, grass = 0.5) {
  const r = prand(seed);
  g.fillStyle = "#8d6f4b";
  g.beginPath();
  g.roundRect(x, y, w, h, rad);
  g.fill();
  g.save();
  g.clip();
  const n = Math.round((w * h) / 900);
  for (let i = 0; i < n; i++) {
    g.fillStyle = DIRTS[i % DIRTS.length];
    g.globalAlpha = 0.3 + r() * 0.35;
    g.beginPath();
    g.ellipse(x + r() * w, y + r() * h, 8 + r() * 22, 5 + r() * 14, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#6d8f48";
  g.globalAlpha = 0.5 * grass;
  for (let i = 0; i < n / 4; i++) {
    g.beginPath();
    g.ellipse(x + r() * w, y + r() * h, 4 + r() * 9, 3 + r() * 5, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  g.fillStyle = "#b3a58c";
  for (let i = 0; i < n / 5; i++) {
    g.beginPath();
    g.ellipse(x + r() * w, y + r() * h, 1.6 + r() * 2, 1.3 + r() * 1.6, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

// Ornières de charrette : deux traces qui montent depuis le bas vers une porte.
export function ruts(g: G, x: number, y0: number, y1: number) {
  g.save();
  g.globalAlpha = 0.28;
  g.strokeStyle = "#4e3a24";
  g.lineWidth = 3;
  for (const dx of [-9, 9]) {
    g.beginPath();
    g.moveTo(x + dx, y0);
    g.quadraticCurveTo(x + dx * 1.5 - 2, (y0 + y1) / 2, x + dx + 3, y1);
    g.stroke();
  }
  g.restore();
}

// Un muret de pierres irrégulières le long d'un segment, avec des trous éventuels [de, à] en fractions.
export function stoneWall(g: G, ax: number, ay: number, bx: number, by: number, seed: number, gaps: [number, number][] = [], thick = 9, base = 128) {
  const r = prand(seed);
  const len = Math.hypot(bx - ax, by - ay);
  const ux = (bx - ax) / len;
  const uy = (by - ay) / len;
  let d = 0;
  while (d < len) {
    const l = 9 + r() * 8;
    const f = d / len;
    if (!gaps.some(([a, b]) => f >= a && f <= b)) {
      const cx = ax + ux * (d + l / 2) + (r() - 0.5) * 2;
      const cy = ay + uy * (d + l / 2) + (r() - 0.5) * 2;
      const tone = base + Math.floor(r() * 50);
      g.save();
      g.translate(cx, cy);
      g.rotate(Math.atan2(uy, ux));
      g.fillStyle = "rgba(25,20,10,0.35)";
      g.beginPath();
      g.roundRect(-l / 2 + 1.5, -thick / 2 + 2.5, l, thick, 3);
      g.fill();
      g.fillStyle = `rgb(${tone},${tone - 3},${tone - 8})`;
      g.beginPath();
      g.roundRect(-l / 2, -thick / 2, l, thick, 3);
      g.fill();
      g.strokeStyle = "rgba(60,55,45,0.7)";
      g.lineWidth = 1;
      g.stroke();
      g.restore();
    }
    d += l - 1;
  }
}

// Un mur de rondins de bois le long d'un segment.
export function timberWall(g: G, ax: number, ay: number, bx: number, by: number, seed: number, gaps: [number, number][] = [], thick = 9) {
  const r = prand(seed);
  const len = Math.hypot(bx - ax, by - ay);
  const ux = (bx - ax) / len;
  const uy = (by - ay) / len;
  for (let d = 0; d < len; d += 6) {
    const f = d / len;
    if (gaps.some(([a, b]) => f >= a && f <= b)) continue;
    const tone = 70 + Math.floor(r() * 40);
    g.fillStyle = "rgba(20,12,4,0.4)";
    g.beginPath();
    g.arc(ax + ux * d + 1.5, ay + uy * d + 2.5, thick / 2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = `rgb(${tone + 40},${tone + 15},${tone - 15})`;
    g.beginPath();
    g.arc(ax + ux * d, ay + uy * d, thick / 2, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(40,22,8,0.6)";
    g.lineWidth = 1;
    g.stroke();
  }
}

type Wall = "stone" | "timber";

// Les quatre murs d'une pièce vue en coupe ; `door` : trou dans le mur du bas, de x1 à x2 (en pixels).
export function room(g: G, x: number, y: number, w: number, h: number, seed: number, door?: [number, number], wall: Wall = "stone", thick = 11, open?: "top" | "bottom" | "left" | "right") {
  const f = (a: number, b: number): [number, number][] | undefined => (door ? [[(door[0] - a) / (b - a), (door[1] - a) / (b - a)]] : undefined);
  const w1 = wall === "stone" ? stoneWall : timberWall;
  if (open !== "top") w1(g, x, y, x + w, y, seed + 1, [], thick);
  if (open !== "left") w1(g, x, y, x, y + h, seed + 2, [], thick);
  if (open !== "right") w1(g, x + w, y, x + w, y + h, seed + 3, [], thick);
  if (open !== "bottom") w1(g, x, y + h, x + w, y + h, seed + 4, f(x, x + w) ?? [], thick);
  if (door) doors(g, door[0], door[1], y + h);
}

// Une porte de bois vue de dessus, qui ferme l'ouverture du mur : planches verticales, cadre sombre, ferrures et poignée.
export function doors(g: G, x1: number, x2: number, y: number) {
  const w = x2 - x1;
  g.fillStyle = "rgba(20,12,4,0.4)"; // ombre portée
  g.fillRect(x1 + 2, y - 5, w, 13);
  g.fillStyle = "#6e4a2a";
  g.fillRect(x1, y - 6, w, 12);
  const n = Math.max(3, Math.round(w / 9));
  for (let i = 0; i < n; i++) {
    g.fillStyle = i % 2 ? "#8a5a32" : "#7a4e2a";
    g.fillRect(x1 + (i * w) / n + 0.5, y - 5, w / n - 1, 10);
  }
  g.strokeStyle = "#2f1d0e"; // cadre
  g.lineWidth = 2;
  g.strokeRect(x1, y - 6, w, 12);
  g.fillStyle = "#2f2f2f"; // ferrures
  g.fillRect(x1 + 2, y - 2, 7, 4);
  g.fillRect(x2 - 9, y - 2, 7, 4);
  g.fillStyle = "#d9b24a"; // poignée
  g.beginPath();
  g.arc(x1 + w / 2, y, 2.4, 0, Math.PI * 2);
  g.fill();
}

// Plancher de planches.
export function plankFloor(g: G, x: number, y: number, w: number, h: number, seed: number, vertical = true) {
  const r = prand(seed);
  g.fillStyle = "#6f4f31";
  g.fillRect(x, y, w, h);
  const n = Math.round((vertical ? w : h) / 11);
  for (let i = 0; i < n; i++) {
    const tone = 112 + Math.floor(r() * 26);
    g.fillStyle = `rgb(${tone + 22},${tone - 12},${tone - 56})`;
    if (vertical) g.fillRect(x + (i * w) / n, y, w / n - 1, h);
    else g.fillRect(x, y + (i * h) / n, w, h / n - 1);
  }
  g.strokeStyle = "rgba(30,15,5,0.25)";
  g.lineWidth = 1;
  for (let i = 0; i < n * 2; i++) {
    const p = r();
    const q = r();
    g.beginPath();
    if (vertical) {
      g.moveTo(x + p * w, y + q * h);
      g.lineTo(x + p * w, y + q * h + 8);
    } else {
      g.moveTo(x + q * w, y + p * h);
      g.lineTo(x + q * w + 8, y + p * h);
    }
    g.stroke();
  }
}

// Sol de dalles de pierre.
export function flagFloor(g: G, x: number, y: number, w: number, h: number, seed: number, tint = 0) {
  const r = prand(seed);
  g.fillStyle = "#5e5a52";
  g.fillRect(x, y, w, h);
  for (let cy = y; cy < y + h; cy += 16) {
    for (let cx = x + ((cy - y) / 16) % 2 * 9; cx < x + w; cx += 18) {
      const tone = 118 + Math.floor(r() * 36);
      g.fillStyle = `rgb(${tone + tint},${tone - 3},${tone - 9 - tint / 2})`;
      g.beginPath();
      g.roundRect(cx + 0.8, cy + 0.8, 16, 14, 3);
      g.fill();
    }
  }
}

// Ombre sur les bords intérieurs d'une pièce (pas de toit : la lumière vient d'en haut).
export function innerShade(g: G, x: number, y: number, w: number, h: number) {
  const s = g.createLinearGradient(0, y, 0, y + h);
  s.addColorStop(0, "rgba(10,6,2,0.45)");
  s.addColorStop(0.3, "rgba(10,6,2,0)");
  s.addColorStop(1, "rgba(10,6,2,0.22)");
  g.fillStyle = s;
  g.fillRect(x, y, w, h);
}

export function glow(g: G, cx: number, cy: number, rad: number, a = 0.35) {
  const s = g.createRadialGradient(cx, cy, 2, cx, cy, rad);
  s.addColorStop(0, `rgba(255,200,110,${a})`);
  s.addColorStop(1, "rgba(255,200,110,0)");
  g.fillStyle = s;
  g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
}

const shadowed = (g: G, x: number, y: number, w: number, h: number, fill: string, stroke = "#3a2615", rad = 2) => {
  g.fillStyle = "rgba(20,12,4,0.35)";
  g.beginPath();
  g.roundRect(x + 3, y + 4, w, h, rad);
  g.fill();
  g.fillStyle = fill;
  g.beginPath();
  g.roundRect(x, y, w, h, rad);
  g.fill();
  g.strokeStyle = stroke;
  g.lineWidth = 1.5;
  g.stroke();
};

// ---------- le mobilier ----------

export function bed(g: G, x: number, y: number, w = 24, h = 40, blanket = "#a8322d") {
  shadowed(g, x, y, w, h, "#6a4a2a");
  g.fillStyle = "#efe6cf"; // oreiller
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, 10, 3);
  g.fill();
  g.fillStyle = blanket;
  g.beginPath();
  g.roundRect(x + 2, y + 15, w - 4, h - 18, 3);
  g.fill();
  g.strokeStyle = "rgba(0,0,0,0.3)";
  g.lineWidth = 1;
  g.stroke();
}
export function table(g: G, x: number, y: number, w: number, h: number) {
  shadowed(g, x, y, w, h, "#8a6038");
  g.strokeStyle = "rgba(40,22,8,0.45)";
  g.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    g.beginPath();
    g.moveTo(x + 2, y + (i * h) / 4);
    g.lineTo(x + w - 2, y + (i * h) / 4);
    g.stroke();
  }
}
export function stool(g: G, x: number, y: number) {
  g.fillStyle = "rgba(20,12,4,0.35)";
  g.beginPath();
  g.arc(x + 2, y + 3, 6, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#a07344";
  g.beginPath();
  g.arc(x, y, 6, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#3a2615";
  g.lineWidth = 1.2;
  g.stroke();
}
export function crate(g: G, x: number, y: number, s = 22) {
  shadowed(g, x, y, s, s, "#9a7240");
  g.strokeStyle = "#5a3d1c";
  g.lineWidth = 1.5;
  g.strokeRect(x + 3, y + 3, s - 6, s - 6);
  g.beginPath();
  g.moveTo(x + 3, y + 3);
  g.lineTo(x + s - 3, y + s - 3);
  g.stroke();
}
export function barrel(g: G, x: number, y: number, rad = 11) {
  g.fillStyle = "rgba(20,12,4,0.35)";
  g.beginPath();
  g.arc(x + 2, y + 3, rad, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#7a5230";
  g.beginPath();
  g.arc(x, y, rad, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#3a2615";
  g.lineWidth = 1.5;
  g.stroke();
  g.strokeStyle = "#a07344";
  g.beginPath();
  g.arc(x, y, rad * 0.62, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#5e3c20";
  g.beginPath();
  g.arc(x, y, rad * 0.3, 0, Math.PI * 2);
  g.fill();
}
export function sack(g: G, x: number, y: number, tone = "#d8c89a") {
  g.fillStyle = "rgba(20,12,4,0.3)";
  g.beginPath();
  g.ellipse(x + 2, y + 3, 11, 8, 0.3, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = tone;
  g.beginPath();
  g.ellipse(x, y, 11, 8, 0.3, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#8b7a50";
  g.lineWidth = 1.2;
  g.stroke();
}
export function shelf(g: G, x: number, y: number, w: number, seed = 1) {
  const r = prand(seed);
  shadowed(g, x, y, w, 12, "#5e3c20");
  const cols = ["#c9a64a", "#a8322d", "#2f7fc0", "#7a9a4a", "#e6d9b8", "#8a5a96"];
  for (let i = 0; i < w / 9; i++) {
    g.fillStyle = cols[Math.floor(r() * cols.length)];
    g.beginPath();
    g.roundRect(x + 3 + i * 9, y + 2, 6, 8, 2);
    g.fill();
  }
}
export function hearth(g: G, x: number, y: number, w = 34, h = 18) {
  shadowed(g, x, y, w, h, "#6a665e", "#2f2d29", 3);
  g.fillStyle = "#1a1410";
  g.fillRect(x + 4, y + 4, w - 8, h - 6);
  g.fillStyle = "#e8742a";
  g.beginPath();
  g.ellipse(x + w / 2, y + h / 2 + 1, w / 4, h / 4, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#f6c04a";
  g.beginPath();
  g.ellipse(x + w / 2, y + h / 2 + 1, w / 8, h / 8, 0, 0, Math.PI * 2);
  g.fill();
}
export function logPile(g: G, x: number, y: number, cols: number, rows: number, seed = 3) {
  const r = prand(seed);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const cx = x + i * 11 + (j % 2) * 5;
      const cy = y + j * 10;
      g.fillStyle = "rgba(20,12,4,0.35)";
      g.beginPath();
      g.arc(cx + 1.5, cy + 2.5, 5.5, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = `rgb(${150 + Math.floor(r() * 30)},${105 + Math.floor(r() * 20)},${62})`;
      g.beginPath();
      g.arc(cx, cy, 5.5, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#4e3320";
      g.lineWidth = 1;
      g.stroke();
      g.fillStyle = "#d9b98a";
      g.beginPath();
      g.arc(cx, cy, 2.4, 0, Math.PI * 2);
      g.fill();
    }
  }
}
export function hay(g: G, x: number, y: number, rx = 14, ry = 9) {
  g.fillStyle = "rgba(20,12,4,0.3)";
  g.beginPath();
  g.ellipse(x + 2, y + 3, rx, ry, 0.3, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#c8aa5c";
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#8b7338";
  g.lineWidth = 1.2;
  g.stroke();
  g.strokeStyle = "rgba(139,115,56,0.7)";
  g.beginPath();
  g.moveTo(x - rx * 0.5, y - ry * 0.4);
  g.lineTo(x + rx * 0.4, y + ry * 0.5);
  g.stroke();
}
export function bush(g: G, x: number, y: number, rad: number, seed: number) {
  const r = prand(seed);
  g.fillStyle = "rgba(15,30,10,0.3)";
  g.beginPath();
  g.ellipse(x + 3, y + 4, rad, rad * 0.85, 0, 0, Math.PI * 2);
  g.fill();
  for (let i = 0; i < 3; i++) {
    g.fillStyle = ["#3f6a2e", "#4d7d37", "#5f9444"][i];
    g.beginPath();
    g.arc(x + (r() - 0.5) * rad * 0.4 - i, y + (r() - 0.5) * rad * 0.4 - i, rad * (1 - i * 0.22), 0, Math.PI * 2);
    g.fill();
  }
}
// Une haie : des buissons alignés.
export function hedge(g: G, ax: number, ay: number, bx: number, by: number, seed: number, gaps: [number, number][] = []) {
  const len = Math.hypot(bx - ax, by - ay);
  const n = Math.ceil(len / 14);
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    if (gaps.some(([a, b]) => f >= a && f <= b)) continue;
    bush(g, ax + (bx - ax) * f, ay + (by - ay) * f, 8.5, seed + i);
  }
}
// Un petit étal ou toit d'auvent vu de dessus (rayures).
export function awning(g: G, x: number, y: number, w: number, h: number, c1: string, c2 = "#f1e6c8") {
  g.fillStyle = "rgba(20,12,4,0.3)";
  g.fillRect(x + 4, y + 5, w, h);
  const n = Math.round(w / 9);
  for (let i = 0; i < n; i++) {
    g.fillStyle = i % 2 ? c2 : c1;
    g.fillRect(x + (i * w) / n, y, w / n + 0.5, h);
  }
  g.strokeStyle = "#4e3320";
  g.lineWidth = 2;
  g.strokeRect(x, y, w, h);
}
// (plus de seuil clair : la porte à deux battants suffit)
export function doorstep(_g: G, _x1: number, _x2: number, _y: number, _len = 18) {}

// ---------- le décor viking : boucliers, têtes de dragon, pierres runiques, bannières, ramures ----------

const SHIELD_COLORS = ["#a8322d", "#c9972f", "#2f5f8a", "#e6d9b8", "#4a7a3a"];

// Une rangée de boucliers ronds accrochés au mur.
export function shieldRow(g: G, x1: number, x2: number, y: number, seed: number, r = 6.5) {
  const n = Math.max(2, Math.floor((x2 - x1) / (r * 2.9)));
  for (let i = 0; i < n; i++) {
    const x = x1 + ((i + 0.5) * (x2 - x1)) / n;
    g.fillStyle = "rgba(20,10,4,0.4)";
    g.beginPath();
    g.arc(x + 1.2, y + 1.8, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = SHIELD_COLORS[(i + seed) % SHIELD_COLORS.length];
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#2a1a10";
    g.lineWidth = 1.5;
    g.stroke();
    g.strokeStyle = "rgba(255,240,210,0.55)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x - r * 0.7, y);
    g.lineTo(x + r * 0.7, y);
    g.moveTo(x, y - r * 0.7);
    g.lineTo(x, y + r * 0.7);
    g.stroke();
    g.fillStyle = "#b9bec6";
    g.beginPath();
    g.arc(x, y, r * 0.3, 0, Math.PI * 2);
    g.fill();
  }
}

// Une tête de dragon sculptée au bout d'un pignon (regarde vers `dir` : 1 à droite, -1 à gauche).
export function dragonPost(g: G, x: number, y: number, dir: number) {
  g.save();
  g.translate(x, y);
  g.scale(dir * 0.95, 0.95);
  g.fillStyle = "rgba(20,10,4,0.35)";
  g.beginPath();
  g.ellipse(4, 9, 14, 6, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#3a2415";
  g.strokeStyle = "#1c1008";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(0, 8);
  g.quadraticCurveTo(-2, -2, 6, -6);
  g.quadraticCurveTo(12, -12, 18, -8);
  g.lineTo(23, -5);
  g.lineTo(17, -3);
  g.lineTo(20, 0);
  g.lineTo(12, 0);
  g.quadraticCurveTo(8, 4, 8, 8);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = "#e8c24e";
  g.beginPath();
  g.arc(13, -6, 1.5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#c9972f"; // la crête dorée
  g.beginPath();
  g.moveTo(7, -7);
  g.lineTo(9, -13);
  g.lineTo(11, -8);
  g.closePath();
  g.fill();
  g.restore();
}

// Une pierre runique dressée.
export function runeStone(g: G, x: number, y: number, rune = "ᚱ", s = 1) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = "rgba(20,15,10,0.32)";
  g.beginPath();
  g.ellipse(3, 10, 10, 5, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#8d939c";
  g.beginPath();
  g.roundRect(-8, -12, 16, 22, [8, 8, 3, 3]);
  g.fill();
  g.strokeStyle = "#4a4f57";
  g.lineWidth = 1.5;
  g.stroke();
  g.fillStyle = "#e8d9a8";
  g.font = "bold 13px serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(rune, 0, -1);
  g.textBaseline = "alphabetic";
  g.restore();
}

// Une bannière rouge sur sa hampe.
export function banner(g: G, x: number, y: number) {
  g.strokeStyle = "#2a1a10";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x, y + 34);
  g.lineTo(x, y - 4);
  g.stroke();
  g.fillStyle = "#a8322d";
  g.beginPath();
  g.moveTo(x, y - 2);
  g.quadraticCurveTo(x - 12, y + 1, x - 24, y - 1);
  g.lineTo(x - 19, y + 7);
  g.lineTo(x - 24, y + 15);
  g.quadraticCurveTo(x - 12, y + 12, x, y + 14);
  g.closePath();
  g.fill();
  g.strokeStyle = "#e6d9b8";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(x - 4, y + 5);
  g.lineTo(x - 14, y + 5);
  g.stroke();
}

// Une ramure de cerf accrochée au mur.
export function antlers(g: G, x: number, y: number) {
  g.strokeStyle = "#d9cfae";
  g.lineWidth = 2.2;
  g.lineCap = "round";
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + s * 8, y - 3, x + s * 12, y - 12);
    g.moveTo(x + s * 7, y - 3);
    g.lineTo(x + s * 13, y - 4);
    g.moveTo(x + s * 10, y - 8);
    g.lineTo(x + s * 15, y - 10);
    g.stroke();
  }
  g.fillStyle = "#8a6a46";
  g.beginPath();
  g.ellipse(x, y + 1, 5, 4, 0, 0, Math.PI * 2);
  g.fill();
}

// Un râtelier de haches et de lances.
export function axeRack(g: G, x: number, y: number, w = 36) {
  shadowed(g, x, y, w, 7, "#5e3c20", "#2f1d0e", 2);
  for (let i = 0; i < 4; i++) {
    const ax = x + 5 + i * ((w - 10) / 3);
    g.strokeStyle = "#6a4a2a";
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(ax, y + 3);
    g.lineTo(ax, y + 20);
    g.stroke();
    if (i % 2 === 0) {
      g.fillStyle = "#cfd3d8";
      g.beginPath();
      g.moveTo(ax, y + 14);
      g.quadraticCurveTo(ax + 8, y + 12, ax + 7, y + 20);
      g.lineTo(ax, y + 19);
      g.closePath();
      g.fill();
      g.strokeStyle = "#5a5f66";
      g.lineWidth = 1;
      g.stroke();
    } else {
      g.fillStyle = "#cfd3d8";
      g.beginPath();
      g.moveTo(ax - 2, y + 20);
      g.lineTo(ax, y + 26);
      g.lineTo(ax + 2, y + 20);
      g.closePath();
      g.fill();
    }
  }
}

// Le grand foyer central d'une salle vikinge : un bassin de pierre, des braises et la lueur.
export function longHearth(g: G, x: number, y: number, w: number, h: number) {
  glow(g, x + w / 2, y + h / 2, Math.max(w, h) * 1.2, 0.38);
  shadowed(g, x, y, w, h, "#6a665e", "#2f2d29", 5);
  g.fillStyle = "#1a1410";
  g.beginPath();
  g.roundRect(x + 4, y + 4, w - 8, h - 8, 3);
  g.fill();
  g.fillStyle = "#e8742a";
  g.beginPath();
  g.roundRect(x + 7, y + 7, w - 14, h - 14, 3);
  g.fill();
  g.fillStyle = "#f6c04a";
  g.beginPath();
  g.ellipse(x + w / 2, y + h / 2, (w - 14) / 3, (h - 14) / 3, 0, 0, Math.PI * 2);
  g.fill();
}

// Un banc long.
export function bench(g: G, x: number, y: number, w: number, h = 9) {
  shadowed(g, x, y, w, h, "#7a5230", "#3a2615", 2);
}

// Un brasero.
export function brazier(g: G, x: number, y: number) {
  glow(g, x, y, 34, 0.32);
  g.fillStyle = "rgba(20,12,4,0.35)";
  g.beginPath();
  g.arc(x + 2, y + 3, 9, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#4a4743";
  g.beginPath();
  g.arc(x, y, 9, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#e8742a";
  g.beginPath();
  g.arc(x, y, 5.5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#f6c04a";
  g.beginPath();
  g.arc(x, y, 2.5, 0, Math.PI * 2);
  g.fill();
}

// Un filet de pêche étalé.
export function net(g: G, x: number, y: number, w: number, h: number) {
  g.save();
  g.beginPath();
  g.roundRect(x, y, w, h, 6);
  g.clip();
  g.fillStyle = "rgba(60,80,70,0.25)";
  g.fillRect(x, y, w, h);
  g.strokeStyle = "#8a7a52";
  g.lineWidth = 1;
  for (let i = -h; i < w + h; i += 7) {
    g.beginPath();
    g.moveTo(x + i, y);
    g.lineTo(x + i + h, y + h);
    g.moveTo(x + i + h, y);
    g.lineTo(x + i, y + h);
    g.stroke();
  }
  g.restore();
  g.strokeStyle = "#5a4a2a";
  g.lineWidth = 1.5;
  g.beginPath();
  g.roundRect(x, y, w, h, 6);
  g.stroke();
}

// Une peau de bête étendue.
export function pelt(g: G, x: number, y: number, rx: number, ry: number, col = "#6b4a2e") {
  g.fillStyle = "rgba(20,12,4,0.3)";
  g.beginPath();
  g.ellipse(x + 2, y + 3, rx, ry, 0.2, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = col;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0.2, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#3a2615";
  g.lineWidth = 1.3;
  g.stroke();
  g.strokeStyle = "rgba(0,0,0,0.18)";
  g.beginPath();
  g.ellipse(x, y, rx * 0.55, ry * 0.5, 0.2, 0, Math.PI * 2);
  g.stroke();
}

// ---------- les bâtiments ----------

// Maison longue (2 × 2) : murs de rondins, deux lits-bancs, un foyer au centre, des boucliers au mur, des têtes de dragon aux pignons. Entrée en bas à gauche.
export function paintHouse(g: G, seed: number) {
  dirtGround(g, 2, 2, 124, 124, 10, seed, 0.9);
  ruts(g, 32, 128, 108);
  room(g, 8, 10, 112, 96, seed, [14, 52], "timber", 10);
  plankFloor(g, 14, 16, 100, 84, seed + 9);
  innerShade(g, 8, 10, 112, 96);
  bed(g, 16, 22, 20, 52, "#a8322d");
  bed(g, 92, 22, 20, 52, "#2f5f8a");
  longHearth(g, 48, 44, 32, 20);
  bench(g, 44, 70, 40, 8);
  pelt(g, 64, 28, 14, 7, "#8a6a46");
  shieldRow(g, 20, 108, 18, seed, 5.5);
  dragonPost(g, 6, 10, -1);
  dragonPost(g, 122, 10, 1);
  runeStone(g, 112, 118, "ᚨ", 0.8);
}

// Camp de bûcheron (2 × 2) : un appentis ouvert, des bûches empilées, un billot et sa hache, un foyer, un râtelier.
export function paintCamp(g: G, seed: number) {
  dirtGround(g, 2, 2, 124, 124, 10, seed, 0.7);
  ruts(g, 32, 128, 96);
  g.fillStyle = "#6a5030";
  g.fillRect(10, 10, 104, 58);
  plankFloor(g, 12, 12, 100, 54, seed + 3, false);
  innerShade(g, 10, 10, 104, 58);
  for (const px of [10, 112]) for (const py of [10, 66]) {
    g.fillStyle = "#4e3320";
    g.beginPath();
    g.arc(px, py, 5, 0, Math.PI * 2);
    g.fill();
  }
  timberWall(g, 10, 10, 114, 10, seed + 5, [], 8);
  shieldRow(g, 22, 104, 10, seed, 4.5);
  logPile(g, 20, 26, 6, 3, seed);
  logPile(g, 20, 54, 6, 1, seed + 1);
  g.fillStyle = "#8a6038"; // billot et hache
  g.beginPath();
  g.arc(92, 52, 9, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#3a2615";
  g.lineWidth = 1.5;
  g.stroke();
  g.fillStyle = "#cfd3d8";
  g.fillRect(92, 44, 10, 6);
  g.strokeStyle = "#6a4a2a";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(88, 58);
  g.lineTo(100, 46);
  g.stroke();
  g.fillStyle = "#6a665e";
  for (let i = 0; i < 8; i++) {
    g.beginPath();
    g.arc(32 + Math.cos(i * 0.785) * 11, 98 + Math.sin(i * 0.785) * 9, 3.6, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#e8742a";
  g.beginPath();
  g.arc(32, 98, 5, 0, Math.PI * 2);
  g.fill();
  glow(g, 32, 98, 30, 0.28);
  axeRack(g, 70, 84, 40);
  banner(g, 116, 76);
}

// Entrepôt (3 × 3) : un grand hangar de rondins, étagères, caisses, tonneaux et sacs. `level` : plus de marchandises à chaque amélioration.
export function paintDepot(g: G, seed: number, level: number) {
  dirtGround(g, 2, 2, 188, 188, 12, seed, 0.6);
  ruts(g, 96, 192, 168);
  room(g, 8, 10, 176, 154, seed, [70, 122], "timber", 12);
  plankFloor(g, 14, 16, 164, 142, seed + 7);
  innerShade(g, 8, 10, 176, 154);
  shelf(g, 20, 20, 70, seed);
  shelf(g, 100, 20, 70, seed + 1);
  for (let i = 0; i < 4; i++) crate(g, 20 + i * 24, 42, 22);
  for (let i = 0; i < 3; i++) barrel(g, 124 + i * 22, 54, 10);
  crate(g, 20, 68, 22);
  sack(g, 54, 80);
  sack(g, 70, 84, "#c9b58a");
  if (level >= 2) {
    crate(g, 20, 46, 22);
    for (let i = 0; i < 3; i++) crate(g, 124 + i * 24, 72, 22);
    barrel(g, 150, 102, 10);
  }
  if (level >= 3) {
    for (let i = 0; i < 4; i++) sack(g, 30 + i * 22, 114);
    crate(g, 140, 128, 22);
    barrel(g, 20, 132, 10);
  }
  if (level >= 4) for (let i = 0; i < 3; i++) crate(g, 60 + i * 24, 130, 22);
  shieldRow(g, 22, 170, 14, seed, 6);
  dragonPost(g, 6, 12, -1);
  dragonPost(g, 186, 12, 1);
  runeStone(g, 170, 178, "ᚦ", 0.9);
  glow(g, 96, 34, 70, 0.2);
}

// Garde-manger (3 × 3) : une cave-cellier de rondins, étagères de pots, jambons et saucisses suspendus, fromages, sacs de farine, tonneaux d'eau et d'hydromel. `level` : plus fourni à chaque amélioration.
export function paintPantry(g: G, seed: number, level: number) {
  dirtGround(g, 2, 2, 188, 188, 12, seed, 0.6);
  ruts(g, 96, 192, 168);
  room(g, 8, 10, 176, 154, seed, [70, 122], "timber", 12);
  flagFloor(g, 14, 16, 164, 142, seed + 7, 2);
  innerShade(g, 8, 10, 176, 154);
  // les étagères de pots et de bocaux le long du mur du fond
  for (const sx of [20, 100]) {
    shadowed(g, sx, 20, 72, 14, "#5e3c20", "#2f1d0e", 2);
    const r = prand(seed + sx);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = ["#c9a64a", "#a8322d", "#8ab04a", "#e6d9b8", "#8a5a96", "#d9962b"][Math.floor(r() * 6)];
      g.beginPath();
      g.roundRect(sx + 4 + i * 8.5, 22, 6, 10, 2);
      g.fill();
      g.strokeStyle = "rgba(0,0,0,0.35)";
      g.lineWidth = 1;
      g.stroke();
    }
  }
  // jambons et saucisses suspendus à une poutre
  g.strokeStyle = "#3a2615";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(20, 54);
  g.lineTo(168, 54);
  g.stroke();
  for (let i = 0; i < 7; i++) {
    if (i % 3 === 1) {
      g.fillStyle = "#a34a30"; // un jambon
      g.beginPath();
      g.ellipse(32 + i * 20, 66, 8, 12, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#4e1c10";
      g.lineWidth = 1.2;
      g.stroke();
    } else {
      g.strokeStyle = i % 3 === 0 ? "#8a3a26" : "#b0553a"; // des saucisses
      g.lineWidth = 4.5;
      g.beginPath();
      g.moveTo(32 + i * 20, 56);
      g.lineTo(32 + i * 20, 80);
      g.stroke();
    }
  }
  // fromages
  for (const [fx, fy] of [[28, 98], [56, 104], [38, 124]]) {
    g.fillStyle = "rgba(20,12,4,0.3)";
    g.beginPath();
    g.ellipse(fx + 2, fy + 3, 13, 11, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#e0b54a";
    g.beginPath();
    g.ellipse(fx, fy, 13, 11, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#8a6a1e";
    g.lineWidth = 1.3;
    g.stroke();
  }
  // sacs de farine, paniers de baies et de légumes
  for (let i = 0; i < 3 + level; i++) sack(g, 100 + (i % 3) * 22, 100 + Math.floor(i / 3) * 20);
  for (const [bx, by, col] of [[150, 98, "#c0243c"], [150, 124, "#f08a24"], [124, 128, "#e8c24e"]] as [number, number, string][]) {
    g.fillStyle = "#8a5a2e";
    g.beginPath();
    g.arc(bx, by, 11, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#3a2615";
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = col;
    for (let k = 0; k < 6; k++) {
      g.beginPath();
      g.arc(bx + Math.cos(k) * 4.5, by + Math.sin(k) * 4.5, 2.6, 0, Math.PI * 2);
      g.fill();
    }
  }
  // tonneaux d'eau et d'hydromel
  barrel(g, 160, 40, 11);
  barrel(g, 160, 64, 11);
  if (level >= 2) {
    barrel(g, 20, 142, 10);
    barrel(g, 42, 144, 10);
    crate(g, 70, 136, 20);
  }
  if (level >= 3) {
    for (let i = 0; i < 3; i++) crate(g, 100 + i * 24, 138, 20);
  }
  shieldRow(g, 22, 170, 14, seed, 5);
  dragonPost(g, 6, 12, -1);
  dragonPost(g, 186, 12, 1);
  runeStone(g, 170, 178, "ᚠ", 0.9);
  glow(g, 96, 36, 70, 0.18);
}

// Scierie (3 × 3) : un hangar ouvert, des grumes, une scie sur son établi (la lame est dessinée en direct), des piles de planches.
export function paintSawmill(g: G, seed: number) {
  dirtGround(g, 2, 2, 188, 188, 12, seed, 0.5);
  ruts(g, 96, 192, 170);
  g.fillStyle = "#7a5a34";
  g.fillRect(10, 10, 172, 160);
  plankFloor(g, 12, 12, 168, 156, seed + 2, false);
  g.fillStyle = "rgba(210,185,130,0.35)";
  for (let i = 0; i < 40; i++) {
    const r = prand(seed + i);
    g.beginPath();
    g.ellipse(14 + r() * 160, 14 + r() * 150, 6 + r() * 10, 3 + r() * 5, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  innerShade(g, 10, 10, 172, 160);
  for (const [px, py] of [[10, 10], [182, 10], [10, 170], [182, 170]]) {
    g.fillStyle = "#4e3320";
    g.beginPath();
    g.arc(px, py, 6, 0, Math.PI * 2);
    g.fill();
  }
  timberWall(g, 10, 10, 182, 10, seed + 4, [], 9);
  timberWall(g, 10, 10, 10, 170, seed + 5, [], 9);
  timberWall(g, 182, 10, 182, 170, seed + 6, [], 9);
  shieldRow(g, 24, 168, 11, seed, 5);
  logPile(g, 24, 30, 8, 3, seed);
  logPile(g, 24, 64, 8, 2, seed + 2);
  shadowed(g, 30, 128, 100, 28, "#8a6038");
  g.strokeStyle = "#3a2615";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(34, 142);
  g.lineTo(126, 142);
  g.stroke();
  for (let i = 0; i < 6; i++) {
    g.fillStyle = i % 2 ? "#d6b57a" : "#c9a46a";
    g.fillRect(132, 30 + i * 6, 40, 5);
  }
  for (let i = 0; i < 5; i++) {
    g.fillStyle = i % 2 ? "#d6b57a" : "#c9a46a";
    g.fillRect(136, 80 + i * 6, 36, 5);
  }
  banner(g, 176, 134);
  runeStone(g, 20, 180, "ᛏ", 0.8);
}

// Puits sacré (2 × 2) : une margelle ronde en pierre, l'eau, une poutre et un seau, et une pierre runique.
export function paintWell(g: G, seed: number) {
  dirtGround(g, 2, 2, 124, 124, 10, seed, 0.9);
  ruts(g, 32, 128, 90);
  const cx = 64;
  const cy = 56;
  g.fillStyle = "rgba(20,12,4,0.35)";
  g.beginPath();
  g.arc(cx + 4, cy + 6, 34, 0, Math.PI * 2);
  g.fill();
  const r = prand(seed);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const tone = 130 + Math.floor(r() * 45);
    g.fillStyle = `rgb(${tone},${tone - 3},${tone - 8})`;
    g.beginPath();
    g.ellipse(cx + Math.cos(a) * 29, cy + Math.sin(a) * 29, 8, 6.5, a, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(60,55,45,0.8)";
    g.lineWidth = 1;
    g.stroke();
  }
  g.fillStyle = "#1f4f7a";
  g.beginPath();
  g.arc(cx, cy, 22, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#3a86c8";
  g.beginPath();
  g.arc(cx - 3, cy - 3, 16, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.4)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(cx - 3, cy - 3, 9, 0.3, 2.2);
  g.stroke();
  g.strokeStyle = "#5a3d1c";
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(cx - 36, cy);
  g.lineTo(cx + 36, cy);
  g.stroke();
  g.fillStyle = "#7a5230";
  g.beginPath();
  g.arc(cx + 24, cy + 14, 6, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#3a2615";
  g.lineWidth = 1.5;
  g.stroke();
  dragonPost(g, cx - 40, cy - 6, -1);
  runeStone(g, 106, 100, "ᚱ", 0.9);
  runeStone(g, 22, 102, "ᛉ", 0.7);
}

// Camp de chasse (2 × 2) : une cabane de rondins, des peaux, des ramures, un arc, et une claie de séchage dehors.
export function paintLodge(g: G, seed: number) {
  dirtGround(g, 2, 2, 124, 124, 10, seed, 0.8);
  ruts(g, 32, 128, 100);
  room(g, 8, 8, 112, 66, seed, [14, 52], "timber", 10);
  plankFloor(g, 14, 14, 100, 54, seed + 6);
  innerShade(g, 8, 8, 112, 66);
  pelt(g, 46, 46, 20, 13, "#6b4a2e");
  table(g, 80, 22, 30, 18);
  g.strokeStyle = "#5a3d1c";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(26, 26, 14, -1.2, 1.2);
  g.stroke();
  antlers(g, 64, 20);
  shieldRow(g, 22, 106, 14, seed, 4.5);
  glow(g, 90, 30, 36, 0.2);
  g.strokeStyle = "#5a3d1c";
  g.lineWidth = 3;
  for (const px of [70, 112]) {
    g.beginPath();
    g.moveTo(px, 84);
    g.lineTo(px, 118);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(70, 90);
  g.lineTo(112, 90);
  g.moveTo(70, 112);
  g.lineTo(112, 112);
  g.stroke();
  for (const [px, py, col] of [[78, 98, "#a0653a"], [92, 98, "#8a5a36"], [104, 98, "#b57a4a"]] as [number, number, string][]) {
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(px, py, 6, 9, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#3a2615";
    g.lineWidth = 1;
    g.stroke();
  }
  dragonPost(g, 6, 10, -1);
}

// Fumoir (3 × 3) : un fumoir de rondins, des quartiers de viande suspendus, un billot, un foyer, des tonneaux.
export function paintButcher(g: G, seed: number) {
  dirtGround(g, 2, 2, 188, 188, 12, seed, 0.5);
  ruts(g, 96, 192, 168);
  room(g, 8, 10, 176, 154, seed, [70, 122], "timber", 12);
  flagFloor(g, 14, 16, 164, 142, seed + 4, 6);
  innerShade(g, 8, 10, 176, 154);
  g.strokeStyle = "#3a2615";
  g.lineWidth = 3;
  for (const py of [36, 64]) {
    g.beginPath();
    g.moveTo(24, py);
    g.lineTo(168, py);
    g.stroke();
    for (let i = 0; i < 7; i++) {
      g.fillStyle = i % 3 === 0 ? "#b5503a" : i % 3 === 1 ? "#a04030" : "#c2654a";
      g.beginPath();
      g.ellipse(34 + i * 21, py + 9, 7, 11, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#5a2418";
      g.lineWidth = 1.2;
      g.stroke();
      g.strokeStyle = "#3a2615";
      g.lineWidth = 3;
    }
  }
  table(g, 22, 98, 60, 28);
  g.fillStyle = "#cfd3d8";
  g.fillRect(36, 108, 22, 4);
  hearth(g, 120, 102, 44, 24);
  glow(g, 142, 114, 54, 0.3);
  barrel(g, 30, 142, 10);
  barrel(g, 52, 144, 10);
  crate(g, 96, 136, 20);
  shieldRow(g, 24, 168, 15, seed, 5);
  antlers(g, 96, 24);
  dragonPost(g, 6, 12, -1);
  dragonPost(g, 186, 12, 1);
}

// Rucher d'hydromel (2 × 2) : un jardin fleuri entouré d'une haie basse, quatre ruches, un tonneau d'hydromel et une pierre runique.
export function paintApiary(g: G, seed: number) {
  dirtGround(g, 2, 2, 124, 124, 10, seed, 1.4);
  const r = prand(seed);
  for (let i = 0; i < 26; i++) {
    g.fillStyle = ["#e9d24a", "#e07a9a", "#f2efe6", "#9a7ad8"][i % 4];
    g.beginPath();
    g.arc(10 + r() * 108, 10 + r() * 108, 2.4, 0, Math.PI * 2);
    g.fill();
  }
  hedge(g, 8, 8, 120, 8, seed + 1);
  hedge(g, 8, 8, 8, 120, seed + 2);
  hedge(g, 120, 8, 120, 120, seed + 3);
  hedge(g, 8, 120, 120, 120, seed + 4, [[0.08, 0.4]]);
  for (const [hx, hy] of [[26, 28], [74, 28], [26, 70], [74, 70]]) {
    shadowed(g, hx, hy, 26, 26, "#c9a24a", "#4e3320", 3);
    g.fillStyle = "#8a6a2a";
    g.fillRect(hx + 3, hy + 3, 20, 7);
    g.fillRect(hx + 3, hy + 14, 20, 7);
    g.fillStyle = "#2a1a08";
    g.fillRect(hx + 9, hy + 22, 8, 3);
  }
  barrel(g, 108, 28, 9);
  runeStone(g, 108, 66, "ᛗ", 0.75);
}

// Cabane de la völva (2 × 2) : une cabane de rondins, des lits aux draps blancs, des fioles, des herbes qui sèchent, un cercle de pierres runiques.
export function paintClinic(g: G, seed: number) {
  dirtGround(g, 2, 2, 124, 124, 10, seed, 1.2);
  const r = prand(seed);
  for (let i = 0; i < 4; i++) {
    g.fillStyle = "#5a4028";
    g.fillRect(78, 78 + i * 11, 40, 8);
    for (let k = 0; k < 6; k++) {
      g.fillStyle = ["#6aa84a", "#8ab85a", "#c9c24a"][Math.floor(r() * 3)];
      g.beginPath();
      g.arc(82 + k * 6.5, 82 + i * 11, 3, 0, Math.PI * 2);
      g.fill();
    }
  }
  room(g, 8, 8, 112, 62, seed, [14, 52], "timber", 10);
  plankFloor(g, 14, 14, 100, 50, seed + 2);
  innerShade(g, 8, 8, 112, 62);
  bed(g, 18, 18, 22, 36, "#f2efe6");
  bed(g, 44, 18, 22, 36, "#f2efe6");
  shelf(g, 74, 18, 36, seed);
  table(g, 76, 38, 30, 16);
  for (let i = 0; i < 4; i++) { // des herbes qui sèchent au mur
    g.fillStyle = ["#6aa84a", "#8ab85a", "#a8c05a", "#6a9a4a"][i];
    g.beginPath();
    g.ellipse(24 + i * 22, 13, 4, 6, 0.2, 0, Math.PI * 2);
    g.fill();
  }
  for (const [rx, ry, ch] of [[30, 98, "ᚠ"], [52, 108, "ᛟ"], [74, 98, "ᚹ"]] as [number, number, string][]) runeStone(g, rx, ry, ch, 0.62);
  dragonPost(g, 118, 10, 1);
}

// Temple d'Odin (3 × 3) : une salle de rondins vue en coupe — idole, braseros, bancs, tapis —, des pierres runiques et un cimetière au sud. `graves` : tombes occupées.
export function paintChurch(g: G, seed: number, graves: number) {
  dirtGround(g, 2, 2, 188, 188, 12, seed, 1.1);
  stoneWall(g, 6, 106, 6, 186, seed + 1, [], 8);
  stoneWall(g, 186, 106, 186, 186, seed + 2, [], 8);
  stoneWall(g, 6, 186, 186, 186, seed + 3, [[0.4, 0.6]], 8);
  let k = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 7; col++) {
      if (col === 3) continue;
      const tx = 22 + col * 24;
      const ty = 122 + row * 22;
      const filled = k++ < graves;
      g.fillStyle = filled ? "#6e5236" : "#85694a";
      g.fillRect(tx - 1, ty + 8, 14, 8);
      if (filled) {
        g.fillStyle = "#9aa0a8";
        g.beginPath();
        g.roundRect(tx + 2, ty - 5, 9, 14, [4, 4, 0, 0]);
        g.fill();
        g.strokeStyle = "#5a5f66";
        g.lineWidth = 1;
        g.stroke();
        g.fillStyle = "#e8d9a8";
        g.font = "bold 7px serif";
        g.textAlign = "center";
        g.fillText(["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ"][(k + tx) % 6], tx + 6.5, ty + 2);
      }
    }
  }
  g.fillStyle = "#b99d6e";
  g.fillRect(84, 108, 24, 80);
  room(g, 24, 10, 144, 98, seed + 10, [84, 108], "timber", 12);
  plankFloor(g, 30, 16, 132, 86, seed + 11, false);
  innerShade(g, 24, 10, 144, 98);
  g.fillStyle = "#7a2f2a";
  g.fillRect(90, 52, 12, 52);
  bench(g, 38, 58, 40, 8);
  bench(g, 38, 76, 40, 8);
  bench(g, 114, 58, 40, 8);
  bench(g, 114, 76, 40, 8);
  // l'idole d'Odin : un pilier sculpté sur une estrade
  shadowed(g, 78, 20, 36, 28, "#5e3c20", "#2f1d0e", 3);
  g.fillStyle = "#3a2415";
  g.beginPath();
  g.roundRect(90, 22, 12, 24, 4);
  g.fill();
  g.fillStyle = "#c9972f";
  g.beginPath();
  g.arc(96, 28, 4.5, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#c9972f";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(90, 36);
  g.lineTo(102, 36);
  g.moveTo(90, 41);
  g.lineTo(102, 41);
  g.stroke();
  brazier(g, 68, 34);
  brazier(g, 124, 34);
  shieldRow(g, 36, 156, 16, seed, 5);
  dragonPost(g, 20, 12, -1);
  dragonPost(g, 172, 12, 1);
  runeStone(g, 12, 60, "ᛟ", 0.9);
  runeStone(g, 180, 60, "ᚦ", 0.9);
}

// Marché (3 × 3) : une place pavée, trois étals aux auvents rayés, des bannières et une pierre runique.
export function paintMarket(g: G, seed: number) {
  g.fillStyle = "rgba(20,12,4,0.2)";
  g.beginPath();
  g.roundRect(6, 8, 186, 186, 12);
  g.fill();
  flagFloor(g, 2, 2, 188, 188, seed, 10);
  stoneWall(g, 4, 4, 188, 4, seed + 1, [], 7, 140);
  stoneWall(g, 4, 4, 4, 188, seed + 2, [], 7, 140);
  stoneWall(g, 188, 4, 188, 188, seed + 3, [], 7, 140);
  stoneWall(g, 4, 188, 188, 188, seed + 4, [[0.34, 0.66]], 7, 140);
  const awn = ["#a8322d", "#2f5f8a", "#c9972f"];
  const goods = ["#e08a3a", "#8ab04a", "#d9c07a"];
  for (let i = 0; i < 3; i++) {
    const sx = 14 + i * 58;
    shadowed(g, sx, 56, 50, 30, "#7a5230", "#3a2615", 2);
    for (let q = 0; q < 4; q++) {
      g.fillStyle = goods[i];
      g.beginPath();
      g.arc(sx + 9 + q * 11, 71, 5, 0, Math.PI * 2);
      g.fill();
    }
    awning(g, sx - 2, 18, 54, 38, awn[i]);
  }
  crate(g, 22, 120, 22);
  crate(g, 46, 126, 22);
  barrel(g, 150, 134, 11);
  sack(g, 164, 112);
  banner(g, 22, 150);
  banner(g, 170, 150);
  runeStone(g, 96, 124, "ᚷ", 0.9);
}

// Salle d'hydromel / taverne (3 × 3) : une grande salle de rondins — foyer central, longues tables, comptoir, boucliers, ramures — et une terrasse.
export function paintTavern(g: G, seed: number) {
  dirtGround(g, 2, 2, 188, 188, 12, seed, 0.5);
  ruts(g, 96, 192, 170);
  room(g, 8, 10, 176, 130, seed, [70, 122], "timber", 12);
  plankFloor(g, 14, 16, 164, 118, seed + 5, false);
  innerShade(g, 8, 10, 176, 130);
  longHearth(g, 66, 62, 60, 22);
  shadowed(g, 18, 22, 90, 14, "#6a4a2a", "#3a2615", 3); // comptoir
  for (let i = 0; i < 5; i++) {
    g.fillStyle = "#e0b04a";
    g.beginPath();
    g.roundRect(26 + i * 16, 25, 8, 9, 2);
    g.fill();
  }
  bench(g, 20, 52, 40, 8);
  table(g, 20, 64, 40, 18);
  bench(g, 20, 86, 40, 8);
  bench(g, 130, 52, 40, 8);
  table(g, 130, 64, 40, 18);
  bench(g, 130, 86, 40, 8);
  barrel(g, 160, 30, 11);
  barrel(g, 160, 108, 11);
  shieldRow(g, 20, 172, 16, seed, 5.5);
  antlers(g, 140, 28);
  dragonPost(g, 6, 12, -1);
  dragonPost(g, 186, 12, 1);
  bench(g, 18, 152, 44, 9);
  bench(g, 18, 172, 44, 9);
  barrel(g, 150, 160, 12);
  runeStone(g, 118, 160, "ᛒ", 0.8);
}

// Chantier naval (6 × 6) : le sol de terre, des murets, des tas de bois ; la cale et le navire sont dessinés en direct.
export function paintShipyard(g: G, seed: number) {
  dirtGround(g, 2, 2, 380, 380, 14, seed, 0.5);
  ruts(g, 160, 384, 300);
  stoneWall(g, 6, 6, 120, 6, seed + 1, [], 8);
  stoneWall(g, 264, 6, 378, 6, seed + 2, [], 8);
  stoneWall(g, 6, 6, 6, 378, seed + 3, [], 8);
  stoneWall(g, 378, 6, 378, 378, seed + 4, [], 8);
  stoneWall(g, 6, 378, 378, 378, seed + 5, [[0.34, 0.46]], 8);
  logPile(g, 24, 300, 7, 3, seed);
  logPile(g, 280, 300, 7, 3, seed + 1);
  crate(g, 30, 250, 22);
  barrel(g, 330, 260, 11);
  sack(g, 300, 250);
  shieldRow(g, 20, 110, 20, seed, 6);
  shieldRow(g, 270, 366, 20, seed + 2, 6);
  runeStone(g, 40, 340, "ᛚ", 1);
  runeStone(g, 340, 340, "ᛞ", 1);
  banner(g, 366, 300);
  banner(g, 24, 190);
}

// Le port viking (3 × 3) : un hangar à bateaux de rondins ouvert sur l'allée, des filets, des séchoirs à poisson, des tonneaux, une pierre runique.
export function paintPort(g: G, seed: number) {
  dirtGround(g, 2, 2, 188, 188, 14, seed, 0.4);
  // l'allée de planches qui mène au quai (au milieu)
  g.fillStyle = "rgba(20,12,4,0.3)";
  g.fillRect(74, 8, 52, 184);
  plankFloor(g, 70, 4, 52, 186, seed + 3, false);
  g.strokeStyle = "#3a2615";
  g.lineWidth = 2;
  g.strokeRect(70, 4, 52, 186);
  // hangar à bateaux, ouvert côté allée
  room(g, 8, 40, 58, 110, seed + 5, undefined, "timber", 10, "right");
  plankFloor(g, 14, 46, 50, 98, seed + 6);
  innerShade(g, 8, 40, 58, 110);
  // une coque retournée
  g.fillStyle = "rgba(20,12,4,0.35)";
  g.beginPath();
  g.ellipse(40, 96, 20, 44, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#6a4426";
  g.beginPath();
  g.moveTo(36, 50);
  g.quadraticCurveTo(58, 96, 36, 142);
  g.quadraticCurveTo(14, 96, 36, 50);
  g.closePath();
  g.fill();
  g.strokeStyle = "#2a1a10";
  g.lineWidth = 2;
  g.stroke();
  g.strokeStyle = "rgba(30,15,5,0.4)";
  g.lineWidth = 1.2;
  for (const k of [-8, 0, 8]) {
    g.beginPath();
    g.moveTo(36 + k * 0.3, 56);
    g.quadraticCurveTo(36 + k * 1.5, 96, 36 + k * 0.3, 136);
    g.stroke();
  }
  shieldRow(g, 18, 56, 44, seed, 4.5);
  // côté droit : séchoirs à poisson, filets, tonneaux
  g.strokeStyle = "#5a3d1c";
  g.lineWidth = 3;
  for (const py of [54, 84]) {
    g.beginPath();
    g.moveTo(134, py);
    g.lineTo(180, py);
    g.stroke();
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i % 2 ? "#b9bec6" : "#a8aeb6";
      g.beginPath();
      g.ellipse(142 + i * 11, py + 8, 3.5, 8, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#5a5f66";
      g.lineWidth = 1;
      g.stroke();
      g.strokeStyle = "#5a3d1c";
      g.lineWidth = 3;
    }
  }
  net(g, 132, 110, 52, 30);
  barrel(g, 146, 156, 10);
  barrel(g, 168, 158, 10);
  crate(g, 28, 160, 20);
  crate(g, 50, 164, 18);
  runeStone(g, 138, 22, "ᚨ", 0.9);
  dragonPost(g, 12, 38, -1);
}

// Fromagerie (3 × 3) : une laiterie de rondins vue en coupe — grande cuve de cuivre, presse, étagères de meules de fromage, bidons de lait et tonneaux. La vapeur est dessinée en direct.
export function paintDairy(g: G, seed: number) {
  dirtGround(g, 2, 2, 188, 188, 12, seed, 0.6);
  ruts(g, 96, 192, 168);
  room(g, 8, 10, 176, 154, seed, [70, 122], "timber", 12);
  flagFloor(g, 14, 16, 164, 142, seed + 8, 8);
  innerShade(g, 8, 10, 176, 154);
  // les étagères de meules de fromage au fond
  const wheel = (x: number, y: number, r = 9) => {
    g.fillStyle = "rgba(20,12,4,0.3)";
    g.beginPath();
    g.ellipse(x + 1.5, y + 2, r, r * 0.9, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#e0b54a";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#8a6a1e";
    g.lineWidth = 1.2;
    g.stroke();
    g.strokeStyle = "rgba(255,240,170,0.5)";
    g.beginPath();
    g.arc(x - 1, y - 1, r * 0.55, 0.3, 2.4);
    g.stroke();
  };
  for (const sx of [20, 100]) {
    shadowed(g, sx, 20, 72, 22, "#5e3c20", "#2f1d0e", 2);
    for (let i = 0; i < 6; i++) wheel(sx + 10 + i * 11.5, 31, 5.5);
  }
  for (let i = 0; i < 6; i++) wheel(28 + i * 24, 58, 9);
  // la grande cuve de cuivre où caille le lait, et sa petite sœur
  const vat = (x: number, y: number, r: number) => {
    g.fillStyle = "rgba(20,12,4,0.35)";
    g.beginPath();
    g.arc(x + 3, y + 5, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#a8602a";
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#5a3010";
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = "#f2efe2";
    g.beginPath();
    g.arc(x, y, r * 0.78, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(180,150,90,0.25)";
    g.beginPath();
    g.arc(x - r * 0.2, y - r * 0.2, r * 0.4, 0, Math.PI * 2);
    g.fill();
  };
  vat(64, 104, 24);
  vat(112, 112, 15);
  // la presse à fromage
  shadowed(g, 142, 86, 30, 40, "#7a5230", "#3a2615", 3);
  g.fillStyle = "#cfd3d8";
  g.fillRect(150, 94, 14, 6);
  wheel(157, 112, 7);
  // bidons de lait, tonneaux
  for (let i = 0; i < 3; i++) {
    g.fillStyle = "rgba(20,12,4,0.3)";
    g.beginPath();
    g.arc(26 + i * 18 + 2, 142, 8, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#c4ccd4";
    g.beginPath();
    g.arc(26 + i * 18, 140, 8, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#5a6672";
    g.lineWidth = 1.3;
    g.stroke();
    g.fillStyle = "#e8eef4";
    g.beginPath();
    g.arc(26 + i * 18, 140, 4.5, 0, Math.PI * 2);
    g.fill();
  }
  barrel(g, 160, 140, 11);
  crate(g, 120, 136, 20);
  shieldRow(g, 22, 170, 15, seed, 5);
  dragonPost(g, 6, 12, -1);
  dragonPost(g, 186, 12, 1);
  runeStone(g, 170, 178, "ᛗ", 0.9);
}

// Le port de pêche (3 × 3) : comme le port, avec en plus des séchoirs chargés de poisson, des caisses de poissons argentés, une table à vider le poisson et des tonneaux de sel.
export function paintFishport(g: G, seed: number) {
  paintPort(g, seed + 99);
  const fish = (x: number, y: number, a = 0, col = "#b9c4cf") => {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(0, 0, 8, 3.2, 0, 0, Math.PI * 2);
    g.moveTo(-6, 0);
    g.lineTo(-12, -4);
    g.lineTo(-12, 4);
    g.closePath();
    g.fill();
    g.strokeStyle = "#5a6672";
    g.lineWidth = 0.9;
    g.stroke();
    g.fillStyle = "#1a2530";
    g.fillRect(4, -1.4, 1.4, 1.4);
    g.restore();
  };
  // des poissons sur les séchoirs
  for (const py of [62, 92]) for (let i = 0; i < 5; i++) fish(139 + i * 9, py, Math.PI / 2, i % 2 ? "#a8b4bf" : "#c4ced8");
  // une caisse pleine de poissons
  shadowed(g, 20, 150, 34, 24, "#9a7240", "#3a2615", 2);
  for (let i = 0; i < 4; i++) fish(30 + (i % 2) * 8, 156 + i * 4.5, 0.2 * i, "#b9c4cf");
  // la table pour vider le poisson
  table(g, 62, 150, 36, 18);
  fish(80, 159, 0.2, "#c4ced8");
  g.fillStyle = "#cfd3d8";
  g.fillRect(70, 163, 14, 2);
  // tonneaux de sel
  barrel(g, 110, 160, 9);
  barrel(g, 130, 162, 9);
  // l'emblème : un grand poisson sur la passerelle
  g.save();
  g.globalAlpha = 0.55;
  fish(96, 118, -Math.PI / 2, "#2f5f8a");
  g.restore();
}

// Une petite barque de pêche vue de dessus, l'étrave vers le haut ; elle tangue doucement.
export function drawBoat(g: G, x: number, y: number, t: number, seed = 0, moored = false) {
  g.save();
  g.translate(x, y + (moored ? 0 : Math.sin(t / 420 + seed) * 2));
  g.rotate(moored ? 0.12 : Math.sin(t / 600 + seed) * 0.06);
  g.fillStyle = "rgba(10,40,60,0.3)";
  g.beginPath();
  g.ellipse(4, 6, 13, 27, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#7a4e2a";
  g.beginPath();
  g.moveTo(0, -27);
  g.quadraticCurveTo(15, -4, 11, 22);
  g.quadraticCurveTo(0, 28, -11, 22);
  g.quadraticCurveTo(-15, -4, 0, -27);
  g.closePath();
  g.fill();
  g.strokeStyle = "#2a1a10";
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = "#a4753f"; // le fond de la barque
  g.beginPath();
  g.moveTo(0, -20);
  g.quadraticCurveTo(9, -3, 6, 18);
  g.quadraticCurveTo(0, 22, -6, 18);
  g.quadraticCurveTo(-9, -3, 0, -20);
  g.closePath();
  g.fill();
  g.strokeStyle = "#5a3d1c"; // bancs
  g.lineWidth = 2;
  for (const by of [-6, 8]) {
    g.beginPath();
    g.moveTo(-8, by);
    g.lineTo(8, by);
    g.stroke();
  }
  g.strokeStyle = "#8a6a46"; // rames
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-9, 0);
  g.lineTo(-24, 5);
  g.moveTo(9, 0);
  g.lineTo(24, 5);
  g.stroke();
  g.fillStyle = "#b9a878"; // un filet roulé
  g.beginPath();
  g.ellipse(0, 14, 5, 3.5, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

// Le quai du port, dessiné en direct car il dépasse du bâtiment : des planches qui avancent dans l'eau (vers le haut), des pieux et une lanterne.
// (x, y) : coin haut-gauche du bâtiment, dans le repère déjà tourné.
export function drawPier(g: G, x: number, y: number) {
  const px = x + C + 6;
  const pw = C - 12;
  const py = y - C * 0.95;
  g.fillStyle = "rgba(10,40,60,0.3)";
  g.fillRect(px + 5, py + 6, pw, C * 1.55);
  g.fillStyle = "#7a5a34";
  g.fillRect(px, py, pw, C * 1.55);
  for (let k = 0; k < 9; k++) {
    g.fillStyle = k % 2 ? "#a47c48" : "#94703e";
    g.fillRect(px + 1, py + 1 + k * 10.8, pw - 2, 9.8);
  }
  g.strokeStyle = "#3a2615";
  g.lineWidth = 2;
  g.strokeRect(px, py, pw, C * 1.55);
  for (const [qx, qy] of [[px - 2, py + 2], [px + pw + 2, py + 2], [px - 2, py + 40], [px + pw + 2, py + 40], [px - 2, py + 78], [px + pw + 2, py + 78]]) {
    g.fillStyle = "rgba(10,20,30,0.35)";
    g.beginPath();
    g.arc(qx + 2, qy + 3, 5.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#4a2f18";
    g.beginPath();
    g.arc(qx, qy, 5.5, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#2a1a10";
    g.lineWidth = 1.5;
    g.stroke();
  }
  g.strokeStyle = "#b9a878"; // cordage d'amarrage
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(px - 2, py + 2);
  g.quadraticCurveTo(px + pw / 2, py + 18, px + pw + 2, py + 2);
  g.stroke();
  g.fillStyle = "#e8a83a"; // lanterne au bout du quai
  g.beginPath();
  g.arc(px + pw / 2, py + 12, 3.2, 0, Math.PI * 2);
  g.fill();
  glow(g, px + pw / 2, py + 12, 22, 0.25);
}

// ---------- enclos d'élevage : étable (vaches) et porcherie (cochons) ----------

// La partie fixe : sol de terre, grange en coupe (stalles ou litière), muret autour avec un passage pour l'entrée. L'auge, l'abreuvoir et les bêtes sont dessinés en direct.
export function paintPen(g: G, seed: number, kind: "stable" | "pigpen") {
  const w = 4 * C;
  dirtGround(g, 2, 2, w - 4, w - 4, 10, seed, 0.7);
  if (kind === "pigpen") { // de la boue
    const r = prand(seed + 5);
    g.fillStyle = "#4e3a24";
    for (let i = 0; i < 4; i++) {
      g.globalAlpha = 0.55;
      g.beginPath();
      g.ellipse(50 + r() * 150, 150 + r() * 70, 22 + r() * 14, 11 + r() * 8, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }
  ruts(g, 96, w, 130);
  const bx = 12;
  const by = 12;
  const bw = w - 24;
  const bh = 104;
  g.fillStyle = "rgba(20,14,6,0.4)";
  g.fillRect(bx + 7, by + 8, bw, bh);
  plankFloor(g, bx, by, bw, bh, seed + 1);
  innerShade(g, bx, by, bw, bh);
  if (kind === "stable") {
    for (let i = 0; i < 4; i++) {
      const sx = bx + 14 + i * ((bw - 28) / 4);
      g.fillStyle = "#4e3320";
      g.fillRect(sx, by + 8, 4, 50);
      g.fillStyle = "#c9a85a";
      g.beginPath();
      g.ellipse(sx + 25, by + 40, 13, 7, 0.2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#6a4a2a";
      g.fillRect(sx + 8, by + 10, 34, 8);
    }
    g.fillStyle = "#4e3320";
    g.fillRect(bx + bw - 18, by + 8, 4, 50);
    sack(g, bx + 34, by + 82);
    barrel(g, bx + bw - 40, by + 82, 9);
  } else {
    for (let i = 0; i < 3; i++) hay(g, bx + 40 + i * 70, by + 40, 26, 14); // litière de paille
    for (let i = 0; i < 4; i++) {
      g.fillStyle = "#c9a85a";
      g.beginPath();
      g.ellipse(bx + 20 + i * 52, by + 80, 14, 8, 0.2, 0, Math.PI * 2);
      g.fill();
    }
    barrel(g, bx + bw - 22, by + 80, 9);
  }
  glow(g, bx + bw / 2, by + 28, 70, 0.28);
  room(g, bx, by, bw, bh, seed + 10, [bx + bw * 0.38, bx + bw * 0.62], "timber", 12);
  shieldRow(g, bx + 14, bx + bw - 14, by + 6, seed, 5.5);
  dragonPost(g, bx - 4, by + 4, -1);
  dragonPost(g, bx + bw + 4, by + 4, 1);
  const f = [[0.24, 0.5]] as [number, number][];
  stoneWall(g, 5, 5, w - 5, 5, seed + 21, [], 8);
  stoneWall(g, 5, 5, 5, w - 5, seed + 22, [], 8);
  stoneWall(g, w - 5, 5, w - 5, w - 5, seed + 23, [], 8);
  stoneWall(g, 5, w - 5, w - 5, w - 5, seed + 24, f, 8);
  for (const [hx, hy] of [[22, w - 40], [58, w - 30]]) hay(g, hx, hy);
}

// Ferme (5 × 5) : le sol, des haies, l'allée et la grange en coupe. Les parcelles, la cuve et la botte de paille sont dessinées en direct.
export function paintFarm(g: G, seed: number) {
  const w = 5 * C;
  dirtGround(g, 2, 2, w - 4, w - 4, 12, seed, 0.9);
  hedge(g, 8, 8, w - 8, 8, seed + 1);
  hedge(g, 8, 8, 8, w - 8, seed + 2);
  hedge(g, w - 8, 8, w - 8, w - 8, seed + 3);
  hedge(g, 8, w - 8, w - 8, w - 8, seed + 4, [[0.4, 0.6]]);
  ruts(g, w / 2, w, 232);
  g.fillStyle = "#b99d6e";
  g.fillRect(w / 2 - 20, 232, 40, w - 232);
  // la grange en coupe, en bas à gauche
  const bx = 16;
  const by = 238;
  g.fillStyle = "rgba(20,14,6,0.35)";
  g.fillRect(bx + 6, by + 7, 92, 62);
  plankFloor(g, bx, by, 92, 62, seed + 8);
  innerShade(g, bx, by, 92, 62);
  crate(g, bx + 10, by + 10, 18);
  sack(g, bx + 46, by + 20);
  barrel(g, bx + 72, by + 22, 9);
  room(g, bx, by, 92, 62, seed + 9, [bx + 28, bx + 64], "timber", 9);
  runeStone(g, w - 36, w - 24, "ᚠ", 0.8);
  banner(g, 26, 216);
}

// Un arbre peint vu de dessus : un houppier en plusieurs couches, de l'ombre portée et des reflets.
export function paintTree(g: G, x: number, y: number, rad: number, seed: number, kind: "oak" | "pine") {
  const r = prand(seed);
  g.fillStyle = "rgba(10,25,8,0.32)";
  g.beginPath();
  g.ellipse(x + rad * 0.3, y + rad * 0.45, rad * 1.05, rad * 0.8, 0, 0, Math.PI * 2);
  g.fill();
  const tones = kind === "oak" ? ["#2f5a2a", "#3b6e32", "#4a8139", "#62984a", "#7db45e"] : ["#1f4a30", "#27583a", "#316a45", "#3d7d52", "#51976a"];
  for (let i = 0; i < tones.length; i++) {
    g.fillStyle = tones[i];
    const k = 1 - i * 0.17;
    for (let b = 0; b < (i === 0 ? 7 : 5); b++) {
      const a = r() * Math.PI * 2;
      const d = rad * (0.15 + r() * 0.35) * (i === 0 ? 1.3 : 0.9);
      g.beginPath();
      g.arc(x + Math.cos(a) * d - i * 0.8, y + Math.sin(a) * d - i * 0.8, rad * 0.55 * k + 2, 0, Math.PI * 2);
      g.fill();
    }
  }
  for (let i = 0; i < 70; i++) { // des feuilles, claires et sombres
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * rad * 0.95;
    g.fillStyle = r() < 0.5 ? "rgba(20,50,16,0.32)" : "rgba(190,225,120,0.3)";
    g.beginPath();
    g.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, 2.2 + r() * 2.4, 1.3 + r() * 1.4, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
}
