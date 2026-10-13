// Dessin de la carte. Le sol est calculé pixel par pixel à partir du relief (courbes de niveau nettes,
// style vectoriel) et gardé en mémoire par morceaux. Les arbres se dessinent un par un (on peut les abattre)
// et l'eau est animée par-dessus à chaque image.
import { CHUNK, GRID } from "./config";
import { C } from "./draw";
import { Zone, zoneBounds, zoneContains } from "./zone";
import { isViking } from "./theme";
import { paintTree } from "./painted";
import {
  DEEP, MapObject, N, ROCK, SAND, SHALLOW, SAMPLES, T, cellTerrain, elev, flatAt, forestAmount, isTree, moist, objects, rng,
  shade, smoothstep, tone, vnoise,
} from "./world";

type RGB = [number, number, number];

const DEEP_A: RGB = [14, 80, 135];
const DEEP_B: RGB = [22, 104, 156];
const SHAL_A: RGB = [32, 150, 196];
const SHAL_B: RGB = [74, 192, 218];
const FOAM: RGB = [226, 246, 249];
const SAND_A: RGB = [238, 222, 170];
const SAND_B: RGB = [221, 199, 138];
const WET_SAND: RGB = [200, 176, 118];
const GRASS_A: RGB = [166, 205, 98];
const GRASS_B: RGB = [148, 190, 86];
const FOREST: RGB = [96, 142, 66];
const HIGH: RGB = [122, 166, 80];
const ROCK_A: RGB = [166, 169, 176];
const ROCK_B: RGB = [118, 121, 130];

// Mélange a et b selon t et écrit dans dst (sans rien allouer : cette fonction tourne pour chaque pixel).
function mixTo(dst: RGB, a: RGB, b: RGB, t: number): RGB {
  dst[0] = a[0] + (b[0] - a[0]) * t;
  dst[1] = a[1] + (b[1] - a[1]) * t;
  dst[2] = a[2] + (b[2] - a[2]) * t;
  return dst;
}

const TMP_A: RGB = [0, 0, 0];
const TMP_B: RGB = [0, 0, 0];

function waterColor(e: number, dst: RGB) {
  if (e < DEEP) return mixTo(dst, DEEP_A, DEEP_B, smoothstep(0.08, DEEP, e));
  const k = Math.min(1, (e - DEEP) / (SHALLOW - DEEP));
  mixTo(dst, DEEP_B, SHAL_A, smoothstep(0, 0.45, k));
  mixTo(dst, dst, SHAL_B, smoothstep(0.45, 0.95, k));
  return mixTo(dst, dst, FOAM, smoothstep(0.88, 1, k) * 0.85); // écume au bord de l'eau
}

function sandColor(e: number, dst: RGB) {
  const k = Math.max(0, (e - SHALLOW) / (SAND - SHALLOW));
  mixTo(dst, WET_SAND, SAND_B, smoothstep(0, 0.4, k));
  return mixTo(dst, dst, SAND_A, smoothstep(0.4, 1, k));
}

function landColor(e: number, m: number, t: number, sh: number, flat: number, dst: RGB) {
  mixTo(dst, GRASS_B, GRASS_A, smoothstep(0.36, 0.64, t));
  mixTo(dst, dst, HIGH, smoothstep(0.64, 0.78, e) * 0.8);
  mixTo(dst, dst, FOREST, forestAmount(m, e, flat));
  const rock = smoothstep(ROCK - 0.015, ROCK + 0.015, e);
  if (rock > 0) {
    mixTo(TMP_B, ROCK_B, ROCK_A, smoothstep(-0.35, 0.45, sh));
    mixTo(dst, dst, TMP_B, rock);
  }
  // le relief se lit surtout en altitude
  const relief = 1 + sh * 0.22 * smoothstep(0.55, 0.8, e);
  dst[0] *= relief;
  dst[1] *= relief;
  dst[2] *= relief;
  return dst;
}

