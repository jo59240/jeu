// Les animaux sauvages : ils se promènent au hasard sur la carte, s'arrêtent, repartent, et s'enfuient quand un villageois approche.
// Pour l'instant ils ne servent à rien : ils annoncent la nourriture (chasse, élevage) qui viendra ensuite.
import { MEAT, POPULATION } from "./balance";
import { GRID } from "./config";
import { C } from "./draw";
import { Save, walkable } from "./state";
import { T, terrainAt } from "./world";

export type Species = "rabbit" | "deer" | "boar";

interface Info {
  speed: number; // cases par seconde en se promenant
  flee: number; // distance à laquelle un villageois les fait fuir
  range: [number, number]; // longueur d'une promenade, en cases
  rest: [number, number]; // pause entre deux promenades, en secondes
  habitat: number[]; // terrains où ils apparaissent
  meat: number; // portions de viande quand on les chasse
  size: number; // demi-longueur du corps, en cases : il s'arrête à cette distance d'un obstacle
}

const INFO: Record<Species, Info> = {
  rabbit: { speed: 1.5, flee: 4, range: [2, 5], rest: [1, 4], habitat: [T.Grass], meat: MEAT.rabbit, size: 0.3 },
  deer: { speed: 1.1, flee: 5, range: [4, 9], rest: [3, 9], habitat: [T.Grass, T.Forest], meat: MEAT.deer, size: 0.55 },
  boar: { speed: 0.9, flee: 3, range: [3, 7], rest: [3, 8], habitat: [T.Forest], meat: MEAT.boar, size: 0.45 },
};

// Nombre d'animaux au départ : voir balance.ts.
export { POPULATION };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

let nextId = 1;

export class Animal {
  readonly id = nextId++;
  dead = false; // chassé : il disparaît
  x: number; // en cases
  y: number;
  private facing = Math.random() * Math.PI * 2;
  private tx = 0;
  private ty = 0;
  private moving = false;
  private fleeing = false;
  private restT = rand(0, 4); // chaque animal repart à un moment différent
  private phase = Math.random() * 10;

