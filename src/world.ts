// Génération de la carte : une grande île avec plaines, forêts, collines, lacs et rivières.
// Tout est déterministe (même graine = même carte) et ne dépend d'aucun élément du navigateur.
// Les routes et les ponts n'existent pas : ce sont les joueurs qui les poseront.
import { GRID, SAVE_KEY } from "./config";

// Le numéro de l'île : 0 pour l'île de départ, puis une île différente à chaque voyage en drakkar. Il est lu dans la sauvegarde (?island=n pour essayer).
function readIsland(): number {
  const q = new URLSearchParams(location.search).get("island");
  if (q !== null && Number.isFinite(Number(q))) return Math.max(0, Math.floor(Number(q)));
  try {
    const raw = localStorage.getItem(SAVE_KEY) ?? window.ferme?.readSave(SAVE_KEY) ?? null;
    const n = raw ? Number((JSON.parse(raw) as { island?: number }).island ?? 0) : 0;
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  } catch {
    return 0;
  }
}
export const ISLAND = readIsland();
const IS = ISLAND * 131; // décale les graines du relief
const IO = ISLAND * 37; // et les coordonnées du bruit
// Les reliefs (montagnes, lacs, rivières) tournent d'un quart de tour à chaque île : l'île 0 reste exactement l'île d'origine.
const turn = (fx: number, fy: number): [number, number] => {
  const k = ISLAND % 4;
  return k === 0 ? [fx, fy] : k === 1 ? [1 - fy, fx] : k === 2 ? [1 - fx, 1 - fy] : [fy, 1 - fx];
};

export const SAMPLES = 8; // points de relief par case : la finesse des courbes de niveau
export const N = GRID * SAMPLES + 1;

// Seuils d'altitude (0 = fond de la mer, 1 = sommet).
export const DEEP = 0.3;
export const SHALLOW = 0.37;
export const SAND = 0.41;
export const ROCK = 0.8;

export enum T {
  Deep,
  Shallow,
  Sand,
  Grass,
  Forest,
  Rock,
  Road, // réservé : les routes posées par les joueurs
  Tree, // un arbre isolé occupe la case
}