// Couleur du sol en un point : e = altitude, m = humidité, t = ton de l'herbe, sh = ombrage, flat = plaine.
// Les passages entre deux zones sont lissés sur une toute petite plage pour éviter les escaliers.
export function groundColor(e: number, m: number, t: number, sh: number, flat: number, dst: RGB = [0, 0, 0]): RGB {
  const w = 0.003;
  if (e < SHALLOW - w) return waterColor(e, dst);
  if (e < SHALLOW + w) {
    waterColor(e, TMP_A);
    sandColor(e, TMP_B);
    return mixTo(dst, TMP_A, TMP_B, smoothstep(SHALLOW - w, SHALLOW + w, e));
  }
  if (e < SAND - w) return sandColor(e, dst);
  if (e < SAND + w) {
    sandColor(e, TMP_A);
    landColor(e, m, t, sh, flat, TMP_B);
    return mixTo(dst, TMP_A, TMP_B, smoothstep(SAND - w, SAND + w, e));
  }
  return landColor(e, m, t, sh, flat, dst);
}

// ---------- décor ----------

function blob(g: CanvasRenderingContext2D, x: number, y: number, r: number, rand: () => number, pts: number) {
  g.beginPath();
  for (let i = 0; i < pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const rr = r * (0.78 + rand() * 0.3);
    if (i === 0) g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
}

function drawObject(g: CanvasRenderingContext2D, o: Pick<MapObject, "kind" | "x" | "y" | "size" | "seed" | "bare">) {
  const x = o.x * C;
  const y = o.y * C;
  const s = o.size;
  const rand = rng(o.seed);
  const v = rand() * 14 - 7;

  if (isViking() && (o.kind === "oak" || o.kind === "pine")) {
    paintTree(g, x, y, (o.kind === "oak" ? 0.36 : 0.34) * C * s, o.seed, o.kind);
  } else if (o.kind === "oak") {
    const r = 0.34 * C * s;
    g.fillStyle = "rgba(20,40,10,0.24)";
    g.beginPath();
    g.ellipse(x + r * 0.55, y + r * 0.7, r * 1.1, r * 0.9, 0.4, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = `rgb(${56 + v},${100 + v},${42 + v})`;
    for (const [dx, dy, k] of [[0, 0, 1], [-0.55, 0.15, 0.68], [0.5, 0.1, 0.7], [0.05, -0.5, 0.62]]) {
      g.beginPath();
      g.arc(x + dx * r, y + dy * r, r * k, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = `rgb(${82 + v},${128 + v},${56 + v})`;
    g.beginPath();
    g.arc(x - r * 0.28, y - r * 0.3, r * 0.58, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = `rgba(210,240,150,0.28)`;
    g.beginPath();
    g.arc(x - r * 0.4, y - r * 0.42, r * 0.27, 0, Math.PI * 2);
    g.fill();
  } else if (o.kind === "pine") {
    const r = 0.36 * C * s;
    g.fillStyle = "rgba(20,40,10,0.26)";
    g.beginPath();
    g.ellipse(x + r * 0.6, y + r * 0.75, r * 0.95, r * 0.85, 0.4, 0, Math.PI * 2);
    g.fill();
    const star = (rr: number, fill: string) => {
      g.fillStyle = fill;
      g.beginPath();
      const n = 10;
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2;
        const q = i % 2 === 0 ? rr : rr * 0.62;
        g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
      }
      g.closePath();
      g.fill();
    };
    star(r, `rgb(${40 + v},${84 + v},${52 + v})`);
    star(r * 0.68, `rgb(${52 + v},${104 + v},${62 + v})`);
    star(r * 0.36, `rgb(${74 + v},${128 + v},${76 + v})`);
  } else if (o.kind === "bush") {
    const r = 0.17 * C * s;
    g.fillStyle = "rgba(20,40,10,0.2)";
    g.beginPath();
    g.ellipse(x + r * 0.5, y + r * 0.6, r * 1.5, r * 1.1, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = `rgb(${72 + v},${122 + v},${58 + v})`;
    for (const [dx, dy] of [[-0.7, 0], [0.7, 0.1], [0, -0.6]]) {
      g.beginPath();
      g.arc(x + dx * r, y + dy * r, r, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = `rgb(${100 + v},${150 + v},${72 + v})`;
    g.beginPath();
    g.arc(x - r * 0.3, y - r * 0.5, r * 0.55, 0, Math.PI * 2);
    g.fill();
  } else if (o.kind === "berry") {
    // arbuste à baies : plus sombre et plus gros qu'un buisson, avec des baies rouges et bleues quand il est mûr
    const r = 0.2 * C * s;
    g.fillStyle = "rgba(20,40,10,0.22)";
    g.beginPath();
    g.ellipse(x + r * 0.5, y + r * 0.65, r * 1.6, r * 1.15, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = `rgb(${52 + v},${104 + v},${50 + v})`;
    for (const [dx, dy] of [[-0.75, 0.05], [0.75, 0.1], [0, -0.6], [0, 0.45]]) {
      g.beginPath();
      g.arc(x + dx * r, y + dy * r, r * 0.95, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = `rgb(${84 + v},${138 + v},${66 + v})`;
    g.beginPath();
    g.arc(x - r * 0.3, y - r * 0.45, r * 0.55, 0, Math.PI * 2);
    g.fill();
    if (!o.bare) {
      const rr = rng(o.seed);
      const palette = ["#d8334a", "#c0243c", "#6b4fb0"];
      for (let i = 0; i < 9; i++) {
        const a = rr() * Math.PI * 2;
        const d = rr() * r * 1.35;
        g.fillStyle = palette[i % palette.length];
        g.beginPath();
        g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, r * 0.17, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "rgba(255,255,255,0.55)";
        g.beginPath();
        g.arc(x + Math.cos(a) * d - r * 0.05, y + Math.sin(a) * d * 0.8 - r * 0.05, r * 0.05, 0, Math.PI * 2);
        g.fill();
      }
    }
  } else if (o.kind === "rock") {
    const r = 0.2 * C * s;
    g.fillStyle = "rgba(30,30,40,0.25)";
    blob(g, x + r * 0.5, y + r * 0.6, r * 1.05, rng(o.seed), 8);
    g.fill();
    g.fillStyle = "#858892";
    blob(g, x, y, r, rng(o.seed), 8);
    g.fill();
    g.fillStyle = "#aeb1b9";
    blob(g, x - r * 0.18, y - r * 0.22, r * 0.62, rng(o.seed + 1), 7);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.28)";
    blob(g, x - r * 0.3, y - r * 0.35, r * 0.28, rng(o.seed + 2), 6);
    g.fill();
  } else if (o.kind === "flower") {
    const cols = ["#ffffff", "#ffe066", "#f78fb3", "#c9a0f0"];
    const col = cols[Math.floor(rand() * cols.length)];
    const n = 3 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const fx = x + (rand() - 0.5) * 0.28 * C;
      const fy = y + (rand() - 0.5) * 0.28 * C;
      g.fillStyle = col;
      g.beginPath();
      g.arc(fx, fy, 2.4 * s, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#f0b429";
      g.beginPath();
      g.arc(fx, fy, 0.9 * s, 0, Math.PI * 2);
      g.fill();
    }
  } else if (o.kind === "tuft") {
    g.strokeStyle = `rgba(90,140,60,0.7)`;
    g.lineWidth = 1.6;
    g.lineCap = "round";
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(x + i * 3 * s, y + 3 * s);
      g.lineTo(x + i * 5 * s, y - 4 * s);
      g.stroke();
    }
  } else if (o.kind === "reed") {
    g.strokeStyle = "#5f8a3c";
    g.lineWidth = 1.8;
    g.lineCap = "round";
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(x + i * 3 * s, y + 4 * s);
      g.lineTo(x + i * 4.5 * s, y - 6 * s);
      g.stroke();
      g.fillStyle = "#8a5a2c";
      g.beginPath();
      g.arc(x + i * 4.5 * s, y - 6 * s, 1.8 * s, 0, Math.PI * 2);
      g.fill();
    }
  } else if (o.kind === "lily") {
    const r = 0.12 * C * s;
    g.fillStyle = "rgba(0,50,70,0.22)";
    g.beginPath();
    g.ellipse(x + 2, y + 3, r, r * 0.9, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#4f9a4a";
    g.beginPath();
    g.moveTo(x, y);
    g.arc(x, y, r, 0.4, Math.PI * 2 - 0.1);
    g.closePath();
    g.fill();
    if (rand() < 0.4) {
      g.fillStyle = "#f7a8c4";
      g.beginPath();
      g.arc(x + r * 0.2, y - r * 0.2, r * 0.32, 0, Math.PI * 2);
      g.fill();
    }
  }
}

// Arbres et buissons : sprites dessinés une fois (6 variantes) puis recopiés, c'est beaucoup plus rapide.
const SPRITE = 160; // taille d'un sprite en cases * C / 64 : 160 px de côté pour un arbre de taille 1
const spriteCache = new Map<string, HTMLCanvasElement>();
function treeSprite(kind: "oak" | "pine" | "bush" | "berry", variant: number, bare = false): HTMLCanvasElement {
  const key = `${kind}:${variant}:${bare ? 1 : 0}`;
  let cv = spriteCache.get(key);
  if (!cv) {
    cv = document.createElement("canvas");
    cv.width = cv.height = SPRITE * 2; // double résolution pour rester net en zoomant
    const g = cv.getContext("2d")!;
    g.scale(2, 2);
    drawObject(g, { kind, x: SPRITE / 2 / C, y: SPRITE / 2 / C, size: 1, seed: 1000 + variant * 7919, bare });
    spriteCache.set(key, cv);
  }
  return cv;
}

function drawStump(g: CanvasRenderingContext2D, o: MapObject) {
  const x = o.x * C;
  const y = o.y * C;
  const r = 0.11 * C * o.size;
  g.fillStyle = "rgba(20,30,10,0.25)";
  g.beginPath();
  g.ellipse(x + r * 0.4, y + r * 0.5, r * 1.1, r * 0.8, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#6b4a2b";
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#c79a64";
  g.beginPath();
  g.arc(x, y, r * 0.72, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#a8794a";
  g.lineWidth = 1;
  g.beginPath();
  g.arc(x, y, r * 0.4, 0, Math.PI * 2);
  g.stroke();
}

// ---------- morceaux de carte ----------

const HALF = 36; // pixels de sol calculés par case
const CELLPX = 48; // pixels par case dans la mémoire d'un morceau (le jeu les agrandit à C)
const CH = CHUNK * C; // taille d'un morceau en pixels du monde
const MAX_CHUNKS = 40;
const DETAIL_ZOOM = 0.3; // en dessous, on affiche la vue d'ensemble
const OV = 10; // pixels par case de la vue d'ensemble

interface Ripple {
  x: number;
  y: number;
  phase: number;
  speed: number;
  len: number;
  type: 0 | 1 | 2; // 0 = vague, 1 = reflet, 2 = écume
}

export class TerrainRenderer {
  private chunks = new Map<number, HTMLCanvasElement>();
  private perSide = Math.ceil(GRID / CHUNK);
  private baked: MapObject[][] = [];
  private living: number[][] = []; // arbres et buissons par morceau (indices dans `objects`)
  private ripples: Ripple[][] = [];
  private overview = document.createElement("canvas");
  private ovRow = 0;
  private visibleTrees: number[] = [];

  constructor() {
    const n = this.perSide * this.perSide;
    for (let i = 0; i < n; i++) {
      this.baked.push([]);
      this.living.push([]);
      this.ripples.push([]);
    }
    objects.forEach((o, idx) => {
      if (o.kind === "oak" || o.kind === "pine" || o.kind === "bush" || o.kind === "berry") {
        const cx = Math.min(this.perSide - 1, Math.max(0, Math.floor(o.x / CHUNK)));
        const cy = Math.min(this.perSide - 1, Math.max(0, Math.floor(o.y / CHUNK)));
        this.living[cy * this.perSide + cx].push(idx);
      } else {
        const x0 = Math.max(0, Math.floor((o.x - 1.3) / CHUNK));
        const x1 = Math.min(this.perSide - 1, Math.floor((o.x + 1.3) / CHUNK));
        const y0 = Math.max(0, Math.floor((o.y - 1.3) / CHUNK));
        const y1 = Math.min(this.perSide - 1, Math.floor((o.y + 1.3) / CHUNK));
        for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) this.baked[cy * this.perSide + cx].push(o);
      }
    });

    // Vaguelettes, reflets et écume : positions fixes, mais animées à l'affichage.
    const r = rng(99);
    const isLand = (gx: number, gy: number) => {
      const t = cellTerrain[Math.min(GRID - 1, Math.max(0, gy)) * GRID + Math.min(GRID - 1, Math.max(0, gx))];
      return t !== T.Deep && t !== T.Shallow;
    };
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        const t = cellTerrain[gy * GRID + gx];
        if (t !== T.Deep && t !== T.Shallow) continue;
        const list = this.ripples[Math.floor(gy / CHUNK) * this.perSide + Math.floor(gx / CHUNK)];
        const coast = t === T.Shallow && (isLand(gx - 1, gy) || isLand(gx + 1, gy) || isLand(gx, gy - 1) || isLand(gx, gy + 1));
        const add = (type: 0 | 1 | 2, len: number) =>
          list.push({ x: gx + 0.1 + r() * 0.8, y: gy + 0.1 + r() * 0.8, phase: r() * 6.28, speed: 0.0008 + r() * 0.0014, len, type });
        if (r() < 0.55) add(0, 0.7 + r() * 0.6);
        if (r() < 0.5) add(1, 1);
        if (coast) {
          add(2, 0.8 + r() * 0.5);
          if (r() < 0.6) add(2, 0.6 + r() * 0.5);
        }
      }
    }
    this.initOverview();
  }

  // ---------- sol ----------

  private build(cx: number, cy: number): HTMLCanvasElement {
    const size = CHUNK * HALF;
    const tmp = document.createElement("canvas");
    tmp.width = tmp.height = size;
    const tg = tmp.getContext("2d")!;
    const img = tg.createImageData(size, size);
    const scratch: RGB = [0, 0, 0];
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const x = cx * CHUNK + (px + 0.5) / HALF;
        const y = cy * CHUNK + (py + 0.5) / HALF;
        const fx = Math.min(N - 1.001, Math.max(0, x * SAMPLES));
        const fy = Math.min(N - 1.001, Math.max(0, y * SAMPLES));
        const ix = Math.floor(fx);
        const iy = Math.floor(fy);
        const u = fx - ix;
        const v = fy - iy;
        const k = iy * N + ix;
        const w00 = (1 - u) * (1 - v);
        const w10 = u * (1 - v);
        const w01 = (1 - u) * v;
        const w11 = u * v;
        const bl = (f: Float32Array) => f[k] * w00 + f[k + 1] * w10 + f[k + N] * w01 + f[k + N + 1] * w11;
        const c = groundColor(bl(elev), bl(moist), bl(tone), bl(shade), flatAt(x, y), scratch);
        const o = (py * size + px) * 4;
        img.data[o] = c[0];
        img.data[o + 1] = c[1];
        img.data[o + 2] = c[2];
        img.data[o + 3] = 255;
      }
    }
    tg.putImageData(img, 0, 0);

    const cv = document.createElement("canvas");
    cv.width = cv.height = CHUNK * CELLPX;
    const g = cv.getContext("2d")!;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "high";
    g.scale(CELLPX / C, CELLPX / C); // on dessine en pixels du monde
    g.translate(-cx * CH, -cy * CH);
    g.drawImage(tmp, cx * CH, cy * CH, CH, CH);
    g.beginPath();
    g.rect(cx * CH, cy * CH, CH, CH);
    g.clip();
    if (isViking()) {
      // du relief tout doux : quelques touffes d'herbe plus foncées (avec des brins) et de légers reflets clairs, sur l'herbe seulement
      const rr = rng(cx * 7919 + cy * 104729 + 5);
      for (let i = 0; i < 90; i++) {
        const wx = cx * CHUNK + rr() * CHUNK;
        const wy = cy * CHUNK + rr() * CHUNK;
        const ix = Math.floor(wx);
        const iy = Math.floor(wy);
        if (ix >= GRID || iy >= GRID || cellTerrain[iy * GRID + ix] !== T.Grass) continue;
        const px = wx * C;
        const py = wy * C;
        const kind = rr();
        const rx = (0.16 + rr() * 0.3) * C;
        if (kind < 0.7) {
          g.fillStyle = `rgba(50,94,38,${0.13 + rr() * 0.12})`; // une touffe plus sombre
          g.beginPath();
          g.ellipse(px, py, rx, rx * 0.6, rr() * 3, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = "rgba(40,82,30,0.5)";
          g.lineWidth = 1.4;
          g.lineCap = "round";
          for (let b = 0; b < 4; b++) {
            const bx = px + (rr() - 0.5) * rx * 1.2;
            const by = py + (rr() - 0.5) * rx * 0.5;
            g.beginPath();
            g.moveTo(bx, by + 4);
            g.quadraticCurveTo(bx + (rr() - 0.5) * 4, by, bx + (rr() - 0.5) * 6, by - 5 - rr() * 5);
            g.stroke();
          }
        } else {
          g.fillStyle = `rgba(205,232,135,${0.1 + rr() * 0.08})`; // un reflet de lumière
          g.beginPath();
          g.ellipse(px, py, rx * 1.2, rx * 0.7, rr() * 3, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
    const list = this.baked[cy * this.perSide + cx];
    for (const o of list) if (o.kind === "tuft" || o.kind === "flower" || o.kind === "reed" || o.kind === "lily") drawObject(g, o);
    for (const o of list) if (o.kind === "rock") drawObject(g, o);
    return cv;
  }

  // Vue d'ensemble : calculée petit à petit, quelques lignes par image.
  private initOverview() {
    this.overview.width = this.overview.height = GRID * OV;
    const g = this.overview.getContext("2d")!;
    g.fillStyle = "#0e5087";
    g.fillRect(0, 0, GRID * OV, GRID * OV);
  }

  stepOverview(budgetMs = 6) {
    const size = GRID * OV;
    if (this.ovRow >= size) return;
    const start = performance.now();
    const g = this.overview.getContext("2d")!;
    const scratch: RGB = [0, 0, 0];
    while (this.ovRow < size && performance.now() - start < budgetMs) {
      const rows = 8;
      const img = g.createImageData(size, rows);
      for (let r = 0; r < rows; r++) {
        const y = (this.ovRow + r + 0.5) / OV;
        for (let px = 0; px < size; px++) {
          const x = (px + 0.5) / OV;
          const sx = Math.min(N - 1.001, x * SAMPLES);
          const sy = Math.min(N - 1.001, y * SAMPLES);
          const k = Math.floor(sy) * N + Math.floor(sx);
          const c = groundColor(elev[k], moist[k], tone[k], shade[k], flatAt(x, y), scratch);
          const o = (r * size + px) * 4;
          img.data[o] = c[0];
          img.data[o + 1] = c[1];
          img.data[o + 2] = c[2];
          img.data[o + 3] = 255;
        }
      }
      g.putImageData(img, 0, this.ovRow);
      this.ovRow += rows;
    }
  }

  // Dessine le sol : vue d'ensemble de loin, morceaux détaillés de près (un seul calculé par image).
  draw(g: CanvasRenderingContext2D, view: { x0: number; y0: number; x1: number; y1: number }, zoom: number, focus: { x: number; y: number }) {
    this.stepOverview();
    const full = GRID * C;
    if (zoom < DETAIL_ZOOM) {
      g.imageSmoothingEnabled = true;
      g.drawImage(this.overview, 0, 0, full, full);
      return;
    }
    const cx0 = Math.max(0, Math.floor(view.x0 / CH));
    const cx1 = Math.min(this.perSide - 1, Math.floor(view.x1 / CH));
    const cy0 = Math.max(0, Math.floor(view.y0 / CH));
    const cy1 = Math.min(this.perSide - 1, Math.floor(view.y1 / CH));
    // le morceau le plus proche du centre de l'écran est construit en premier
    let next: [number, number] | null = null;
    let best = Infinity;
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        if (this.chunks.has(cy * this.perSide + cx)) continue;
        const d = Math.hypot((cx + 0.5) * CH - focus.x, (cy + 0.5) * CH - focus.y);
        if (d < best) {
          best = d;
          next = [cx, cy];
        }
      }
    }
    if (next) this.chunks.set(next[1] * this.perSide + next[0], this.build(next[0], next[1]));

    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const key = cy * this.perSide + cx;
        const cv = this.chunks.get(key);
        if (cv) {
          // on le remet en bout de file : les morceaux les moins utilisés partent en premier
          this.chunks.delete(key);
          this.chunks.set(key, cv);
          g.drawImage(cv, cx * CH, cy * CH, CH, CH);
        } else {
          const s = CHUNK * OV;
          g.drawImage(this.overview, cx * s, cy * s, s, s, cx * CH, cy * CH, CH, CH);
        }
      }
    }
    while (this.chunks.size > MAX_CHUNKS) {
      const oldest = this.chunks.keys().next().value as number;
      this.chunks.delete(oldest);
    }
  }

  // ---------- arbres ----------

  private nearbyLiving(x0: number, y0: number, x1: number, y1: number, out: number[]) {
    const cx0 = Math.max(0, Math.floor(x0 / CHUNK) - 1);
    const cx1 = Math.min(this.perSide - 1, Math.floor(x1 / CHUNK) + 1);
    const cy0 = Math.max(0, Math.floor(y0 / CHUNK) - 1);
    const cy1 = Math.min(this.perSide - 1, Math.floor(y1 / CHUNK) + 1);
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) for (const i of this.living[cy * this.perSide + cx]) out.push(i);
  }

  // Arbres vivants triés de haut en bas ; une souche reste à la place d'un arbre abattu.
  drawTrees(g: CanvasRenderingContext2D, view: { x0: number; y0: number; x1: number; y1: number }, zoom: number, felled: (idx: number) => boolean, picked: (idx: number) => boolean = () => false, gone: (idx: number) => boolean = () => false) {
    if (zoom < DETAIL_ZOOM) return;
    const list = this.visibleTrees;
    list.length = 0;
    this.nearbyLiving(view.x0 / C, view.y0 / C, view.x1 / C, view.y1 / C, list);
    list.sort((a, b) => objects[a].y - objects[b].y);
    const mx = 1.6 * C;
    for (const idx of list) {
      const o = objects[idx];
      const x = o.x * C;
      const y = o.y * C;
      if (x < view.x0 - mx || x > view.x1 + mx || y < view.y0 - mx || y > view.y1 + mx) continue;
      if (o.kind === "berry" && gone(idx)) continue; // disparu : un bâtiment ou un chemin a été posé dessus
      if (isTree(o) && felled(idx)) {
        drawStump(g, o);
        continue;
      }
      const sc = (o.size * C) / 64;
      g.drawImage(treeSprite(o.kind as "oak", o.seed % 6, o.kind === "berry" && picked(idx)), x - (SPRITE / 2) * sc, y - (SPRITE / 2) * sc, SPRITE * sc, SPRITE * sc);
    }
  }

  // Arbres debout dans une zone (indices dans `objects`).
  treesIn(zone: Zone, felled: (idx: number) => boolean): number[] {
    const b = zoneBounds(zone);
    const near: number[] = [];
    this.nearbyLiving(b.x0, b.y0, b.x1, b.y1, near);
    return near.filter((i) => isTree(objects[i]) && !felled(i) && zoneContains(zone, objects[i].x, objects[i].y));
  }

  // Arbustes à baies mûrs dans une zone (indices dans `objects`).
  berriesIn(zone: Zone, picked: (idx: number) => boolean): number[] {
    const b = zoneBounds(zone);
    const near: number[] = [];
    this.nearbyLiving(b.x0, b.y0, b.x1, b.y1, near);
    return near.filter((i) => objects[i].kind === "berry" && !picked(i) && zoneContains(zone, objects[i].x, objects[i].y));
  }

  // Arbre abattable sous un point du monde (en pixels) : le plus proche du centre de sa cime.
  treeAt(wx: number, wy: number, felled: (idx: number) => boolean): number {
    const x = wx / C;
    const y = wy / C;
    const near: number[] = [];
    this.nearbyLiving(x, y, x, y, near);
    let best = -1;
    let bestD = Infinity;
    for (const idx of near) {
      const o = objects[idx];
      if (!isTree(o) || felled(idx)) continue;
      const d = Math.hypot(o.x - x, o.y - y) / (0.4 * o.size);
      if (d < 1 && d < bestD) {
        best = idx;
        bestD = d;
      }
    }
    return best;
  }

  // ---------- eau animée ----------

  drawWater(g: CanvasRenderingContext2D, view: { x0: number; y0: number; x1: number; y1: number }, zoom: number, tms: number) {
    if (zoom < DETAIL_ZOOM) return;
    const cx0 = Math.max(0, Math.floor(view.x0 / CH));
    const cx1 = Math.min(this.perSide - 1, Math.floor(view.x1 / CH));
    const cy0 = Math.max(0, Math.floor(view.y0 / CH));
    const cy1 = Math.min(this.perSide - 1, Math.floor(view.y1 / CH));
    g.lineCap = "round";
    g.strokeStyle = "#ffffff";
    g.fillStyle = "#ffffff";
    for (let pass = 0; pass < 3; pass++) {
      g.lineWidth = pass === 2 ? 3.2 : 2;
      for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) {
          for (const r of this.ripples[cy * this.perSide + cx]) {
            if (r.type !== pass) continue;
            const ph = r.phase + tms * r.speed;
            const s = Math.sin(ph);
            if (s <= 0) continue;
            const x = r.x * C + Math.sin(ph * 0.5) * 0.14 * C;
            const y = r.y * C;
            if (pass === 1) {
              g.globalAlpha = 0.55 * s * s;
              g.beginPath();
              g.arc(x, y, 1.4 + 1.2 * s, 0, Math.PI * 2);
              g.fill();
              continue;
            }
            const l = 0.18 * C * r.len;
            const lift = (pass === 2 ? 0.07 : 0.05) * C * s;
            g.globalAlpha = (pass === 2 ? 0.75 : 0.34) * s * s;
            g.beginPath();
            g.moveTo(x - l, y);
            g.quadraticCurveTo(x - l / 2, y - lift, x, y);
            g.quadraticCurveTo(x + l / 2, y + lift, x + l, y);
            g.stroke();
          }
        }
      }
    }
    g.globalAlpha = 1;
  }

  // Petite carte du monde pour s'orienter.
  minimap(size: number): HTMLCanvasElement {
    const cv = document.createElement("canvas");
    cv.width = cv.height = size;
    const g = cv.getContext("2d")!;
    const img = g.createImageData(size, size);
    const scratch: RGB = [0, 0, 0];
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        const x = ((px + 0.5) / size) * GRID;
        const y = ((py + 0.5) / size) * GRID;
        const sx = Math.min(N - 1.001, x * SAMPLES);
        const sy = Math.min(N - 1.001, y * SAMPLES);
        const k = Math.floor(sy) * N + Math.floor(sx);
        const c = groundColor(elev[k], moist[k], tone[k], shade[k], flatAt(x, y), scratch);
        const o = (py * size + px) * 4;
        img.data[o] = c[0];
        img.data[o + 1] = c[1];
        img.data[o + 2] = c[2];
        img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return cv;
  }
}