  constructor(readonly kind: Species, x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // Un endroit au hasard où apparaître : un terrain qui lui convient et qu'on peut fouler.
  static spawn(s: Save, kind: Species, near?: { x: number; y: number; r: number }): Animal | null {
    for (let k = 0; k < 400; k++) {
      const gx = near ? Math.floor(near.x + rand(-near.r, near.r)) : Math.floor(rand(0, GRID));
      const gy = near ? Math.floor(near.y + rand(-near.r, near.r)) : Math.floor(rand(0, GRID));
      if (gx < 0 || gy < 0 || gx >= GRID || gy >= GRID) continue;
      if (!INFO[kind].habitat.includes(terrainAt(gx, gy)) || !walkable(s, gx, gy)) continue;
      return new Animal(kind, gx + rand(0.2, 0.8), gy + rand(0.2, 0.8));
    }
    return null;
  }

  get meat() {
    return INFO[this.kind].meat;
  }

  update(dt: number, s: Save, people: { x: number; y: number }[]) {
    const info = INFO[this.kind];
    // un bâtiment vient d'être posé sur lui : il est repoussé sur la case libre la plus proche
    if (!walkable(s, Math.floor(this.x), Math.floor(this.y))) {
      this.eject(s);
      this.moving = false;
      this.restT = 1;
      return;
    }
    // un villageois qui s'approche : l'animal s'éloigne en courant
    let near: { x: number; y: number } | null = null;
    let nd = info.flee;
    for (const p of people) {
      const d = Math.hypot(p.x - this.x, p.y - this.y);
      if (d < nd) {
        nd = d;
        near = p;
      }
    }
    if (near) {
      const a = Math.atan2(this.y - near.y, this.x - near.x);
      const len = rand(3, 5);
      this.tx = this.x + Math.cos(a) * len;
      this.ty = this.y + Math.sin(a) * len;
      this.moving = true;
      this.fleeing = true;
    } else if (this.fleeing && !this.moving) this.fleeing = false;

    if (!this.moving) {
      this.restT -= dt;
      if (this.restT > 0) return;
      this.pickTarget(s, info);
      return;
    }
    const dx = this.tx - this.x;
    const dy = this.ty - this.y;
    const d = Math.hypot(dx, dy);
    const step = info.speed * (this.fleeing ? 2.4 : 1) * dt;
    if (d <= step) {
      this.stop(info);
      return;
    }
    const nx = this.x + (dx / d) * step;
    const ny = this.y + (dy / d) * step;
    // devant lui (à la distance de son corps) et un peu de chaque côté : tout doit être praticable, sinon son corps entrerait dans l'obstacle
    const ux = dx / d;
    const uy = dy / d;
    const m = info.size;
    for (const [fx, fy] of [[1, 0], [1, 0.45], [1, -0.45]]) {
      const px = nx + (ux * fx - uy * fy) * m * (fy ? 0.6 : 1);
      const py = ny + (uy * fx + ux * fy) * m * (fy ? 0.6 : 1);
      if (!walkable(s, Math.floor(px), Math.floor(py))) {
        this.stop(info); // un obstacle (eau, bâtiment, rocher) : il s'arrête et choisira autre chose
        return;
      }
    }
    // le regard tourne doucement vers la direction de marche
    let diff = Math.atan2(dy, dx) - this.facing;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.facing += diff * Math.min(1, dt * 10);
    this.x = nx;
    this.y = ny;
    this.phase += step * (this.kind === "rabbit" ? 7 : 4);
  }

  // Le sort de là où il est coincé : la case libre la plus proche.
  private eject(s: Save) {
    const gx = Math.floor(this.x);
    const gy = Math.floor(this.y);
    for (let r = 1; r < 8; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !walkable(s, gx + dx, gy + dy)) continue;
          this.x = gx + dx + 0.5;
          this.y = gy + dy + 0.5;
          return;
        }
      }
    }
  }

  private stop(info: Info) {
    this.moving = false;
    this.restT = rand(info.rest[0], info.rest[1]);
  }

  private pickTarget(s: Save, info: Info) {
    for (let k = 0; k < 8; k++) {
      const a = Math.random() * Math.PI * 2;
      const len = rand(info.range[0], info.range[1]);
      const tx = this.x + Math.cos(a) * len;
      const ty = this.y + Math.sin(a) * len;
      if (!walkable(s, Math.floor(tx), Math.floor(ty))) continue;
      this.tx = tx;
      this.ty = ty;
      this.moving = true;
      return;
    }
    this.restT = 1; // coincé : il réessaiera un peu plus tard
  }

  // ---------- dessin ----------

  draw(g: CanvasRenderingContext2D, view: { x0: number; y0: number; x1: number; y1: number }) {
    const px = this.x * C;
    const py = this.y * C;
    if (px < view.x0 - C || px > view.x1 + C || py < view.y0 - C || py > view.y1 + C) return;
    const walking = this.moving;
    const hop = this.kind === "rabbit" && walking ? Math.abs(Math.sin(this.phase)) * 4 : 0;
    const swing = walking && this.kind !== "rabbit" ? Math.sin(this.phase) : 0;
    if (this.kind === "rabbit") this.drawRabbit(g, px, py, hop);
    else if (this.kind === "deer") this.drawDeer(g, px, py, swing);
    else this.drawBoar(g, px, py, swing);
  }

  private shadow(g: CanvasRenderingContext2D, px: number, py: number, rx: number, ry: number, lift = 0) {
    g.fillStyle = `rgba(20,40,10,${0.28 - lift * 0.02})`;
    g.beginPath();
    g.ellipse(px + 2, py + 3, rx, ry, this.facing, 0, Math.PI * 2);
    g.fill();
  }

  private drawRabbit(g: CanvasRenderingContext2D, px: number, py: number, hop: number) {
    const r = 0.17 * C;
    this.shadow(g, px, py, r * 1.1, r * 0.8, hop);
    g.save();
    g.translate(px, py - hop);
    g.rotate(this.facing);
    // oreilles couchées vers l'arrière
    g.fillStyle = "#c9b8a4";
    for (const side of [-1, 1]) {
      g.beginPath();
      g.ellipse(-r * 0.2, side * r * 0.42, r * 0.7, r * 0.17, side * 0.25, 0, Math.PI * 2);
      g.fill();
    }
    // corps, queue blanche, tête
    g.fillStyle = "#b8a38a";
    g.beginPath();
    g.ellipse(0, 0, r * 1.0, r * 0.72, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#f4efe6";
    g.beginPath();
    g.arc(-r * 0.98, 0, r * 0.28, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#c4b199";
    g.beginPath();
    g.ellipse(r * 0.9, 0, r * 0.52, r * 0.42, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#3a2a1c";
    g.beginPath();
    g.arc(r * 1.05, -r * 0.2, r * 0.07, 0, Math.PI * 2);
    g.arc(r * 1.05, r * 0.2, r * 0.07, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#e8a0a0";
    g.beginPath();
    g.arc(r * 1.38, 0, r * 0.08, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  private drawDeer(g: CanvasRenderingContext2D, px: number, py: number, swing: number) {
    const r = 0.24 * C;
    this.shadow(g, px, py, r * 1.35, r * 0.8);
    g.save();
    g.translate(px, py);
    g.rotate(this.facing);
    // pattes (vues de dessus : quatre bouts sombres qui alternent)
    g.fillStyle = "#6e4a2a";
    for (const [fx, side] of [[0.7, -1], [0.7, 1], [-0.7, -1], [-0.7, 1]]) {
      const off = (fx > 0 ? 1 : -1) * swing * side * r * 0.35;
      g.beginPath();
      g.ellipse(fx * r + off, side * r * 0.5, r * 0.17, r * 0.12, 0, 0, Math.PI * 2);
      g.fill();
    }
    // corps, petite queue claire
    g.fillStyle = "#a9733f";
    g.beginPath();
    g.ellipse(0, 0, r * 1.15, r * 0.62, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#c28f55";
    g.beginPath();
    g.ellipse(-r * 0.1, -r * 0.1, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#f1e3c8";
    g.beginPath();
    g.arc(-r * 1.15, 0, r * 0.2, 0, Math.PI * 2);
    g.fill();
    // cou et tête
    g.fillStyle = "#a9733f";
    g.beginPath();
    g.ellipse(r * 1.05, 0, r * 0.45, r * 0.3, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(r * 1.5, 0, r * 0.42, r * 0.28, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#e9dcc0";
    g.beginPath();
    g.ellipse(r * 1.78, 0, r * 0.14, r * 0.15, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#5a3a20";
    g.beginPath();
    g.ellipse(r * 1.35, -r * 0.3, r * 0.14, r * 0.07, -0.5, 0, Math.PI * 2);
    g.ellipse(r * 1.35, r * 0.3, r * 0.14, r * 0.07, 0.5, 0, Math.PI * 2);
    g.fill();
    // bois
    g.strokeStyle = "#e0cfa8";
    g.lineWidth = 2.2;
    g.lineCap = "round";
    for (const side of [-1, 1]) {
      g.beginPath();
      g.moveTo(r * 1.3, side * r * 0.16);
      g.lineTo(r * 1.1, side * r * 0.62);
      g.moveTo(r * 1.22, side * r * 0.4);
      g.lineTo(r * 1.5, side * r * 0.62);
      g.stroke();
    }
    g.restore();
  }

  private drawBoar(g: CanvasRenderingContext2D, px: number, py: number, swing: number) {
    const r = 0.22 * C;
    this.shadow(g, px, py, r * 1.3, r * 0.9);
    g.save();
    g.translate(px, py);
    g.rotate(this.facing);
    g.fillStyle = "#3a2a22";
    for (const [fx, side] of [[0.6, -1], [0.6, 1], [-0.6, -1], [-0.6, 1]]) {
      const off = (fx > 0 ? 1 : -1) * swing * side * r * 0.3;
      g.beginPath();
      g.ellipse(fx * r + off, side * r * 0.62, r * 0.17, r * 0.12, 0, 0, Math.PI * 2);
      g.fill();
    }
    // corps trapu, dos hérissé
    g.fillStyle = "#5a4636";
    g.beginPath();
    g.ellipse(0, 0, r * 1.1, r * 0.78, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#2e211a";
    g.lineWidth = 2;
    g.beginPath();
    for (let k = -3; k <= 3; k++) {
      g.moveTo(k * r * 0.28 - r * 0.1, -r * 0.18);
      g.lineTo(k * r * 0.28 - r * 0.2, r * 0.18);
    }
    g.stroke();
    // petite queue
    g.strokeStyle = "#3a2a22";
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(-r * 1.1, 0);
    g.lineTo(-r * 1.4, r * 0.15);
    g.stroke();
    // tête, groin et défenses
    g.fillStyle = "#4a382c";
    g.beginPath();
    g.ellipse(r * 1.15, 0, r * 0.55, r * 0.46, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#c79a8a";
    g.beginPath();
    g.ellipse(r * 1.6, 0, r * 0.22, r * 0.2, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#f2ead8";
    for (const side of [-1, 1]) {
      g.beginPath();
      g.ellipse(r * 1.5, side * r * 0.28, r * 0.16, r * 0.06, side * 0.5, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#2a1c14";
    g.beginPath();
    g.arc(r * 1.28, -r * 0.2, r * 0.06, 0, Math.PI * 2);
    g.arc(r * 1.28, r * 0.2, r * 0.06, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}