export const TERRAIN_LABELS: Record<number, string> = {
  [T.Deep]: "eau profonde",
  [T.Shallow]: "eau",
  [T.Sand]: "sable",
  [T.Grass]: "herbe",
  [T.Forest]: "forêt",
  [T.Rock]: "rocher",
  [T.Road]: "route",
  [T.Tree]: "arbre",
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------- bruit ----------

function hash(ix: number, iy: number, seed: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function vnoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, seed);
  const b = hash(ix + 1, iy, seed);
  const c = hash(ix, iy + 1, seed);
  const d = hash(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

function fbm(x: number, y: number, seed: number, octaves: number): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * vnoise(x * freq, y * freq, seed + i * 17);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

export function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- rivières ----------

type Pt = [number, number];

// Courbe lisse passant par des points de contrôle (Catmull-Rom), avec un peu de méandre.
function curve(points: Pt[], step: number, wiggle: number, seed: number): Pt[] {
  const out: Pt[] = [];
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const n = Math.max(2, Math.ceil(len / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]);
  if (wiggle > 0) {
    for (let i = 0; i < out.length; i++) {
      const a = out[Math.max(0, i - 1)];
      const b = out[Math.min(out.length - 1, i + 1)];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const off = (vnoise(i * 0.09, seed, seed) - 0.5) * 2 * wiggle;
      out[i] = [out[i][0] - (dy / l) * off, out[i][1] + (dx / l) * off];
    }
  }
  return out;
}

const mid = GRID / 2;
const K = GRID / 128; // les reliefs gardent leurs proportions quand la carte grandit
const F = (fx: number, fy: number): Pt => {
  const [a, b] = turn(fx, fy);
  return [GRID * a, GRID * b];
};
const Rw = (x: number, y: number): Pt => {
  const [a, b] = turn(x / GRID, y / GRID);
  return [GRID * a, GRID * b];
};

export const RIVERS: { path: Pt[]; width: number }[] = [
  // du lac du nord-est jusqu'à la mer, au sud
  { path: curve([F(0.8, 0.19), F(0.72, 0.31), F(0.64, 0.44), F(0.63, 0.58), F(0.67, 0.7), F(0.58, 0.83), F(0.47, 0.91), Rw(GRID * 0.44, GRID + 3)], 0.5, 2.0, 5 + IS), width: 2.1 },
  // de la montagne du nord-ouest jusqu'à la mer, à l'ouest
  { path: curve([F(0.16, 0.2), F(0.2, 0.33), F(0.14, 0.46), F(0.07, 0.58), Rw(-3, GRID * 0.68)], 0.5, 1.6, 9 + IS), width: 1.7 },
  // relie les deux lacs de l'ouest
  { path: curve([F(0.3, 0.4), F(0.26, 0.5), F(0.31, 0.6), F(0.22, 0.72)], 0.5, 1.2, 14 + IS), width: 1.4 },
  // descend de la montagne du sud jusqu'à la côte
  { path: curve([F(0.57, 0.9), F(0.66, 0.93), Rw(GRID * 0.7, GRID + 3)], 0.5, 0.8, 19 + IS), width: 1.3 },
];

// ---------- relief ----------

export const elev = new Float32Array(N * N);
export const moist = new Float32Array(N * N);
export const tone = new Float32Array(N * N); // variation de ton de l'herbe
export const shade = new Float32Array(N * N); // ombrage du relief (lumière venant du haut-gauche)
const flatZone = new Float32Array(N * N); // 1 = plaine de départ

function buildRelief() {
  const riverDist = new Float32Array(N * N).fill(99);
  for (const r of RIVERS) {
    const reach = r.width * 2.4 + 1;
    for (let i = 0; i < r.path.length - 1; i++) {
      const [ax, ay] = r.path[i];
      const [bx, by] = r.path[i + 1];
      const x0 = Math.max(0, Math.floor((Math.min(ax, bx) - reach) * SAMPLES));
      const x1 = Math.min(N - 1, Math.ceil((Math.max(ax, bx) + reach) * SAMPLES));
      const y0 = Math.max(0, Math.floor((Math.min(ay, by) - reach) * SAMPLES));
      const y1 = Math.min(N - 1, Math.ceil((Math.max(ay, by) + reach) * SAMPLES));
      const dx = bx - ax;
      const dy = by - ay;
      const l2 = dx * dx + dy * dy || 1;
      for (let sy = y0; sy <= y1; sy++) {
        for (let sx = x0; sx <= x1; sx++) {
          const x = sx / SAMPLES;
          const y = sy / SAMPLES;
          const t = clamp01(((x - ax) * dx + (y - ay) * dy) / l2);
          const d = Math.hypot(x - (ax + dx * t), y - (ay + dy * t)) / r.width;
          const k = sy * N + sx;
          if (d < riverDist[k]) riverDist[k] = d;
        }
      }
    }
  }

  // [x, y en fractions de la carte, rayon en cases, hauteur]
  const mountains0: [number, number, number, number][] = [
    [0.82, 0.13, 20, 0.5],
    [0.13, 0.14, 16, 0.45],
    [0.9, 0.62, 12, 0.32],
    [0.18, 0.86, 14, 0.42],
    [0.57, 0.9, 11, 0.34],
    [0.5, 0.08, 9, 0.3],
  ];
  const lakes0: [number, number, number][] = [
    [0.74, 0.3, 10],
    [0.22, 0.72, 7],
    [0.3, 0.4, 6],
    [0.88, 0.8, 6],
    [0.46, 0.2, 5],
  ];

  const mountains = mountains0.map(([fx, fy, r, h]) => [...turn(fx, fy), r, h] as [number, number, number, number]);
  const lakes = lakes0.map(([fx, fy, r]) => [...turn(fx, fy), r] as [number, number, number]);

  for (let sy = 0; sy < N; sy++) {
    for (let sx = 0; sx < N; sx++) {
      const x = sx / SAMPLES;
      const y = sy / SAMPLES;
      const k = sy * N + sx;

      let e = fbm(x * 0.05 + 10 + IO, y * 0.05 + 3 + IO, 11 + IS, 5);
      e = (e - 0.5) * 1.55 + 0.6; // un peu moins d'eau
      for (const [fx, fy, r, h] of mountains) e += h * Math.pow(1 - smoothstep(0, r, Math.hypot(x - fx * GRID, y - fy * GRID) / K), 1.4);
      for (const [fx, fy, r] of lakes) e -= 0.45 * (1 - smoothstep(r * 0.4 * K, r * 0.85 * K, Math.hypot(x - fx * GRID, y - fy * GRID)));

      // île : la mer entoure la carte
      const edge = smoothstep(2, 9 + 4 * vnoise(x * 0.1, y * 0.1, 77 + IS), Math.min(x, y, GRID - x, GRID - y));
      e = lerp(0.12, e, edge);

      // rivières : le lit descend jusqu'à l'eau peu profonde
      const carve = 1 - smoothstep(0.55, 1.5, riverDist[k]);
      e = lerp(e, Math.min(e, 0.335), carve);

      // grande plaine dégagée au centre pour s'installer
      const flat = 1 - smoothstep(11, 22, Math.hypot(x - mid, y - mid));
      e = lerp(e, 0.56, flat * 0.92);
      flatZone[k] = flat;

      elev[k] = e;
      moist[k] = fbm(x * 0.075 + 50 + IO, y * 0.075 + 90 + IO, 29 + IS, 4);
      tone[k] = fbm(x * 0.12 + 5 + IO, y * 0.12 + 40 + IO, 3 + IS, 3);
    }
  }
  // ombrage : différence d'altitude entre le coin haut-gauche et bas-droit
  for (let sy = 1; sy < N - 1; sy++) {
    for (let sx = 1; sx < N - 1; sx++) {
      shade[sy * N + sx] = (elev[(sy - 1) * N + sx - 1] - elev[(sy + 1) * N + sx + 1]) * 9;
    }
  }
}
buildRelief();

// Échantillonnage lissé d'un champ, en coordonnées de cases.
export function sample(field: Float32Array, x: number, y: number): number {
  const fx = Math.min(N - 1.001, Math.max(0, x * SAMPLES));
  const fy = Math.min(N - 1.001, Math.max(0, y * SAMPLES));
  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const u = fx - ix;
  const v = fy - iy;
  const k = iy * N + ix;
  return lerp(lerp(field[k], field[k + 1], u), lerp(field[k + N], field[k + N + 1], u), v);
}

export function forestAmount(m: number, e: number, flat: number): number {
  return smoothstep(0.515, 0.55, m) * smoothstep(0.46, 0.5, e) * (1 - smoothstep(0.7, 0.78, e)) * (1 - smoothstep(0.15, 0.4, flat));
}

export function flatAt(x: number, y: number): number {
  return sample(flatZone, x, y);
}

// ---------- cases et décor ----------

export const cellTerrain = new Uint8Array(GRID * GRID);

export interface MapObject {
  kind: "oak" | "pine" | "bush" | "berry" | "rock" | "flower" | "reed" | "lily" | "tuft";
  x: number; // en cases
  y: number;
  size: number; // 0.6..1.4
  seed: number;
  lone?: boolean; // arbre isolé : une fois abattu, la case se libère pour de bon
  cell?: number; // case occupée par un arbre isolé
  bare?: boolean; // dessin seulement : arbuste à baies déjà cueilli
}

export const objects: MapObject[] = [];

// Un arbre isolé occupe une case : on retrouve l'arbre à partir de la case.
export const loneTreeOfCell = new Map<number, number>();

function classify() {
  const r = rng(2024 + ISLAND * 7);
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const cx = gx + 0.5;
      const cy = gy + 0.5;
      const e = sample(elev, cx, cy);
      const m = sample(moist, cx, cy);
      const flat = flatAt(cx, cy);
      let t: T;
      if (e < DEEP) t = T.Deep;
      else if (e < SHALLOW) t = T.Shallow;
      else if (e < SAND) t = T.Sand;
      else if (e > ROCK) t = T.Rock;
      else if (forestAmount(m, e, flat) > 0.5) t = T.Forest;
      else t = T.Grass;
      cellTerrain[gy * GRID + gx] = t;
    }
  }

  const add = (kind: MapObject["kind"], x: number, y: number, size: number, extra: Partial<MapObject> = {}) =>
    objects.push({ kind, x, y, size, seed: Math.floor(r() * 1e9), ...extra });
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const i = gy * GRID + gx;
      const t = cellTerrain[i] as T;
      const e = sample(elev, gx + 0.5, gy + 0.5);
      const flat = flatAt(gx + 0.5, gy + 0.5);
      const j = () => 0.1 + r() * 0.8;
      if (t === T.Forest) {
        const n = 2 + (r() < 0.5 ? 1 : 0);
        for (let k = 0; k < n; k++) add(e > 0.66 || r() < 0.3 ? "pine" : "oak", gx + j(), gy + j(), 0.8 + r() * 0.6);
        if (r() < 0.4) add("bush", gx + j(), gy + j(), 0.7 + r() * 0.5);
      } else if (t === T.Grass) {
        if (flat < 0.05 && r() < 0.035) {
          add(e > 0.68 ? "pine" : "oak", gx + 0.5, gy + 0.5, 0.8 + r() * 0.5, { lone: true, cell: i });
          cellTerrain[i] = T.Tree;
          loneTreeOfCell.set(i, objects.length - 1);
        } else if (flat < 0.3 && r() < 0.03) {
          add("bush", gx + j(), gy + j(), 0.7 + r() * 0.4);
        } else {
          if (r() < 0.2) add("flower", gx + j(), gy + j(), 0.8 + r() * 0.5);
          if (r() < 0.35) add("tuft", gx + j(), gy + j(), 0.8 + r() * 0.6);
        }
        if (e > 0.66 && r() < 0.06) add("rock", gx + j(), gy + j(), 0.5 + r() * 0.5);
      } else if (t === T.Rock) {
        if (r() < 0.45) add("rock", gx + j(), gy + j(), 0.7 + r() * 0.9);
        if (r() < 0.12) add("pine", gx + j(), gy + j(), 0.8 + r() * 0.4);
      } else if (t === T.Sand) {
        if (r() < 0.05) add("rock", gx + j(), gy + j(), 0.35 + r() * 0.3);
        if (r() < 0.15) add("reed", gx + j(), gy + j(), 0.8 + r() * 0.5);
      } else if (t === T.Shallow) {
        if (r() < 0.12) add("lily", gx + j(), gy + j(), 0.7 + r() * 0.5);
        if (r() < 0.07) add("reed", gx + j(), gy + j(), 0.8 + r() * 0.5);
      }
    }
  }
  // arbustes à baies, semés au hasard sur l'herbe (un tirage à part : le reste de la carte ne bouge pas)
  const rb = rng(777 + ISLAND * 7);
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      if (cellTerrain[gy * GRID + gx] !== T.Grass || rb() > 0.0035) continue;
      const n = 1 + (rb() < 0.3 ? 1 : 0); // rares, parfois deux ensemble
      for (let k = 0; k < n; k++) {
        const x = gx + 0.1 + rb() * 0.8;
        const y = gy + 0.1 + rb() * 0.8;
        objects.push({ kind: "berry", x, y, size: 0.85 + rb() * 0.4, seed: Math.floor(rb() * 1e9) });
      }
    }
  }
  // tri par y : les arbres s'empilent dans le bon ordre ; on refait la table des arbres isolés après le tri
  objects.sort((a, b) => a.y - b.y);
  loneTreeOfCell.clear();
  objects.forEach((o, idx) => {
    if (o.lone && o.cell !== undefined) loneTreeOfCell.set(o.cell, idx);
  });
}
classify();

export function terrainAt(gx: number, gy: number): T {
  if (gx < 0 || gy < 0 || gx >= GRID || gy >= GRID) return T.Deep;
  return cellTerrain[gy * GRID + gx] as T;
}

export const isWater = (t: T) => t === T.Deep || t === T.Shallow;

// Arbres et buissons : ils se dessinent un par un et peuvent être abattus.
export const isTree = (o: MapObject) => o.kind === "oak" || o.kind === "pine";
