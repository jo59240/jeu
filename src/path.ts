// Recherche de chemin sur la grille (A*). On contourne l'eau, les rochers, les arbres, les camps et les dépôts.
// Les chemins posés par les joueurs sont préférés (on y marche plus vite). Les diagonales ne coupent pas les angles.
// En mode « chemin seulement », on ne marche que sur des cases de chemin, en ligne droite (pas de diagonale).
import { GRID } from "./config";
import { Save, roadAt, walkableByPeople as walkable } from "./state";

type Cell = { gx: number; gy: number };

const ORTHO: [number, number][] = [[0, 1], [-1, 0], [0, -1], [1, 0]];
const DIAG: [number, number][] = [[1, 1], [-1, 1], [1, -1], [-1, -1]];

const ROAD_COST = 0.7; // marcher sur un chemin « coûte » moins : les trajets le suivent volontiers

// Plus proche case praticable autour d'une case visée (rayon limité).
function nearestWalkable(s: Save, c: Cell, radius: number, avoid?: Set<number>): Cell | null {
  const ok = (gx: number, gy: number) => walkable(s, gx, gy) && !avoid?.has(gy * GRID + gx);
  if (ok(c.gx, c.gy)) return c;
  let best: Cell | null = null;
  let bestD = Infinity;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const gx = c.gx + dx;
      const gy = c.gy + dy;
      if (!ok(gx, gy)) continue;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = { gx, gy };
      }
    }
  }
  return best;
}

// Petit tas binaire : la case la plus prometteuse sort en premier.
class Heap {
  private keys: number[] = [];
  private vals: number[] = [];
  get size() {
    return this.keys.length;
  }
  push(key: number, val: number) {
    let i = this.keys.length;
    this.keys.push(key);
    this.vals.push(val);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.keys[p] <= this.keys[i]) break;
      [this.keys[p], this.keys[i]] = [this.keys[i], this.keys[p]];
      [this.vals[p], this.vals[i]] = [this.vals[i], this.vals[p]];
      i = p;
    }
  }
  pop(): number {
    const top = this.vals[0];
    const lastK = this.keys.pop()!;
    const lastV = this.vals.pop()!;
    if (this.keys.length) {
      this.keys[0] = lastK;
      this.vals[0] = lastV;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < this.keys.length && this.keys[l] < this.keys[m]) m = l;
        if (r < this.keys.length && this.keys[r] < this.keys[m]) m = r;
        if (m === i) break;
        [this.keys[m], this.keys[i]] = [this.keys[i], this.keys[m]];
        [this.vals[m], this.vals[i]] = [this.vals[i], this.vals[m]];
        i = m;
      }
    }
    return top;
  }
}

// Renvoie les centres des cases à traverser (sans la case de départ), ou null si l'on ne peut pas y aller.
// roadOnly : on ne marche que sur des cases de chemin (la destination doit en être une).
// avoid : cases à contourner (par exemple celles où des personnages se tiennent immobiles) ; la destination est alors la plus proche case libre.
export function findPath(s: Save, from: Cell, target: Cell, roadOnly = false, avoid?: Set<number>): [number, number][] | null {
  const to = roadOnly ? (roadAt(s, target.gx, target.gy) && !avoid?.has(target.gy * GRID + target.gx) ? target : null) : nearestWalkable(s, target, 3, avoid);
  if (!to) return null;

  // Table des cases praticables, calculée une fois (la recherche en teste des milliers).
  const walk = new Uint8Array(GRID * GRID);
  const road = new Uint8Array(GRID * GRID);
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const i = gy * GRID + gx;
      road[i] = roadAt(s, gx, gy) ? 1 : 0;
      walk[i] = avoid?.has(i) ? 0 : roadOnly ? road[i] : walkable(s, gx, gy) ? 1 : 0;
    }
  }
  const ok = (x: number, y: number) => x >= 0 && y >= 0 && x < GRID && y < GRID && walk[y * GRID + x] === 1;

  const idx = (c: Cell) => c.gy * GRID + c.gx;
  const best = new Float64Array(GRID * GRID).fill(Infinity); // en double : en simple précision, des chemins de même coût se re-parcouraient à l'infini
  const prev = new Int32Array(GRID * GRID).fill(-1);
  const heap = new Heap();
  const h = (gx: number, gy: number) => Math.hypot(gx - to.gx, gy - to.gy) * ROAD_COST;
  best[idx(from)] = 0;
  heap.push(h(from.gx, from.gy), idx(from));

  let found = false;
  while (heap.size) {
    const cur = heap.pop();
    const gx = cur % GRID;
    const gy = Math.floor(cur / GRID);
    if (gx === to.gx && gy === to.gy) {
      found = true;
      break;
    }
    const g0 = best[cur];
    const visit = (nx: number, ny: number, cost: number) => {
      const n = ny * GRID + nx;
      const g1 = g0 + cost * (road[n] ? ROAD_COST : 1);
      if (g1 < best[n] - 1e-9) {
        best[n] = g1;
        prev[n] = cur;
        heap.push(g1 + h(nx, ny), n);
      }
    };
    for (const [dx, dy] of ORTHO) if (ok(gx + dx, gy + dy)) visit(gx + dx, gy + dy, 1);
    if (roadOnly) continue;
    for (const [dx, dy] of DIAG) {
      // la diagonale n'est permise que si les deux chemins en L sont libres
      if (ok(gx + dx, gy + dy) && ok(gx + dx, gy) && ok(gx, gy + dy)) visit(gx + dx, gy + dy, Math.SQRT2);
    }
  }
  if (!found) return null;

  const path: [number, number][] = [];
  for (let n = idx(to); n !== idx(from) && n !== -1; n = prev[n]) path.push([(n % GRID) + 0.5, Math.floor(n / GRID) + 0.5]);
  return path.reverse();
}

// Plus court trajet par les chemins depuis l'une des cases `starts` jusqu'à l'une des cases `goals`.
// Renvoie la case de départ retenue et les cases à traverser (sans cette case de départ).
export function roadRoute(s: Save, starts: Cell[], goals: Cell[]): { start: Cell; path: [number, number][] } | null {
  const goalSet = new Set(goals.map((c) => c.gy * GRID + c.gx));
  const parent = new Map<number, number>(); // case -> case précédente (-1 pour un départ)
  const queue: number[] = [];
  for (const c of starts) {
    const i = c.gy * GRID + c.gx;
    if (!parent.has(i)) {
      parent.set(i, -1);
      queue.push(i);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head];
    if (goalSet.has(cur)) {
      const path: [number, number][] = [];
      let n = cur;
      while (parent.get(n) !== -1) {
        path.push([(n % GRID) + 0.5, Math.floor(n / GRID) + 0.5]);
        n = parent.get(n)!;
      }
      return { start: { gx: n % GRID, gy: Math.floor(n / GRID) }, path: path.reverse() };
    }
    const gx = cur % GRID;
    const gy = Math.floor(cur / GRID);
    for (const [dx, dy] of ORTHO) {
      const nx = gx + dx;
      const ny = gy + dy;
      if (!roadAt(s, nx, ny)) continue;
      const n = ny * GRID + nx;
      if (parent.has(n)) continue;
      parent.set(n, cur);
      queue.push(n);
    }
  }
  return null;
}
