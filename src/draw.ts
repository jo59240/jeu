// Dessin vectoriel vu de dessus : aplats de couleur, ombres douces, champs rayés, camps, dépôts et chemins.
import { CROP_BY_ID, stageOf } from "./crops";
import { Cell, Port, SHIP_ARRIVE, SHIP_CYCLE, SHIP_DEPART, SHIP_DOCKED, SHIP_GONE, growth } from "./state";
import { STRUCTURES } from "./structures";

import { getRoadStyle, isViking, themeContext } from "./theme";
import { drawLongship } from "./viking";
import * as P from "./painted";

// Une variante de dessin stable pour chaque emplacement (les bâtiments du même type ne sont pas tous identiques).
const variant = (gx: number, gy: number) => Math.abs(gx * 7 + gy * 3) % 4;

export const C = 64; // pixels du monde par case

// ---------- cases et cultures ----------

// L'herbe est dessinée par la carte : une case ne se dessine ici que si elle est labourée ou cultivée.
export function drawTile(g: CanvasRenderingContext2D, gx: number, gy: number, cell: Cell, now: number, hot: boolean, erase: boolean, buildable = true) {
  const x = gx * C;
  const y = gy * C;
  const pad = 1.5;
  if (cell.kind !== 'grass') {
    g.fillStyle = '#9a6a40';
    g.fillRect(x + pad, y + pad, C - 2 * pad, C - 2 * pad);
    g.fillStyle = '#845630';
    for (let i = 0; i < 5; i++) g.fillRect(x + 6, y + 8 + i * 11, C - 12, 3.5);
    if (cell.kind === 'crop') drawCrop(g, x, y, cell.crop, stageOf(growth(cell, now)), growth(cell, now));
  }
  if (hot) {
    const bad = !buildable;
    g.fillStyle = erase || bad ? 'rgba(230,80,80,0.35)' : 'rgba(255,255,255,0.3)';
    g.fillRect(x + pad, y + pad, C - 2 * pad, C - 2 * pad);
    g.strokeStyle = erase || bad ? '#d94444' : 'rgba(255,255,255,0.95)';
    g.lineWidth = 2;
    g.strokeRect(x + 3, y + 3, C - 6, C - 6);
  }
}

// Cinq rangs par case ; le stade change la couleur et la densité des rangs.
function drawCrop(g: CanvasRenderingContext2D, x: number, y: number, crop: string, stage: number, progress: number) {
  const id = CROP_BY_ID[crop]?.id ?? "carrot";
  const rowColor = {
    carrot: ["#8fc069", "#5f9f43", "#3f8a35"],
    potato: ["#9cc873", "#74b04f", "#5aa044"],
    wheat: ["#b9cf6d", "#d3c25b", "#e6bf45"],
    tomato: ["#86bd62", "#4f9a3d", "#2f7d34"],
  }[id as "carrot"];
  const dotColor = { carrot: "#f08a24", potato: "#f6f2d4", wheat: "#f0d26a", tomato: "#d93b2b" }[id as "carrot"];
  for (let i = 0; i < 5; i++) {
    const ry = y + 9 + i * 11;
    g.fillStyle = rowColor[stage];
    if (stage === 0) {
      for (let k = 0; k < 6; k++) {
        g.beginPath();
        g.arc(x + 10 + k * 9, ry + 2, 2.4 + progress * 2, 0, Math.PI * 2);
        g.fill();
      }
    } else {
      g.beginPath();
      g.roundRect(x + 7, ry - 1, C - 14, stage === 1 ? 5.5 : 7.5, 3);
      g.fill();
      if (stage === 2) {
        g.fillStyle = dotColor;
        for (let k = 0; k < 5; k++) {
          g.beginPath();
          g.arc(x + 12 + k * 10, ry + 2.5, 2.3, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  }
}

// Dessine un bâtiment carré de `size` cases tourné de rot quarts de tour autour de son centre.
function rotated(g: CanvasRenderingContext2D, gx: number, gy: number, size: number, rot: number, draw: () => void) {
  if (!rot) return draw();
  const cx = (gx + size / 2) * C;
  const cy = (gy + size / 2) * C;
  g.save();
  g.translate(cx, cy);
  g.rotate(((rot % 4) * Math.PI) / 2);
  g.translate(-cx, -cy);
  draw();
  g.restore();
}

export function drawCamp(g: CanvasRenderingContext2D, gx: number, gy: number, rot = 0) {
  rotated(g, gx, gy, 2, rot, () => campBody(g, gx, gy));
}

export function drawDepot(g: CanvasRenderingContext2D, gx: number, gy: number, rot = 0, level = 1, pantry = false) {
  rotated(g, gx, gy, 3, rot, () => {
    depotBody(g, gx, gy, level, pantry);
    if (pantry && !isViking()) {
      g.fillStyle = "rgba(70,150,80,0.38)";
      g.fillRect(gx * C + 8, gy * C + 8, 3 * C - 16, 2 * C - 20);
      g.font = "34px sans-serif";
      g.textAlign = "center";
      g.fillText("🥫", gx * C + 1.5 * C, gy * C + 1.1 * C);
    }
  });
}

// smoke : quelqu'un est à l'intérieur, une fumée sort de la cheminée (elle monte toujours vers le haut, quelle que soit l'orientation).
export function drawHouse(g: CanvasRenderingContext2D, gx: number, gy: number, smoke: boolean, t: number, rot = 0) {
  rotated(g, gx, gy, 2, rot, () => houseBody(g, gx, gy));
  if (!smoke) return;
  let vx = 2 * C * 0.7 - C;
  let vy = 2 * C * 0.18 - C;
  for (let i = 0; i < rot % 4; i++) [vx, vy] = [-vy, vx];
  const cx = (gx + 1) * C + vx;
  const cy = (gy + 1) * C + vy;
  for (let i = 0; i < 5; i++) {
    const p = (t / 2600 + i / 5) % 1;
    g.fillStyle = `rgba(235,235,235,${0.65 * (1 - p)})`;
    g.beginPath();
    g.arc(cx + p * 22 + Math.sin(p * 7 + i) * 4, cy - 6 - p * 56, 5 + p * 10, 0, Math.PI * 2);
    g.fill();
  }
}

// Scierie (3 × 3 cases), vue de dessus : hangar à toit de planches, tas de bûches, scie circulaire sur son établi et pile de planches.
// working : la lame tourne et de la sciure vole.
export function drawSawmill(g: CanvasRenderingContext2D, gx: number, gy: number, working: boolean, t: number, rot = 0) {
  rotated(g, gx, gy, 3, rot, () => sawmillBody(g, gx, gy));
  // la lame, elle, est dessinée à part : elle tourne sur place, quelle que soit l'orientation
  const w = 3 * C;
  let vx = w * 0.32 - w / 2;
  let vy = w * 0.74 - w / 2;
  for (let i = 0; i < rot % 4; i++) [vx, vy] = [-vy, vx];
  const cx = gx * C + w / 2 + vx;
  const cy = gy * C + w / 2 + vy;
  const a = working ? t / 60 : 0.4;
  g.save();
  g.translate(cx, cy);
  g.rotate(a);
  g.fillStyle = "#cfd3d8";
  g.beginPath();
  for (let k = 0; k < 16; k++) {
    const ang = (k / 16) * Math.PI * 2;
    g.lineTo(Math.cos(ang) * 22, Math.sin(ang) * 22);
    g.lineTo(Math.cos(ang + 0.2) * 17, Math.sin(ang + 0.2) * 17);
  }
  g.closePath();
  g.fill();
  g.strokeStyle = "#8b9099";
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = "#6f7480";
  g.beginPath();
  g.arc(0, 0, 5, 0, Math.PI * 2);
  g.fill();
  g.restore();
  if (working) {
    // sciure
    for (let i = 0; i < 6; i++) {
      const p = (t / 700 + i / 6) % 1;
      g.fillStyle = `rgba(226,196,140,${0.8 * (1 - p)})`;
      g.beginPath();
      g.arc(cx + 18 + p * 26 + Math.sin(i * 5) * 4, cy - 6 + Math.sin(p * 6 + i) * 8, 2.4 * (1 - p) + 0.8, 0, Math.PI * 2);
      g.fill();
    }
  }
}

function sawmillBody(g: CanvasRenderingContext2D, gx: number, gy: number) {
  if (isViking()) {
    const v = variant(gx, gy);
    return P.blit(g, `sawmill:${v}`, gx, gy, 3, (c) => P.paintSawmill(c, v * 139 + 13));
  }
  const x = gx * C;
  const y = gy * C;
  const w = 3 * C;
  // seuil de l'entrée : tapis de terre sous la porte (la case d'entrée est juste en dessous, au milieu)
  g.fillStyle = "#c9a96e";
  g.beginPath();
  g.roundRect(x + C + 8, y + w - 6, C - 16, 24, 8);
  g.fill();
  // cour piétinée
  g.fillStyle = "#b79a63";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 24);
  g.fill();
  g.strokeStyle = "#9c8049";
  g.lineWidth = 2;
  g.stroke();
  // hangar : toit de planches (en haut à gauche)
  g.fillStyle = "rgba(40,30,10,0.28)";
  g.fillRect(x + 20, y + 20, w * 0.62, w * 0.44);
  g.fillStyle = "#8a6a46";
  g.fillRect(x + 14, y + 14, w * 0.62, w * 0.44);
  g.strokeStyle = "#6e5234";
  g.lineWidth = 2;
  g.beginPath();
  for (let k = 1; k < 9; k++) {
    g.moveTo(x + 14 + (k * w * 0.62) / 9, y + 14);
    g.lineTo(x + 14 + (k * w * 0.62) / 9, y + 14 + w * 0.44);
  }
  g.stroke();
  g.strokeStyle = "#5a4129";
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(x + 14, y + 14 + w * 0.22);
  g.lineTo(x + 14 + w * 0.62, y + 14 + w * 0.22);
  g.stroke();
  g.strokeStyle = "#5a4129";
  g.lineWidth = 3;
  g.strokeRect(x + 14, y + 14, w * 0.62, w * 0.44);
  // tas de bûches (en haut à droite) : quatre troncs couchés
  for (let i = 0; i < 4; i++) {
    const ly = y + 22 + i * 22;
    g.fillStyle = "rgba(30,20,10,0.3)";
    g.fillRect(x + w - 74, ly + 4, 58, 18);
    g.fillStyle = i % 2 ? "#8a5a2e" : "#9a6a3a";
    g.beginPath();
    g.roundRect(x + w - 78, ly, 58, 18, 9);
    g.fill();
    g.fillStyle = "#d9b27a";
    g.beginPath();
    g.arc(x + w - 26, ly + 9, 6, 0, Math.PI * 2);
    g.fill();
  }
  // établi de la scie (en bas à gauche) : la lame est dessinée par drawSawmill
  g.fillStyle = "rgba(40,30,10,0.3)";
  g.fillRect(x + 20, y + w * 0.62 + 6, 92, 54);
  g.fillStyle = "#a8825a";
  g.fillRect(x + 14, y + w * 0.62, 92, 54);
  g.strokeStyle = "#7a5a34";
  g.lineWidth = 3;
  g.strokeRect(x + 14, y + w * 0.62, 92, 54);
  // pile de planches (en bas à droite)
  for (let i = 0; i < 5; i++) {
    g.fillStyle = "rgba(40,30,10,0.25)";
    g.fillRect(x + w - 92, y + w * 0.64 + i * 9 + 3, 70, 8);
    g.fillStyle = i % 2 ? "#e0c08a" : "#d2ae72";
    g.fillRect(x + w - 96, y + w * 0.64 + i * 9, 70, 8);
    g.strokeStyle = "#9c7a44";
    g.lineWidth = 1;
    g.strokeRect(x + w - 96, y + w * 0.64 + i * 9, 70, 8);
  }
}

// Rucher (2 × 2 cases) : quatre ruches en paille sur leur socle, dans un enclos de piquets, entourées de fleurs.
// active : les abeilles butinent autour des ruches.
export function drawApiary(g: CanvasRenderingContext2D, gx: number, gy: number, active: boolean, t: number, rot = 0) {
  rotated(g, gx, gy, 2, rot, () => apiaryBody(g, gx, gy));
  if (!active) return;
  // les abeilles : de petits points qui tournent autour des ruches (elles restent à l'endroit quelle que soit la rotation)
  const cx = (gx + 1) * C;
  const cy = (gy + 1) * C;
  for (let i = 0; i < 9; i++) {
    const a = t / (380 + i * 40) + i * 1.9;
    const r = 18 + (i % 3) * 14 + Math.sin(t / 300 + i) * 4;
    const bx = cx + Math.cos(a) * (r + 12);
    const by = cy + Math.sin(a * 1.3) * (r * 0.8 + 10);
    g.fillStyle = "rgba(255,255,255,0.7)";
    g.beginPath();
    g.ellipse(bx - 2, by - 3, 3, 1.8, 0.6, 0, Math.PI * 2);
    g.ellipse(bx + 2, by - 3, 3, 1.8, -0.6, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#f2c230";
    g.beginPath();
    g.ellipse(bx, by, 3.4, 2.4, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#3a2a14";
    g.fillRect(bx - 0.6, by - 2.3, 1.4, 4.6);
  }
}

function apiaryBody(g: CanvasRenderingContext2D, gx: number, gy: number) {
  if (isViking()) {
    const v = variant(gx, gy);
    return P.blit(g, `apiary:${v}`, gx, gy, 2, (c) => P.paintApiary(c, v * 163 + 29));
  }
  const x = gx * C;
  const y = gy * C;
  const w = 2 * C;
  // seuil de l'entrée (la case d'entrée est juste en dessous, côté gauche)
  g.fillStyle = "#c9a96e";
  g.beginPath();
  g.roundRect(x + 10, y + w - 6, 44, 24, 8);
  g.fill();
  // pré fleuri
  g.fillStyle = "#9fcd62";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 22);
  g.fill();
  g.strokeStyle = "#7a5a34";
  g.lineWidth = 3;
  g.setLineDash([2, 10]);
  g.lineCap = "round";
  g.stroke(); // l'enclos : une ligne de piquets
  g.setLineDash([]);
  for (const [fx, fy, c] of [[14, 20, "#f6e66a"], [34, 108, "#ffffff"], [102, 18, "#f7a8c4"], [112, 104, "#f6e66a"], [18, 64, "#f7a8c4"], [108, 62, "#ffffff"]] as [number, number, string][]) {
    g.fillStyle = c;
    g.beginPath();
    g.arc(x + fx, y + fy, 4, 0, Math.PI * 2);
    g.fill();
  }
  // quatre ruches : socle de bois, dôme de paille, trou de vol
  for (const [hx, hy] of [[0.27, 0.27], [0.73, 0.27], [0.27, 0.7], [0.73, 0.7]]) {
    const cx = x + hx * w;
    const cy = y + hy * w;
    g.fillStyle = "rgba(40,30,10,0.28)";
    g.beginPath();
    g.ellipse(cx + 4, cy + 6, 24, 20, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#a47c48";
    g.fillRect(cx - 21, cy - 21, 42, 42);
    g.strokeStyle = "#7a5a34";
    g.lineWidth = 2;
    g.strokeRect(cx - 21, cy - 21, 42, 42);
    for (let k = 0; k < 4; k++) {
      g.fillStyle = k % 2 ? "#e6b84a" : "#d9a63a";
      g.beginPath();
      g.arc(cx, cy, 19 - k * 4.5, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "#9c7424";
    g.lineWidth = 1.5;
    g.beginPath();
    g.arc(cx, cy, 19, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "#3a2a14";
    g.beginPath();
    g.ellipse(cx, cy + 18, 5, 2.4, 0, 0, Math.PI * 2);
    g.fill();
  }
}

// Une parcelle de culture : terre labourée, ou plants à leur stade de croissance (p de 0 à 1 ; moins de 0 : vide), avec sa barre d'avancement
// et une goutte quand elle a soif (wet : humidité de 0 à 1).
function drawPlot(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, crop: string, p: number, wet: number, t: number, target = "wheat") {
  const planted = p >= 0;
  const dry = planted && p < 1 && wet < 0.3;
  g.fillStyle = !planted ? "#8a5c34" : dry ? "#b08f5e" : wet > 0 ? "#6e4527" : "#9a6f42"; // la terre mouillée est plus sombre
  g.beginPath();
  g.roundRect(x, y, w, h, 7);
  g.fill();
  g.strokeStyle = "#5e3c20";
  g.lineWidth = 1.5;
  g.stroke();
  // sillons
  g.strokeStyle = dry ? "rgba(90,60,30,0.35)" : "rgba(40,22,8,0.42)";
  g.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    g.beginPath();
    g.moveTo(x + 4, y + (i * (h - 10)) / 4 + 2);
    g.lineTo(x + w - 4, y + (i * (h - 10)) / 4 + 2);
    g.stroke();
  }
  if (!planted && !target) {
    // vide et rien de prévu : un « + » pour dire qu'il faut choisir quoi y mettre
    g.strokeStyle = "rgba(255,240,200,0.7)";
    g.lineWidth = 3;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(x + w / 2 - 8, y + h / 2);
    g.lineTo(x + w / 2 + 8, y + h / 2);
    g.moveTo(x + w / 2, y + h / 2 - 8);
    g.lineTo(x + w / 2, y + h / 2 + 8);
    g.stroke();
    return;
  }
  if (!planted) {
    // vide : trois graines de la culture prévue pour cette parcelle
    g.fillStyle = { wheat: "#e8c24e", corn: "#f2d03a", tomato: "#d93b2b", carrot: "#f08a24", grass: "#5fbf4a" }[target as "wheat"] ?? "#e8c24e";
    g.globalAlpha = 0.75;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.ellipse(x + w / 2 - 12 + i * 12, y + h / 2, 3.2, 4.4, 0.5, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    return;
  }
  const k = Math.min(1, p); // avancement
  const ripe = p >= 1;
  const cols = 6;
  const top = y + 8;
  const area = h - 20; // le bas de la parcelle est réservé à la barre d'avancement
  for (let row = 0; row < 3; row++) {
    for (let c = 0; c < cols; c++) {
      const px = x + 8 + (c * (w - 16)) / (cols - 1);
      const py = top + 4 + row * (area / 3);
      const sway = ripe ? Math.sin(t / 500 + c + row) * 1.2 : 0;
      const droop = dry ? 2 : 0; // une plante assoiffée s'affaisse
      if (crop === "wheat") {
        g.strokeStyle = ripe ? "#e2b94a" : dry ? "#b3a95a" : k > 0.5 ? "#a8c050" : "#6fb04a";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(px, py + 5);
        g.lineTo(px + sway + droop, py + 5 - 3 - k * 9 + droop);
        g.stroke();
        if (k > 0.5) {
          g.fillStyle = ripe ? "#f0cd5a" : "#b9c660";
          g.beginPath();
          g.ellipse(px + sway + droop, py - 3 - k * 6 + droop, 1.8, 3.4, 0, 0, Math.PI * 2);
          g.fill();
        }
      } else if (crop === "corn") {
        g.strokeStyle = dry ? "#7f9a4e" : "#4e9a3e";
        g.lineWidth = 2.4;
        g.beginPath();
        g.moveTo(px, py + 5);
        g.lineTo(px + sway + droop, py + 4 - k * 11 + droop);
        g.stroke();
        if (k > 0.55) {
          g.fillStyle = ripe ? "#f2d03a" : "#b8cc5a";
          g.beginPath();
          g.ellipse(px + 3 + sway, py + 1 - k * 5 + droop, 2, 4, 0.3, 0, Math.PI * 2);
          g.fill();
        }
      } else if (crop === "grass") {
        // de l'herbe drue : trois brins qui se couchent au vent
        g.strokeStyle = dry ? "#9aa856" : ripe ? "#4fae3a" : "#6cc24f";
        g.lineWidth = 2;
        for (let b = -1; b <= 1; b++) {
          g.beginPath();
          g.moveTo(px + b * 2, py + 5);
          g.lineTo(px + b * 3 + sway + droop, py + 5 - 2 - k * 10 + droop);
          g.stroke();
        }
      } else if (crop === "tomato") {
        g.fillStyle = dry ? "#7f9a4e" : k > 0.3 ? "#3f8a35" : "#74b84f";
        g.beginPath();
        g.arc(px, py + 1 + droop / 2, 2.5 + k * 3, 0, Math.PI * 2);
        g.fill();
        if (k > 0.6) {
          g.fillStyle = ripe ? "#d93b2b" : "#9cc052";
          g.beginPath();
          g.arc(px + 2, py + 3, 1.8 + k, 0, Math.PI * 2);
          g.fill();
        }
      } else {
        g.fillStyle = dry ? "#7f9a4e" : k > 0.3 ? "#4f9a3d" : "#7cbc5a";
        g.beginPath();
        g.ellipse(px, py + 1 + droop / 2, 2 + k * 2, 3 + k * 4 - droop, 0, 0, Math.PI * 2);
        g.fill();
        if (ripe) {
          g.fillStyle = "#f08a24";
          g.beginPath();
          g.arc(px, py + 5, 2.2, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  }
  // barre d'avancement de la pousse (pleine et dorée quand c'est mûr)
  g.fillStyle = "rgba(30,20,10,0.6)";
  g.beginPath();
  g.roundRect(x + 5, y + h - 10, w - 10, 6, 3);
  g.fill();
  g.fillStyle = ripe ? "#f2c230" : dry ? "#c9a24a" : "#8fd05a";
  g.beginPath();
  g.roundRect(x + 5, y + h - 10, Math.max(4, (w - 10) * k), 6, 3);
  g.fill();
  // une goutte quand la parcelle a soif
  if (dry) {
    const a = 0.75 + 0.25 * Math.sin(t / 160);
    const cx = x + w - 11;
    const cy = y + 12;
    g.fillStyle = `rgba(47,150,240,${a})`;
    g.beginPath();
    g.moveTo(cx, cy - 8);
    g.bezierCurveTo(cx + 2, cy - 4, cx + 6, cy - 1, cx + 6, cy + 2);
    g.arc(cx, cy + 2, 6, 0, Math.PI, false);
    g.bezierCurveTo(cx - 6, cy - 1, cx - 2, cy - 4, cx, cy - 8);
    g.fill();
    g.strokeStyle = `rgba(16,84,160,${a})`;
    g.lineWidth = 1.5;
    g.stroke();
  }
}

// Ferme (5 × 5 cases) : douze parcelles (4 × 3), une grange rouge, une cuve d'eau (dont le niveau se voit) et une barrière.
// plots : l'état des parcelles (à défaut, une ferme neuve) ; water : le niveau de la cuve (0 à 1).
export function drawFarm(g: CanvasRenderingContext2D, gx: number, gy: number, rot = 0, plots?: { c: string; t?: string | null; p: number; wet: number }[], t = 0, water = 0.5) {
  rotated(g, gx, gy, 5, rot, () => farmBody(g, gx, gy, plots, t, water));
}

function farmBody(g: CanvasRenderingContext2D, gx: number, gy: number, plots: { c: string; t?: string | null; p: number; wet: number }[] | undefined, t: number, water: number) {
  const x = gx * C;
  const y = gy * C;
  const w = 5 * C;
  const painted = isViking();
  const fv = variant(gx, gy);
  if (painted) P.blit(g, `farm:${fv}`, gx, gy, 5, (c) => P.paintFarm(c, fv * 211 + 67));
  if (!painted) {
  // seuil de l'entrée (la case d'entrée est juste en dessous, au milieu)
  g.fillStyle = "#c9a96e";
  g.beginPath();
  g.roundRect(x + 2 * C + 8, y + w - 6, C - 16, 24, 8);
  g.fill();
  // enclos d'herbe tendre et clôture
  g.fillStyle = "#a6cf70";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 18);
  g.fill();
  g.strokeStyle = "#8a6a3c";
  g.lineWidth = 4;
  g.stroke();
  // piquets de la clôture
  g.fillStyle = "#6d4527";
  for (let i = 0; i <= 10; i++) {
    const pxp = x + 10 + (i * (w - 20)) / 10;
    g.beginPath();
    g.arc(pxp, y + 6, 2.6, 0, Math.PI * 2);
    g.arc(pxp, y + w - 6, 2.6, 0, Math.PI * 2);
    g.fill();
  }
  // allée de terre vers la porte
  g.fillStyle = "#cdb78a";
  g.fillRect(x + w / 2 - 22, y + 232, 44, w - 232);
  }
  // douze parcelles : quatre colonnes, trois rangées
  for (let i = 0; i < 12; i++) {
    const pl = plots?.[i];
    const col = i % 4;
    const row = Math.floor(i / 4);
    drawPlot(g, x + 14 + col * 74, y + 14 + row * 72, 68, 66, pl?.c ?? "wheat", pl ? pl.p : i % 3 === 0 ? -1 : 0.45, pl ? pl.wet : 1, t, plots ? pl?.t ?? "" : "wheat");
  }
  // grange rouge en bas à gauche
  if (!painted) {
  const bx = x + 16;
  const by = y + 238;
  g.fillStyle = "rgba(40,30,10,0.26)";
  g.fillRect(bx + 6, by + 7, 92, 62);
  g.fillStyle = "#b8483a";
  g.fillRect(bx, by, 92, 62);
  g.fillStyle = "#963a2f";
  g.fillRect(bx + 46, by, 46, 62);
  g.strokeStyle = "#5e2a22";
  g.lineWidth = 3;
  g.strokeRect(bx, by, 92, 62);
  g.fillStyle = "#f2e6d0";
  g.fillRect(bx + 28, by + 28, 36, 34);
  g.strokeStyle = "#5e2a22";
  g.beginPath();
  g.moveTo(bx + 28, by + 28);
  g.lineTo(bx + 64, by + 62);
  g.moveTo(bx + 64, by + 28);
  g.lineTo(bx + 28, by + 62);
  g.stroke();
  }
  // cuve d'eau en bas à droite : le niveau se voit
  const cx = x + w - 54;
  const cy = y + 270;
  g.fillStyle = "rgba(40,30,10,0.28)";
  g.beginPath();
  g.arc(cx + 5, cy + 6, 34, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#8a5a2e";
  g.beginPath();
  g.arc(cx, cy, 34, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#1f5f9a";
  g.beginPath();
  g.arc(cx, cy, 27, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#4fa6ea";
  g.beginPath();
  g.arc(cx, cy, 4 + 23 * Math.max(0, Math.min(1, water)), 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#5e3c1a";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(cx, cy, 34, 0, Math.PI * 2);
  g.stroke();
  // botte de paille
  g.fillStyle = "#e3c25a";
  g.beginPath();
  g.ellipse(x + 168, y + 276, 22, 15, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#a8872e";
  g.lineWidth = 2;
  g.stroke();
}

// Une vache vue de dessus, tournée vers `dir` (1 : elle regarde à droite, -1 : à gauche), la tête baissée si elle broute.
function drawCow(g: CanvasRenderingContext2D, x: number, y: number, dir: number, variant: number, graze: boolean, sad: boolean) {
  g.save();
  g.translate(x, y);
  g.scale(dir, 1);
  g.fillStyle = "rgba(30,20,10,0.25)";
  g.beginPath();
  g.ellipse(2, 8, 20, 9, 0, 0, Math.PI * 2);
  g.fill();
  // corps
  g.fillStyle = variant % 2 ? "#f4efe6" : "#efe2cf";
  g.beginPath();
  g.ellipse(0, 0, 19, 11, 0, 0, Math.PI * 2);
  g.fill();
  if (isViking()) P.furShade(g, 0, 0, 19, 11, variant * 17 + 3, true, 1);
  g.strokeStyle = "#8a7d6a";
  g.lineWidth = 1.5;
  g.stroke();
  // taches
  g.fillStyle = variant % 3 === 0 ? "#2f2a26" : "#8a5a36";
  g.beginPath();
  g.ellipse(-6, -2, 6, 5, 0.4, 0, Math.PI * 2);
  g.ellipse(5, 4, 5, 4, -0.3, 0, Math.PI * 2);
  g.fill();
  // queue
  g.strokeStyle = "#8a7d6a";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-18, 0);
  g.lineTo(-24, graze ? 4 : -3);
  g.stroke();
  // tête
  const hy = graze ? 5 : 0;
  g.fillStyle = "#f6efe4";
  g.beginPath();
  g.ellipse(21, hy, 9, 7, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.fillStyle = "#e9a9a0"; // museau
  g.beginPath();
  g.ellipse(27, hy, 4, 4, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#2f2a26"; // œil et cornes
  g.beginPath();
  g.arc(21, hy - 3, 1.4, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#d9cfae";
  g.fillRect(17, hy - 8, 3, 3);
  g.fillRect(17, hy + 5, 3, 3);
  if (sad) {
    g.fillStyle = "#d33";
    g.fillRect(-3, -3, 3, 3);
  }
  g.restore();
}

// La taverne (3 × 3 cases) : une maison de bois au toit de tuiles, une cheminée qui fume quand on cuisine, une enseigne en forme de chope et des bancs devant.
export function drawTavern(g: CanvasRenderingContext2D, gx: number, gy: number, rot = 0, cooking = false, t = 0) {
  rotated(g, gx, gy, 3, rot, () => {
    const x = gx * C;
    const y = gy * C;
    const w = 3 * C;
    if (isViking()) {
      const v = variant(gx, gy);
      P.blit(g, `tavern:${v}`, gx, gy, 3, (c) => P.paintTavern(c, v * 191 + 47));
      if (cooking) { // la fumée de la cheminée monte au-dessus de la cheminée
        for (let i = 0; i < 3; i++) {
          const k = (t / 900 + i / 3) % 1;
          g.fillStyle = `rgba(235,235,235,${0.55 * (1 - k)})`;
          g.beginPath();
          g.arc(x + 152 + Math.sin(k * 6 + i) * 6, y + 20 - k * 30, 5 + k * 7, 0, Math.PI * 2);
          g.fill();
        }
      }
      return;
    }
    g.fillStyle = "#c9b27a"; // sol de terre battue
    g.beginPath();
    g.roundRect(x + 3, y + 3, w - 6, w - 6, 14);
    g.fill();
    g.fillStyle = "#c9a96e"; // seuil de l'entrée
    g.beginPath();
    g.roundRect(x + C + 8, y + w - 6, C - 16, 24, 8);
    g.fill();
    g.fillStyle = "rgba(40,30,10,0.28)"; // ombre du toit
    g.fillRect(x + 14, y + 14, w - 22, 120);
    g.fillStyle = "#a8523a"; // toit de tuiles (deux pans)
    g.fillRect(x + 8, y + 8, (w - 16) / 2, 120);
    g.fillStyle = "#8f3f2c";
    g.fillRect(x + 8 + (w - 16) / 2, y + 8, (w - 16) / 2, 120);
    g.strokeStyle = "rgba(60,20,10,0.35)";
    g.lineWidth = 1.2;
    for (let i = 1; i < 10; i++) {
      g.beginPath();
      g.moveTo(x + 8, y + 8 + i * 12);
      g.lineTo(x + w - 8, y + 8 + i * 12);
      g.stroke();
    }
    g.strokeStyle = "#4e2a1a";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(x + w / 2, y + 8);
    g.lineTo(x + w / 2, y + 128);
    g.stroke();
    g.lineWidth = 3;
    g.strokeRect(x + 8, y + 8, w - 16, 120);
    g.fillStyle = "#2d1d14"; // porte
    g.fillRect(x + w / 2 - 20, y + 122, 40, 12);
    // cheminée
    g.fillStyle = "#7d7a74";
    g.fillRect(x + w - 54, y + 22, 24, 24);
    g.strokeStyle = "#4a4743";
    g.lineWidth = 2;
    g.strokeRect(x + w - 54, y + 22, 24, 24);
    if (cooking) {
      for (let i = 0; i < 3; i++) {
        const k = ((t / 900 + i / 3) % 1);
        g.fillStyle = `rgba(230,230,230,${0.55 * (1 - k)})`;
        g.beginPath();
        g.arc(x + w - 42 + Math.sin(k * 6 + i) * 6, y + 18 - k * 26, 5 + k * 6, 0, Math.PI * 2);
        g.fill();
      }
    }
    // enseigne : une chope
    g.fillStyle = "#6a4a2a";
    g.fillRect(x + 22, y + 138, 4, 22);
    g.fillStyle = "#e0b04a";
    g.beginPath();
    g.roundRect(x + 28, y + 140, 22, 22, 4);
    g.fill();
    g.fillStyle = "#f6f1e0";
    g.fillRect(x + 28, y + 140, 22, 7);
    g.strokeStyle = "#4e3320";
    g.lineWidth = 2;
    g.strokeRect(x + 28, y + 140, 22, 22);
    g.beginPath();
    g.arc(x + 52, y + 151, 6, -Math.PI / 2, Math.PI / 2);
    g.stroke();
    // bancs et tonneau
    g.fillStyle = "#7a5230";
    g.fillRect(x + 100, y + 150, 50, 12);
    g.fillRect(x + 100, y + 172, 50, 12);
    g.fillStyle = "#5e3c20";
    g.beginPath();
    g.arc(x + w - 30, y + 162, 14, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#2d1d14";
    g.lineWidth = 2;
    g.stroke();
  });
}

// Le chantier naval (6 × 6 cases, au bord de la mer) : un berceau de bois et le grand drakkar qui prend forme selon l'étape (0 : berceau seul, 4 : drakkar terminé),
// l'étrave tournée vers la mer (le côté « nord » du dessin, comme le quai du port).
export function drawShipyard(g: CanvasRenderingContext2D, gx: number, gy: number, rot = 0, stage = 0, t = 0) {
  rotated(g, gx, gy, 6, rot, () => {
    const x = gx * C;
    const y = gy * C;
    const w = 6 * C;
    const painted = isViking();
    if (painted) P.blit(g, `shipyard:${variant(gx, gy)}`, gx, gy, 6, (c) => P.paintShipyard(c, variant(gx, gy) * 193 + 53));
    if (!painted) {
    g.fillStyle = "#cdb98a"; // terre battue
      g.beginPath();
      g.roundRect(x + 3, y + 3, w - 6, w - 6, 16);
      g.fill();
      g.strokeStyle = "#8a7340";
      g.lineWidth = 3;
      g.stroke();
      g.fillStyle = "#c9a96e"; // seuil de l'entrée
      g.beginPath();
      g.roundRect(x + 2 * C + 8, y + w - 6, C - 16, 24, 8);
      g.fill();
      g.fillStyle = "#d8c89a"; // allée vers l'entrée
      g.fillRect(x + 2 * C + 6, y + 4.6 * C, C - 12, 1.4 * C);
    }
    // la cale : deux rails de bois qui plongent vers la mer (en haut), sur une case de plus
    const cx = x + w / 2;
    g.fillStyle = "rgba(20,40,60,0.25)";
    g.fillRect(cx - 52, y - C * 0.9 + 5, 104, C * 1.2);
    g.fillStyle = "#a47c48";
    g.fillRect(cx - 54, y - C * 0.9, 108, C * 1.2);
    g.strokeStyle = "#7a5a34";
    g.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.moveTo(cx - 54, y - C * 0.9 + i * 14);
      g.lineTo(cx + 54, y - C * 0.9 + i * 14);
      g.stroke();
    }
    g.save();
    g.translate(cx, y + 3 * C + 6);
    g.rotate(-Math.PI / 2); // l'étrave vers la mer
    g.scale(1.45, 1.45);
    g.fillStyle = "#6a4a2a"; // le berceau : deux poutres et des supports
    g.fillRect(-105, -46, 210, 7);
    g.fillRect(-105, 39, 210, 7);
    g.fillStyle = "#7a5a34";
    for (let i = 0; i < 7; i++) g.fillRect(-98 + i * 32, -50, 5, 100);
    const hull = () => {
      g.beginPath();
      g.moveTo(104, -6);
      g.quadraticCurveTo(60, 38, -10, 36);
      g.quadraticCurveTo(-70, 34, -102, 4);
      g.quadraticCurveTo(-70, -34, -10, -36);
      g.quadraticCurveTo(60, -38, 104, -6);
      g.closePath();
    };
    if (stage >= 2) {
      g.fillStyle = "#8a5a32";
      hull();
      g.fill();
      g.strokeStyle = "#2a1a10";
      g.lineWidth = 3;
      g.stroke();
      g.strokeStyle = "rgba(30,15,5,0.35)";
      g.lineWidth = 1.5;
      for (const k of [-0.5, -0.25, 0, 0.25, 0.5]) {
        g.beginPath();
        g.moveTo(-92, k * 60);
        g.lineTo(92, k * 60);
        g.stroke();
      }
    } else {
      g.strokeStyle = "#6a4426"; // la quille et les membrures
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(-100, 4);
      g.lineTo(102, -6);
      g.stroke();
      if (stage >= 1) {
        g.lineWidth = 3;
        for (let i = 0; i < 9; i++) {
          const px = -80 + i * 20;
          const hh = 30 - Math.abs(px) * 0.18;
          g.beginPath();
          g.moveTo(px, -hh);
          g.quadraticCurveTo(px + 4, 0, px, hh);
          g.stroke();
        }
      }
    }
    if (stage >= 3) {
      g.fillStyle = "#2a1a10"; // le mât
      g.beginPath();
      g.arc(0, 0, 5, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#3a2415";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(0, -38);
      g.lineTo(0, 38);
      g.stroke();
    }
    if (stage >= 4) {
      g.fillStyle = "#e6d9b8"; // la voile rayée
      g.beginPath();
      g.roundRect(-14, -36, 28, 72, 5);
      g.fill();
      g.fillStyle = "#a8322d";
      for (let i = 0; i < 4; i++) g.fillRect(-14 + i * 7, -36, 3.5, 72);
      g.strokeStyle = "#2a1a10";
      g.lineWidth = 2;
      g.beginPath();
      g.roundRect(-14, -36, 28, 72, 5);
      g.stroke();
      g.fillStyle = "#3a2415"; // la proue en tête de dragon
      g.beginPath();
      g.moveTo(98, -2);
      g.quadraticCurveTo(108, -22, 120, -20);
      g.lineTo(128, -14);
      g.lineTo(118, -10);
      g.quadraticCurveTo(110, -2, 106, 4);
      g.closePath();
      g.fill();
      for (let i = 0; i < 6; i++) {
        g.fillStyle = ["#a8322d", "#c9972f", "#2f5f8a", "#e6d9b8"][i % 4];
        for (const side of [-1, 1]) {
          g.beginPath();
          g.arc(-70 + i * 28, side * 28, 6, 0, Math.PI * 2);
          g.fill();
          g.strokeStyle = "#2a1a10";
          g.lineWidth = 1.5;
          g.stroke();
        }
      }
    }
    g.restore();
    if (stage >= 4) { // un fanion quand le drakkar est prêt à partir
      const wave = Math.sin(t / 240) * 3;
      g.strokeStyle = "#2a1a10";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x + w - 16, y + 8);
      g.lineTo(x + w - 16, y + 60);
      g.stroke();
      g.fillStyle = "#e8c24e";
      g.beginPath();
      g.moveTo(x + w - 16, y + 8);
      g.lineTo(x + w - 44, y + 15 + wave);
      g.lineTo(x + w - 16, y + 28);
      g.closePath();
      g.fill();
    }
  });
}

// Le marché (3 × 3 cases) : trois étals aux auvents rayés, des caisses, et un fanion quand la caravane est là.
export function drawMarket(g: CanvasRenderingContext2D, gx: number, gy: number, rot = 0, here = false, t = 0) {
  rotated(g, gx, gy, 3, rot, () => {
    const x = gx * C;
    const y = gy * C;
    const w = 3 * C;
    if (isViking()) {
      const v = variant(gx, gy);
      P.blit(g, `market:${v}`, gx, gy, 3, (c) => P.paintMarket(c, v * 181 + 43));
      if (here) { // fanion de la caravane
        const wave = Math.sin(t / 240) * 3;
        g.strokeStyle = "#2a1a10";
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x + w - 12, y + 6);
        g.lineTo(x + w - 12, y + 52);
        g.stroke();
        g.fillStyle = "#e8c24e";
        g.beginPath();
        g.moveTo(x + w - 12, y + 6);
        g.lineTo(x + w - 38, y + 12 + wave);
        g.lineTo(x + w - 12, y + 24);
        g.closePath();
        g.fill();
      }
      return;
    }
    g.fillStyle = "#c9b27a"; // place pavée
    g.beginPath();
    g.roundRect(x + 3, y + 3, w - 6, w - 6, 12);
    g.fill();
    g.strokeStyle = "#8a7340";
    g.lineWidth = 3;
    g.stroke();
    g.fillStyle = "#cdb78a"; // allée vers l'entrée
    g.fillRect(x + C + 6, y + 2 * C, C - 12, C);
    const awn = ["#c0453a", "#2f7fb0", "#d8a431"];
    for (let i = 0; i < 3; i++) {
      const sx = x + 10 + i * 61;
      const sy = y + 14;
      g.fillStyle = "rgba(40,30,10,0.25)";
      g.fillRect(sx + 4, sy + 6, 54, 62);
      g.fillStyle = "#7a5230"; // comptoir
      g.fillRect(sx, sy + 34, 54, 30);
      g.fillStyle = ["#e08a3a", "#8ab04a", "#d9c07a"][i]; // marchandises
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.arc(sx + 9 + k * 12, sy + 48, 5, 0, Math.PI * 2);
        g.fill();
      }
      for (let k = 0; k < 6; k++) { // auvent rayé
        g.fillStyle = k % 2 ? "#f1e6c8" : awn[i];
        g.fillRect(sx + k * 9, sy, 9, 32);
      }
      g.strokeStyle = "#4e3320";
      g.lineWidth = 2;
      g.strokeRect(sx, sy, 54, 64);
    }
    g.fillStyle = "#7a5230"; // caisses
    g.fillRect(x + 14, y + 2 * C + 20, 22, 20);
    g.fillRect(x + w - 40, y + 2 * C + 12, 24, 22);
    g.strokeStyle = "#4e3320";
    g.lineWidth = 2;
    g.strokeRect(x + 14, y + 2 * C + 20, 22, 20);
    g.strokeRect(x + w - 40, y + 2 * C + 12, 24, 22);
    if (here) { // fanion de la caravane
      const wave = Math.sin(t / 240) * 3;
      g.strokeStyle = "#2a1a10";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(x + w - 12, y + 6);
      g.lineTo(x + w - 12, y + 52);
      g.stroke();
      g.fillStyle = "#e8c24e";
      g.beginPath();
      g.moveTo(x + w - 12, y + 6);
      g.lineTo(x + w - 38, y + 12 + wave);
      g.lineTo(x + w - 12, y + 24);
      g.closePath();
      g.fill();
    }
  });
}

// La caravane : un chariot bâché tiré par un bœuf, vu de dessus, qui avance vers la droite. (cx, cy) est son centre en pixels du monde.
export function drawCaravan(g: CanvasRenderingContext2D, cx: number, cy: number, t: number, moving: boolean) {
  g.save();
  g.translate(cx, cy);
  const bob = moving ? Math.sin(t / 90) * 1.5 : 0;
  g.fillStyle = "rgba(30,20,10,0.25)";
  g.beginPath();
  g.ellipse(4, 22, 70, 14, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#3a2a1a"; // roues
  g.fillRect(-52, -30 + bob, 20, 6);
  g.fillRect(-52, 24 - bob, 20, 6);
  g.fillRect(-12, -30 - bob, 20, 6);
  g.fillRect(-12, 24 + bob, 20, 6);
  g.fillStyle = "#7a5230"; // caisse
  g.fillRect(-62, -26, 84, 52);
  g.fillStyle = "#efe6cc"; // bâche
  g.beginPath();
  g.roundRect(-58, -22, 74, 44, 14);
  g.fill();
  g.strokeStyle = "#b9a878";
  g.lineWidth = 2;
  g.stroke();
  for (let i = 1; i < 5; i++) {
    g.beginPath();
    g.moveTo(-58 + i * 15, -22);
    g.lineTo(-58 + i * 15, 22);
    g.stroke();
  }
  g.strokeStyle = "#5a3d1c"; // timon
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(22, 0);
  g.lineTo(52, 0);
  g.stroke();
  g.fillStyle = "#8a5a36"; // le bœuf
  g.beginPath();
  g.ellipse(70, 0, 20, 13, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#4e3320";
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = "#6e4426";
  g.beginPath();
  g.ellipse(90, 0 + bob * 0.5, 9, 8, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#efe6cc"; // cornes
  g.fillRect(88, -11, 4, 6);
  g.fillRect(88, 5, 4, 6);
  g.restore();
}

// Un cochon vu de dessus (rose, queue en tire-bouchon) ; un porcelet est plus petit.
function drawPig(g: CanvasRenderingContext2D, x: number, y: number, dir: number, size: number, graze: boolean, sad: boolean) {
  g.save();
  g.translate(x, y);
  g.scale(dir * size, size);
  g.fillStyle = "rgba(30,20,10,0.25)";
  g.beginPath();
  g.ellipse(2, 8, 17, 8, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#f0b6b0";
  g.beginPath();
  g.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
  g.fill();
  if (isViking()) P.furShade(g, 0, 0, 16, 10, 41, true, 0.8);
  g.strokeStyle = "#a36a66";
  g.lineWidth = 1.5;
  g.stroke();
  g.fillStyle = "#e79a96"; // flancs
  g.beginPath();
  g.ellipse(-3, 3, 8, 4, 0.1, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#c07872"; // queue
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-16, 0);
  g.quadraticCurveTo(-21, -5, -18, -2);
  g.quadraticCurveTo(-23, 2, -19, 3);
  g.stroke();
  const hy = graze ? 4 : 0;
  g.fillStyle = "#f0b6b0"; // tête
  g.beginPath();
  g.ellipse(17, hy, 8, 7, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#a36a66";
  g.lineWidth = 1.5;
  g.stroke();
  g.fillStyle = "#e08a86"; // oreilles
  g.beginPath();
  g.ellipse(13, hy - 6, 3.5, 4.5, -0.4, 0, Math.PI * 2);
  g.ellipse(13, hy + 6, 3.5, 4.5, 0.4, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#d8797a"; // groin
  g.beginPath();
  g.ellipse(24, hy, 3.6, 4.2, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#6b3d3a";
  g.fillRect(23, hy - 2, 1.5, 1.5);
  g.fillRect(23, hy + 1, 1.5, 1.5);
  g.fillStyle = "#2f2a26";
  g.beginPath();
  g.arc(18, hy - 3, 1.2, 0, Math.PI * 2);
  g.fill();
  if (sad) {
    g.fillStyle = "#d33";
    g.fillRect(-3, -3, 3, 3);
  }
  g.restore();
}

// Porcherie (4 × 4 cases) : un abri de bois au toit de chaume au nord, un enclos de boue où les cochons se promènent, une auge (légumes) et un abreuvoir (eau) dont les niveaux se voient.
export function drawPigpen(g: CanvasRenderingContext2D, gx: number, gy: number, rot = 0, pigs: { age: number; eat: number; drink: number }[] = [], t = 0, feed = 0.5, water = 0.5) {
  rotated(g, gx, gy, 4, rot, () => pigpenBody(g, gx, gy, pigs, t, feed, water));
}

function pigpenBody(g: CanvasRenderingContext2D, gx: number, gy: number, pigs: { age: number; eat: number; drink: number }[], t: number, feed: number, water: number) {
  if (isViking()) {
    const x = gx * C;
    const y = gy * C;
    const w = 4 * C;
    const v = variant(gx, gy);
    P.blit(g, `pigpen:${v}`, gx, gy, 4, (c) => P.paintPen(c, v * 199 + 61, "pigpen"));
    const tx = x + w - 112;
    const ty = y + w - 60;
    g.fillStyle = "rgba(20,14,6,0.35)";
    g.fillRect(tx + 4, ty + 5, 96, 40);
    g.fillStyle = "#6a4a2a";
    g.fillRect(tx, ty, 96, 40);
    g.fillStyle = "#e08a3a";
    g.fillRect(tx + 4, ty + 4, 40 * Math.max(0.08, Math.min(1, feed)), 32);
    g.fillStyle = "#3a86c8";
    g.fillRect(tx + 52, ty + 4, 40 * Math.max(0.08, Math.min(1, water)), 32);
    g.strokeStyle = "#3a2615";
    g.lineWidth = 2.5;
    g.strokeRect(tx, ty, 96, 40);
    g.beginPath();
    g.moveTo(tx + 48, ty);
    g.lineTo(tx + 48, ty + 40);
    g.stroke();
    pigs.forEach((p, i) => {
      const phase = t / (1700 + i * 190) + i * 2.3;
      const cx = x + 52 + (i % 4) * 54 + Math.sin(phase) * 15;
      const cy = y + 150 + Math.floor(i / 4) * 44 + Math.cos(phase * 0.8 + i) * 7;
      drawPig(g, cx, cy, Math.cos(phase) >= 0 ? 1 : -1, p.age >= 240 ? 1 : 0.65 + 0.35 * (p.age / 240), Math.sin(phase * 0.5 + i) > 0.5, p.eat > 90 || p.drink > 68);
    });
    return;
  }
  const x = gx * C;
  const y = gy * C;
  const w = 4 * C;
  g.fillStyle = "#c9a96e"; // seuil de l'entrée
  g.beginPath();
  g.roundRect(x + C + 8, y + w - 6, C - 16, 24, 8);
  g.fill();
  // enclos : terre battue et flaques de boue
  g.fillStyle = "#a98b5a";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 16);
  g.fill();
  g.strokeStyle = "#7a5a34";
  g.lineWidth = 4;
  g.stroke();
  g.fillStyle = "#8a6a3e";
  for (const [mx, my, rx, ry] of [[70, 150, 34, 16], [150, 200, 28, 13], [205, 140, 24, 12]]) {
    g.beginPath();
    g.ellipse(x + mx, y + my, rx, ry, 0.2, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#6d4527";
  for (let i = 0; i <= 8; i++) {
    const pxp = x + 10 + (i * (w - 20)) / 8;
    g.beginPath();
    g.arc(pxp, y + 6, 2.6, 0, Math.PI * 2);
    g.arc(pxp, y + w - 6, 2.6, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#cdb78a"; // allée
  g.fillRect(x + C + 6, y + 190, C - 12, w - 190);
  // l'abri : toit de chaume
  const bx = x + 14;
  const by = y + 12;
  const bw = w - 28;
  const bh = 86;
  g.fillStyle = "rgba(40,30,10,0.28)";
  g.fillRect(bx + 8, by + 9, bw, bh);
  g.fillStyle = "#c9a85a";
  g.fillRect(bx, by, bw / 2, bh);
  g.fillStyle = "#b08f45";
  g.fillRect(bx + bw / 2, by, bw / 2, bh);
  g.strokeStyle = "rgba(90,60,20,0.35)";
  g.lineWidth = 1.2;
  for (let i = 1; i < 12; i++) {
    g.beginPath();
    g.moveTo(bx, by + (i * bh) / 12);
    g.lineTo(bx + bw, by + (i * bh) / 12);
    g.stroke();
  }
  g.strokeStyle = "#5a3d1c";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(bx + bw / 2, by);
  g.lineTo(bx + bw / 2, by + bh);
  g.stroke();
  g.lineWidth = 3;
  g.strokeRect(bx, by, bw, bh);
  g.fillStyle = "#2d1d14";
  g.fillRect(bx + bw / 2 - 24, by + bh - 4, 48, 13);
  // auge (légumes) et abreuvoir (eau) en bas à droite
  const tx = x + w - 112;
  const ty = y + w - 56;
  g.fillStyle = "rgba(40,30,10,0.25)";
  g.fillRect(tx + 4, ty + 5, 96, 40);
  g.fillStyle = "#7a5230";
  g.fillRect(tx, ty, 96, 40);
  g.fillStyle = "#e08a3a"; // des légumes
  g.fillRect(tx + 4, ty + 4, 40 * Math.max(0.08, Math.min(1, feed)), 32);
  g.fillStyle = "#2f7fc0";
  g.fillRect(tx + 52, ty + 4, 40 * Math.max(0.08, Math.min(1, water)), 32);
  g.strokeStyle = "#4e3320";
  g.lineWidth = 2.5;
  g.strokeRect(tx, ty, 96, 40);
  g.beginPath();
  g.moveTo(tx + 48, ty);
  g.lineTo(tx + 48, ty + 40);
  g.stroke();
  // les cochons : positions calculées à partir du temps ; les porcelets sont plus petits
  pigs.forEach((p, i) => {
    const phase = t / (1700 + i * 190) + i * 2.3;
    const cx = x + 52 + (i % 4) * 54 + Math.sin(phase) * 15;
    const cy = y + 134 + Math.floor(i / 4) * 46 + Math.cos(phase * 0.8 + i) * 7;
    drawPig(g, cx, cy, Math.cos(phase) >= 0 ? 1 : -1, p.age >= 240 ? 1 : 0.65 + 0.35 * (p.age / 240), Math.sin(phase * 0.5 + i) > 0.5, p.eat > 90 || p.drink > 68);
  });
}

// Étable (4 × 4 cases) : une grange au nord, un enclos clos de barrières où les vaches se promènent, une auge (herbe) et un abreuvoir (eau) dont les niveaux se voient.
export function drawStable(g: CanvasRenderingContext2D, gx: number, gy: number, rot = 0, cows: { eat: number; drink: number }[] = [], t = 0, feed = 0.5, water = 0.5) {
  rotated(g, gx, gy, 4, rot, () => stableBody(g, gx, gy, cows, t, feed, water));
}

// ---------- style « peint » (thème viking) : voir painted.ts ----------

function stablePainted(g: CanvasRenderingContext2D, gx: number, gy: number, cows: { eat: number; drink: number }[], t: number, feed: number, water: number) {
  const x = gx * C;
  const y = gy * C;
  const w = 4 * C;
  const v = variant(gx, gy);
  P.blit(g, `stable:${v}`, gx, gy, 4, (c) => P.paintPen(c, v * 197 + 59, "stable"));
  // auge et abreuvoir (le niveau se voit)
  const tx = x + w - 112;
  const ty = y + w - 60;
  g.fillStyle = "rgba(20,14,6,0.35)";
  g.fillRect(tx + 4, ty + 5, 96, 40);
  g.fillStyle = "#6a4a2a";
  g.fillRect(tx, ty, 96, 40);
  g.fillStyle = "#c9a64a";
  g.fillRect(tx + 4, ty + 4, 40 * Math.max(0.08, Math.min(1, feed)), 32);
  g.fillStyle = "#3a86c8";
  g.fillRect(tx + 52, ty + 4, 40 * Math.max(0.08, Math.min(1, water)), 32);
  g.strokeStyle = "#3a2615";
  g.lineWidth = 2.5;
  g.strokeRect(tx, ty, 96, 40);
  g.beginPath();
  g.moveTo(tx + 48, ty);
  g.lineTo(tx + 48, ty + 40);
  g.stroke();
  // les vaches qui se promènent dans l'enclos
  cows.forEach((c, i) => {
    const phase = t / (1900 + i * 230) + i * 2.1;
    const cx = x + 56 + (i % 3) * 66 + Math.sin(phase) * 20;
    const cy = y + 150 + Math.floor(i / 3) * 40 + Math.cos(phase * 0.7 + i) * 8;
    drawCow(g, cx, cy, Math.cos(phase) >= 0 ? 1 : -1, i, Math.sin(phase * 0.4 + i) > 0.55, c.eat > 105 || c.drink > 75);
  });
}

function stableBody(g: CanvasRenderingContext2D, gx: number, gy: number, cows: { eat: number; drink: number }[], t: number, feed: number, water: number) {
  if (isViking()) return stablePainted(g, gx, gy, cows, t, feed, water);
  const x = gx * C;
  const y = gy * C;
  const w = 4 * C;
  // seuil de l'entrée (la case d'entrée est juste en dessous, deuxième colonne)
  g.fillStyle = "#c9a96e";
  g.beginPath();
  g.roundRect(x + C + 8, y + w - 6, C - 16, 24, 8);
  g.fill();
  // enclos : herbe rase et barrière
  g.fillStyle = "#9fcc6a";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 16);
  g.fill();
  g.strokeStyle = "#8a6a3c";
  g.lineWidth = 4;
  g.stroke();
  g.fillStyle = "#6d4527";
  for (let i = 0; i <= 8; i++) {
    const pxp = x + 10 + (i * (w - 20)) / 8;
    g.beginPath();
    g.arc(pxp, y + 6, 2.6, 0, Math.PI * 2);
    g.arc(pxp, y + w - 6, 2.6, 0, Math.PI * 2);
    g.fill();
  }
  // allée vers la porte
  g.fillStyle = "#cdb78a";
  g.fillRect(x + C + 6, y + 190, C - 12, w - 190);
  // la grange au nord
  const bx = x + 14;
  const by = y + 12;
  const bw = w - 28;
  const bh = 92;
  g.fillStyle = "rgba(40,30,10,0.28)";
  g.fillRect(bx + 8, by + 9, bw, bh);
  g.fillStyle = "#a35a3a";
  g.fillRect(bx, by, bw / 2, bh);
  g.fillStyle = "#8a4a2e";
  g.fillRect(bx + bw / 2, by, bw / 2, bh);
  g.strokeStyle = "rgba(40,20,10,0.3)";
  g.lineWidth = 1;
  for (let i = 1; i < 9; i++) {
    g.beginPath();
    g.moveTo(bx, by + (i * bh) / 9);
    g.lineTo(bx + bw, by + (i * bh) / 9);
    g.stroke();
  }
  g.strokeStyle = "#4e2a1a";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(bx + bw / 2, by);
  g.lineTo(bx + bw / 2, by + bh);
  g.stroke();
  g.lineWidth = 3;
  g.strokeRect(bx, by, bw, bh);
  // grande porte de la grange
  g.fillStyle = "#2d1d14";
  g.fillRect(bx + bw / 2 - 26, by + bh - 4, 52, 14);
  // auge (herbe) et abreuvoir (eau) en bas à droite
  const tx = x + w - 112;
  const ty = y + w - 56;
  g.fillStyle = "rgba(40,30,10,0.25)";
  g.fillRect(tx + 4, ty + 5, 96, 40);
  g.fillStyle = "#7a5230";
  g.fillRect(tx, ty, 96, 40);
  g.fillStyle = "#c9a64a"; // l'herbe sèche, selon le niveau
  g.fillRect(tx + 4, ty + 4, 40 * Math.max(0.08, Math.min(1, feed)), 32);
  g.fillStyle = "#2f7fc0"; // l'eau
  g.fillRect(tx + 52, ty + 4, 40 * Math.max(0.08, Math.min(1, water)), 32);
  g.strokeStyle = "#4e3320";
  g.lineWidth = 2.5;
  g.strokeRect(tx, ty, 96, 40);
  g.beginPath();
  g.moveTo(tx + 48, ty);
  g.lineTo(tx + 48, ty + 40);
  g.stroke();
  // les vaches qui se promènent dans l'enclos (positions calculées à partir du temps : rien à sauvegarder)
  cows.forEach((c, i) => {
    const phase = t / (1900 + i * 230) + i * 2.1;
    const cx = x + 56 + (i % 3) * 66 + Math.sin(phase) * 20;
    const cy = y + 138 + Math.floor(i / 3) * 42 + Math.cos(phase * 0.7 + i) * 8;
    drawCow(g, cx, cy, Math.cos(phase) >= 0 ? 1 : -1, i, Math.sin(phase * 0.4 + i) > 0.55, c.eat > 105 || c.drink > 75);
  });
}

// Église (3 × 3 cases) : nef de pierre à toit d'ardoise en croix, clocher carré, et au sud un cimetière clos de murets où s'alignent les tombes.
export function drawChurch(g: CanvasRenderingContext2D, gx: number, gy: number, rot = 0, graves = 0) {
  rotated(g, gx, gy, 3, rot, () => churchBody(g, gx, gy, graves));
}

function churchBody(g: CanvasRenderingContext2D, gx: number, gy: number, graves: number) {
  if (isViking()) {
    const v = variant(gx, gy);
    return P.blit(g, `church:${v}:${graves}`, gx, gy, 3, (c) => P.paintChurch(c, v * 179 + 41, graves));
  }
  const x = gx * C;
  const y = gy * C;
  const w = 3 * C;
  // seuil de l'entrée (la case d'entrée est juste en dessous, au milieu)
  g.fillStyle = "#c9a96e";
  g.beginPath();
  g.roundRect(x + C + 8, y + w - 6, C - 16, 24, 8);
  g.fill();
  // terrain du cimetière : herbe rase, murets
  g.fillStyle = "#98c36a";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 18);
  g.fill();
  g.strokeStyle = "#8d8a80";
  g.lineWidth = 5;
  g.stroke();
  // allée centrale vers la porte
  g.fillStyle = "#cdbb94";
  g.fillRect(x + w / 2 - 12, y + 96, 24, w - 96);
  // tombes : 3 rangées de 6 (l'allée reste libre), remplies dans l'ordre
  let k = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 7; col++) {
      if (col === 3) continue;
      const tx = x + 16 + col * 26;
      const ty = y + 106 + row * 24;
      const filled = k < graves;
      k++;
      g.fillStyle = "rgba(40,30,10,0.2)";
      g.fillRect(tx + 2, ty + 3, 14, 14);
      g.fillStyle = filled ? "#8b6f4e" : "#a98f6a"; // terre remuée
      g.fillRect(tx - 1, ty + 10, 16, 9);
      if (filled) {
        g.fillStyle = "#b9b8b4";
        g.beginPath();
        g.roundRect(tx + 2, ty - 4, 10, 13, [5, 5, 0, 0]);
        g.fill();
        g.strokeStyle = "#7a7974";
        g.lineWidth = 1;
        g.stroke();
      }
    }
  }
  // la nef : ombre, toit d'ardoise à deux pans, croisillon
  const bx = x + 22;
  const by = y + 14;
  const bw = w - 44;
  const bh = 74;
  g.fillStyle = "rgba(40,30,10,0.28)";
  g.fillRect(bx + 8, by + 9, bw, bh);
  g.fillStyle = "#cfc9bc";
  g.fillRect(bx, by, bw, bh);
  g.fillStyle = "#6a7587";
  g.fillRect(bx + 6, by + 6, bw / 2 - 6, bh - 12);
  g.fillStyle = "#566174";
  g.fillRect(bx + bw / 2, by + 6, bw / 2 - 6, bh - 12);
  g.strokeStyle = "#3f4856";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(bx + bw / 2, by + 6);
  g.lineTo(bx + bw / 2, by + bh - 6);
  g.stroke();
  g.strokeStyle = "#7a7468";
  g.lineWidth = 2.5;
  g.strokeRect(bx, by, bw, bh);
  // clocher : tour carrée à gauche, avec la cloche
  const tx = bx - 8;
  const ty = by - 6;
  g.fillStyle = "rgba(40,30,10,0.28)";
  g.fillRect(tx + 6, ty + 7, 38, 38);
  g.fillStyle = "#dcd6c8";
  g.fillRect(tx, ty, 38, 38);
  g.fillStyle = "#4b5566";
  g.beginPath();
  g.moveTo(tx + 3, ty + 35);
  g.lineTo(tx + 19, ty + 3);
  g.lineTo(tx + 35, ty + 35);
  g.closePath();
  g.fill();
  g.strokeStyle = "#7a7468";
  g.lineWidth = 2;
  g.strokeRect(tx, ty, 38, 38);
  g.fillStyle = "#d9b24a";
  g.beginPath();
  g.arc(tx + 19, ty + 21, 5, 0, Math.PI * 2);
  g.fill();
  // croix sur le toit de la nef
  g.fillStyle = "#f2efe6";
  g.fillRect(bx + bw / 2 - 4, by + 14, 8, 38);
  g.fillRect(bx + bw / 2 - 15, by + 24, 30, 8);
  // grande porte au bas de la nef
  g.fillStyle = "#4e3320";
  g.fillRect(bx + bw / 2 - 12, by + bh - 4, 24, 12);
}

// Un défunt allongé sous un linceul, devant sa maison.
export function drawCorpse(g: CanvasRenderingContext2D, x: number, y: number, color: string) {
  const px = x * C;
  const py = y * C;
  g.fillStyle = "rgba(30,20,10,0.28)";
  g.beginPath();
  g.ellipse(px + 3, py + 5, 22, 10, 0.25, 0, Math.PI * 2);
  g.fill();
  g.save();
  g.translate(px, py);
  g.rotate(0.25);
  // la tête qui dépasse du linceul
  g.fillStyle = "#e9b98c";
  g.beginPath();
  g.arc(-17, 0, 7, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = color;
  g.beginPath();
  g.arc(-18, -2, 5, Math.PI, Math.PI * 2);
  g.fill();
  g.fillStyle = "#efece4";
  g.beginPath();
  g.roundRect(-11, -9, 32, 18, 8);
  g.fill();
  g.strokeStyle = "#a9a699";
  g.lineWidth = 1.5;
  g.stroke();
  g.strokeStyle = "rgba(120,115,100,0.6)";
  g.beginPath();
  g.moveTo(-2, -9);
  g.lineTo(-2, 9);
  g.moveTo(9, -9);
  g.lineTo(9, 9);
  g.stroke();
  g.restore();
  // un cierge à côté
  g.fillStyle = "#f4efdc";
  g.fillRect(px + 22, py - 14, 5, 14);
  g.fillStyle = "#f2b13a";
  g.beginPath();
  g.ellipse(px + 24.5, py - 17, 3, 5, 0, 0, Math.PI * 2);
  g.fill();
}

// Maison du soigneur (2 × 2 cases) : petite maison blanche à toit vert, croix claire, jardin d'herbes médicinales.
export function drawClinic(g: CanvasRenderingContext2D, gx: number, gy: number, rot = 0, brewing = false, t = 0) {
  rotated(g, gx, gy, 2, rot, () => clinicBody(g, gx, gy));
  if (!brewing) return;
  // le soigneur prépare un remède à l'intérieur : de la vapeur verte monte du toit
  const cx = (gx + 1) * C;
  const cy = (gy + 0.55) * C;
  for (let i = 0; i < 5; i++) {
    const p = (t / 2200 + i / 5) % 1;
    g.fillStyle = `rgba(150,215,150,${0.7 * (1 - p)})`;
    g.beginPath();
    g.arc(cx + Math.sin(p * 6 + i * 1.7) * 8, cy - p * 54, 6 + p * 11, 0, Math.PI * 2);
    g.fill();
  }
}

function clinicBody(g: CanvasRenderingContext2D, gx: number, gy: number) {
  if (isViking()) {
    const v = variant(gx, gy);
    return P.blit(g, `clinic:${v}`, gx, gy, 2, (c) => P.paintClinic(c, v * 167 + 31));
  }
  const x = gx * C;
  const y = gy * C;
  const w = 2 * C;
  // seuil de l'entrée (la case d'entrée est juste en dessous, côté gauche)
  g.fillStyle = "#c9a96e";
  g.beginPath();
  g.roundRect(x + 10, y + w - 6, 44, 24, 8);
  g.fill();
  // cour d'herbe tendre
  g.fillStyle = "#a9d27a";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 20);
  g.fill();
  g.strokeStyle = "#7c9d52";
  g.lineWidth = 2;
  g.stroke();
  // jardin d'herbes : deux plates-bandes
  for (const [bx, by] of [[10, 86], [74, 86]]) {
    g.fillStyle = "#7a5a34";
    g.fillRect(x + bx, y + by, 44, 28);
    for (let k = 0; k < 5; k++) {
      g.fillStyle = k % 2 ? "#4f9a4a" : "#6cbb55";
      g.beginPath();
      g.arc(x + bx + 6 + k * 8, y + by + 14, 5.5, 0, Math.PI * 2);
      g.fill();
    }
  }
  // la maison : ombre, murs clairs, toit vert à deux pans
  const hx = x + 14;
  const hy = y + 12;
  const hw = w - 28;
  const hh = 68;
  g.fillStyle = "rgba(40,30,10,0.26)";
  g.fillRect(hx + 7, hy + 8, hw, hh);
  g.fillStyle = "#f1ead8";
  g.fillRect(hx, hy, hw, hh);
  g.fillStyle = "#4f9a6a";
  g.fillRect(hx, hy, hw / 2, hh - 10);
  g.fillStyle = "#3e8257";
  g.fillRect(hx + hw / 2, hy, hw / 2, hh - 10);
  g.strokeStyle = "#2f6644";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(hx + hw / 2, hy);
  g.lineTo(hx + hw / 2, hy + hh - 10);
  g.stroke();
  g.strokeStyle = "#6e6650";
  g.lineWidth = 2.5;
  g.strokeRect(hx, hy, hw, hh);
  // croix claire sur le toit
  g.fillStyle = "#f6f2e6";
  g.fillRect(hx + hw / 2 - 5, hy + 8, 10, 34);
  g.fillRect(hx + hw / 2 - 17, hy + 20, 34, 10);
  // porte au milieu du bas
  g.fillStyle = "#6d4527";
  g.fillRect(hx + hw / 2 - 11, hy + hh - 12, 22, 12);
}

// Port (3 × 3 cases) : entrepôt à toit bleu, quai de bois qui avance vers l'eau (au nord quand rot = 0), caisses et tonneaux.
export function drawPort(g: CanvasRenderingContext2D, gx: number, gy: number, rot = 0) {
  rotated(g, gx, gy, 3, rot, () => portBody(g, gx, gy));
}

function portBody(g: CanvasRenderingContext2D, gx: number, gy: number) {
  if (isViking()) {
    const v = variant(gx, gy);
    P.blit(g, `port:${v}`, gx, gy, 3, (c) => P.paintPort(c, v * 223 + 71));
    P.drawPier(g, gx * C, gy * C);
    return;
  }
  const x = gx * C;
  const y = gy * C;
  const w = 3 * C;
  // seuil de l'entrée : tapis de terre sous la porte (la case d'entrée est juste en dessous, au milieu)
  g.fillStyle = "#c9a96e";
  g.beginPath();
  g.roundRect(x + C + 8, y + w - 6, C - 16, 24, 8);
  g.fill();
  // terre-plein
  g.fillStyle = "#c2a878";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 20);
  g.fill();
  g.strokeStyle = "#9c8049";
  g.lineWidth = 2;
  g.stroke();
  // quai : planches qui sortent du côté de l'eau, sur une case de plus
  const px = x + C + 6;
  const pw = C - 12;
  const py = y - C * 0.95;
  g.fillStyle = "rgba(20,40,60,0.28)";
  g.fillRect(px + 5, py + 6, pw, C * 1.5);
  g.fillStyle = "#a47c48";
  g.fillRect(px, py, pw, C * 1.5);
  g.strokeStyle = "#7a5a34";
  g.lineWidth = 2;
  for (let k = 0; k < 8; k++) {
    g.beginPath();
    g.moveTo(px, py + 8 + k * 11);
    g.lineTo(px + pw, py + 8 + k * 11);
    g.stroke();
  }
  g.strokeRect(px, py, pw, C * 1.5);
  // pieux au bout du quai
  g.fillStyle = "#5a3a1c";
  for (const [qx, qy] of [[px, py], [px + pw, py], [px, py + 34], [px + pw, py + 34]]) {
    g.beginPath();
    g.arc(qx, qy, 5, 0, Math.PI * 2);
    g.fill();
  }
  // entrepôt : toit à rangées bleues et ancre blanche
  const rx = x + 12;
  const ry = y + C * 0.9;
  const rw = w - 24;
  const rh = C * 1.55;
  g.fillStyle = "rgba(40,30,10,0.28)";
  g.fillRect(rx + 6, ry + 6, rw, rh);
  g.fillStyle = "#4f78a8";
  g.fillRect(rx, ry, rw, rh);
  g.strokeStyle = "rgba(20,40,70,0.35)";
  g.lineWidth = 2;
  for (let k = 1; k < 7; k++) {
    g.beginPath();
    g.moveTo(rx + 3, ry + (k * rh) / 7);
    g.lineTo(rx + rw - 3, ry + (k * rh) / 7);
    g.stroke();
  }
  g.strokeStyle = "#2b4a72";
  g.lineWidth = 3;
  g.strokeRect(rx, ry, rw, rh);
  g.strokeStyle = "#f1f5fb";
  g.lineWidth = 4;
  g.lineCap = "round";
  const ax = rx + rw / 2;
  const ay = ry + rh / 2;
  g.beginPath();
  g.arc(ax, ay - 10, 6, 0, Math.PI * 2);
  g.moveTo(ax, ay - 4);
  g.lineTo(ax, ay + 20);
  g.moveTo(ax - 12, ay + 4);
  g.lineTo(ax + 12, ay + 4);
  g.moveTo(ax - 15, ay + 12);
  g.quadraticCurveTo(ax, ay + 28, ax + 15, ay + 12);
  g.stroke();
  // caisses et tonneaux près du quai
  g.fillStyle = "#b08a58";
  g.fillRect(x + 12, y + 14, 34, 30);
  g.strokeStyle = "#7a5a34";
  g.lineWidth = 2;
  g.strokeRect(x + 12, y + 14, 34, 30);
  g.fillStyle = "#8a5a2e";
  g.beginPath();
  g.arc(x + w - 30, y + 30, 14, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#5a3a1c";
  g.stroke();
}

// Le bateau qui passe : il arrive du large, s'amarre au bout du quai pendant qu'on charge, puis repart. Il suit le cycle de `port.t`.
export function drawShip(g: CanvasRenderingContext2D, port: Port, time: number) {
  const f = port.t / SHIP_CYCLE;
  if (f < SHIP_ARRIVE - 0.02 || f > SHIP_GONE) return;
  const rot = (port.rot ?? 0) % 4;
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const [dx, dy] = dirs[rot];
  const dock = 3.45; // distance du centre du port au bateau à quai, en cases
  const far = 11; // distance d'où il arrive
  let dist = dock;
  let heading = 1; // 1 : il vient vers le quai, -1 : il repart
  if (f < SHIP_DOCKED) dist = dock + (far - dock) * (1 - (f - (SHIP_ARRIVE - 0.02)) / (SHIP_DOCKED - SHIP_ARRIVE + 0.02));
  else if (f > SHIP_DEPART) {
    dist = dock + (far - dock) * ((f - SHIP_DEPART) / (SHIP_GONE - SHIP_DEPART));
    heading = -1;
  }
  const cx = (port.gx + 1.5) * C + dx * dist * C;
  const cy = (port.gy + 1.5) * C + dy * dist * C;
  g.save();
  g.translate(cx, cy + Math.sin(time / 400) * 2);
  // l'avant du bateau regarde vers le quai (centre du port) à l'arrivée, vers le large au départ
  g.rotate(Math.atan2(dy, dx) + (heading > 0 ? Math.PI : 0));
  const L = C * 1.1;
  const W = C * 0.42;
  if (isViking()) {
    drawLongship(g, L * 1.15, W, time); // le drakkar
    g.restore();
    return;
  }
  g.fillStyle = "rgba(10,40,70,0.3)";
  g.beginPath();
  g.ellipse(5, 6, L, W, 0, 0, Math.PI * 2);
  g.fill();
  // sillage
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(0, 0, L * 1.12, W * 1.25, 0, 0, Math.PI * 2);
  g.stroke();
  // coque
  g.fillStyle = "#7a4e2a";
  g.beginPath();
  g.moveTo(L, 0);
  g.quadraticCurveTo(L * 0.7, -W, 0, -W);
  g.lineTo(-L * 0.9, -W * 0.85);
  g.lineTo(-L * 0.9, W * 0.85);
  g.lineTo(0, W);
  g.quadraticCurveTo(L * 0.7, W, L, 0);
  g.closePath();
  g.fill();
  g.strokeStyle = "#4e3320";
  g.lineWidth = 3;
  g.stroke();
  // pont, caisses, mât et voile
  g.fillStyle = "#b08a58";
  g.beginPath();
  g.roundRect(-L * 0.75, -W * 0.6, L * 1.3, W * 1.2, 6);
  g.fill();
  g.fillStyle = "#8a5a2e";
  for (const k of [-0.5, 0.05]) g.fillRect(L * k - 8, -W * 0.35, 16, 16);
  g.fillStyle = "#f4efe4";
  g.beginPath();
  g.roundRect(-L * 0.1, -W * 1.1, L * 0.5, W * 2.2, 8);
  g.fill();
  g.strokeStyle = "#c9bfa5";
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = "#5a3a1c";
  g.beginPath();
  g.arc(L * 0.15, 0, 5, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

// Boucherie (3 × 3 cases), vue de dessus : auvent rayé rouge et blanc, billot avec un couperet, caisses de viande.
// working : le couperet s'abat.
export function drawButcher(g: CanvasRenderingContext2D, gx: number, gy: number, working: boolean, t: number, rot = 0) {
  rotated(g, gx, gy, 3, rot, () => butcherBody(g, gx, gy));
  // le couperet, lui, s'anime à part (sa position suit la rotation du bâtiment)
  const w = 3 * C;
  let vx = w * 0.3 - w / 2;
  let vy = w * 0.74 - w / 2;
  for (let i = 0; i < rot % 4; i++) [vx, vy] = [-vy, vx];
  const cx = gx * C + w / 2 + vx;
  const cy = gy * C + w / 2 + vy;
  const swing = working ? Math.max(0, Math.sin(t / 130)) : 0;
  g.save();
  g.translate(cx, cy);
  g.rotate(((rot % 4) * Math.PI) / 2 - 0.9 + swing * 1.1);
  g.strokeStyle = "#6b4a28";
  g.lineWidth = 4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(22, 0);
  g.stroke();
  g.fillStyle = "#cfd3d8";
  g.beginPath();
  g.roundRect(18, -9, 18, 18, 3);
  g.fill();
  g.strokeStyle = "#8b9099";
  g.lineWidth = 2;
  g.stroke();
  g.restore();
}

function butcherBody(g: CanvasRenderingContext2D, gx: number, gy: number) {
  if (isViking()) {
    const v = variant(gx, gy);
    return P.blit(g, `butcher:${v}`, gx, gy, 3, (c) => P.paintButcher(c, v * 157 + 23));
  }
  const x = gx * C;
  const y = gy * C;
  const w = 3 * C;
  // seuil de l'entrée : tapis de terre sous la porte (la case d'entrée est juste en dessous, au milieu)
  g.fillStyle = "#c9a96e";
  g.beginPath();
  g.roundRect(x + C + 8, y + w - 6, C - 16, 24, 8);
  g.fill();
  // cour piétinée
  g.fillStyle = "#b79a63";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 24);
  g.fill();
  g.strokeStyle = "#9c8049";
  g.lineWidth = 2;
  g.stroke();
  // boutique : toit à bandes rouges et blanches
  const rx = x + 14;
  const ry = y + 14;
  const rw = w * 0.66;
  const rh = w * 0.44;
  g.fillStyle = "rgba(40,30,10,0.28)";
  g.fillRect(rx + 6, ry + 6, rw, rh);
  const stripes = 8;
  for (let k = 0; k < stripes; k++) {
    g.fillStyle = k % 2 ? "#f1ebe0" : "#c0453a";
    g.fillRect(rx + (k * rw) / stripes, ry, rw / stripes + 0.5, rh);
  }
  g.strokeStyle = "#7d3624";
  g.lineWidth = 3;
  g.strokeRect(rx, ry, rw, rh);
  g.strokeStyle = "rgba(90,30,20,0.5)";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(rx, ry + rh / 2);
  g.lineTo(rx + rw, ry + rh / 2);
  g.stroke();
  // crochets de boucher sous l'auvent (en haut à droite) : deux quartiers de viande suspendus
  for (let k = 0; k < 2; k++) {
    const hx = x + w - 52 + k * 26;
    g.strokeStyle = "#7c7b77";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(hx, y + 20);
    g.lineTo(hx, y + 36);
    g.stroke();
    g.fillStyle = k % 2 ? "#a63a30" : "#b5443a";
    g.beginPath();
    g.ellipse(hx, y + 56, 10, 20, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#f2e8d8";
    g.beginPath();
    g.ellipse(hx, y + 40, 4, 5, 0, 0, Math.PI * 2);
    g.fill();
  }
  // billot en bois (en bas à gauche) : le couperet est dessiné par drawButcher
  const bx = x + w * 0.3;
  const by = y + w * 0.74;
  g.fillStyle = "rgba(40,30,10,0.3)";
  g.beginPath();
  g.arc(bx + 4, by + 5, 28, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#9a6a3a";
  g.beginPath();
  g.arc(bx, by, 28, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#6b4a28";
  g.lineWidth = 3;
  g.stroke();
  g.strokeStyle = "rgba(90,60,30,0.5)";
  g.lineWidth = 1.5;
  for (const rr of [8, 16, 23]) {
    g.beginPath();
    g.arc(bx, by, rr, 0, Math.PI * 2);
    g.stroke();
  }
  // caisses de viande (en bas à droite)
  for (let k = 0; k < 2; k++) {
    const cx2 = x + w - 100 + k * 46;
    const cy2 = y + w * 0.64 + (k ? 20 : 0);
    g.fillStyle = "rgba(40,30,10,0.3)";
    g.fillRect(cx2 + 4, cy2 + 4, 40, 34);
    g.fillStyle = "#b08a58";
    g.fillRect(cx2, cy2, 40, 34);
    g.strokeStyle = "#7a5a34";
    g.lineWidth = 2;
    g.strokeRect(cx2, cy2, 40, 34);
    g.fillStyle = "#c0453a";
    g.beginPath();
    g.ellipse(cx2 + 14, cy2 + 15, 8, 6, 0.3, 0, Math.PI * 2);
    g.ellipse(cx2 + 28, cy2 + 20, 7, 5, -0.3, 0, Math.PI * 2);
    g.fill();
  }
}

// Camp de chasseur (2 × 2 cases) : tente de peau, étendoir où sèche la viande, peau tendue au sol.
export function drawLodge(g: CanvasRenderingContext2D, gx: number, gy: number, rot = 0) {
  rotated(g, gx, gy, 2, rot, () => lodgeBody(g, gx, gy));
}

function lodgeBody(g: CanvasRenderingContext2D, gx: number, gy: number) {
  if (isViking()) {
    const v = variant(gx, gy);
    return P.blit(g, `lodge:${v}`, gx, gy, 2, (c) => P.paintLodge(c, v * 151 + 19));
  }
  const x = gx * C;
  const y = gy * C;
  const w = 2 * C;
  // seuil de l'entrée (la case d'entrée est juste en dessous, côté gauche)
  g.fillStyle = "#c9a96e";
  g.beginPath();
  g.roundRect(x + 10, y + w - 6, 44, 24, 8);
  g.fill();
  // sol piétiné
  g.fillStyle = "#b79a63";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 24);
  g.fill();
  g.strokeStyle = "#9c8049";
  g.lineWidth = 2;
  g.stroke();
  // tente ronde en peau : huit pans qui montent vers le mât
  const cx = x + 44;
  const cy = y + 46;
  g.fillStyle = "rgba(40,30,10,0.3)";
  g.beginPath();
  g.arc(cx + 5, cy + 6, 32, 0, Math.PI * 2);
  g.fill();
  for (let k = 0; k < 8; k++) {
    g.fillStyle = k % 2 ? "#c79a62" : "#b8854e";
    g.beginPath();
    g.moveTo(cx, cy);
    g.arc(cx, cy, 32, (k / 8) * Math.PI * 2, ((k + 1) / 8) * Math.PI * 2);
    g.closePath();
    g.fill();
  }
  g.strokeStyle = "#7a5430";
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(cx, cy, 32, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#4e3320";
  g.beginPath();
  g.arc(cx, cy, 5, 0, Math.PI * 2);
  g.fill();
  // porte de la tente (un pan plus sombre)
  g.fillStyle = "#4e3320";
  g.beginPath();
  g.moveTo(cx - 8, cy + 31);
  g.lineTo(cx + 8, cy + 31);
  g.lineTo(cx, cy + 14);
  g.closePath();
  g.fill();
  // étendoir à viande (à droite) : deux piquets, une barre et des lanières
  g.strokeStyle = "#6b4a28";
  g.lineWidth = 4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x + w - 44, y + 22);
  g.lineTo(x + w - 44, y + 86);
  g.moveTo(x + w - 14, y + 22);
  g.lineTo(x + w - 14, y + 86);
  g.moveTo(x + w - 46, y + 28);
  g.lineTo(x + w - 12, y + 28);
  g.stroke();
  for (let k = 0; k < 3; k++) {
    g.fillStyle = k % 2 ? "#a63a30" : "#b5443a";
    g.beginPath();
    g.roundRect(x + w - 40 + k * 10, y + 30, 7, 24 + k * 4, 3);
    g.fill();
  }
  // peau tendue au sol (en bas à droite)
  g.fillStyle = "#a9733f";
  g.beginPath();
  g.ellipse(x + w - 36, y + w - 36, 24, 15, -0.3, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#7a5430";
  g.lineWidth = 2;
  g.stroke();
}

// Puits (2 × 2 cases) : margelle de pierre, eau, deux montants et un seau sur sa corde.
export function drawWell(g: CanvasRenderingContext2D, gx: number, gy: number, rot = 0) {
  rotated(g, gx, gy, 2, rot, () => wellBody(g, gx, gy));
}

function wellBody(g: CanvasRenderingContext2D, gx: number, gy: number) {
  if (isViking()) {
    const v = variant(gx, gy);
    return P.blit(g, `well:${v}`, gx, gy, 2, (c) => P.paintWell(c, v * 149 + 17));
  }
  const x = gx * C;
  const y = gy * C;
  const w = 2 * C;
  // seuil de l'entrée (la case d'entrée est juste en dessous, côté gauche)
  g.fillStyle = "#c9a96e";
  g.beginPath();
  g.roundRect(x + 10, y + w - 6, 44, 24, 8);
  g.fill();
  // sol piétiné
  g.fillStyle = "#b79a63";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 24);
  g.fill();
  g.strokeStyle = "#9c8049";
  g.lineWidth = 2;
  g.stroke();
  const cx = x + w / 2;
  const cy = y + w / 2;
  // margelle
  g.fillStyle = "rgba(40,30,10,0.3)";
  g.beginPath();
  g.arc(cx + 5, cy + 6, 40, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#a8a6a0";
  g.beginPath();
  g.arc(cx, cy, 40, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#7c7b77";
  g.lineWidth = 3;
  g.stroke();
  // pierres de la margelle
  g.strokeStyle = "rgba(90,88,84,0.6)";
  g.lineWidth = 2;
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 30);
    g.lineTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40);
    g.stroke();
  }
  // eau
  g.fillStyle = "#2b6fae";
  g.beginPath();
  g.arc(cx, cy, 29, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#5aa9e6";
  g.beginPath();
  g.arc(cx - 7, cy - 7, 14, 0, Math.PI * 2);
  g.fill();
  // poutre au-dessus et seau
  g.strokeStyle = "#7a4e2a";
  g.lineWidth = 6;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(cx - 46, cy - 2);
  g.lineTo(cx + 46, cy - 2);
  g.stroke();
  g.fillStyle = "#5a3a1c";
  for (const px of [cx - 46, cx + 46]) {
    g.beginPath();
    g.arc(px, cy - 2, 6, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#8a5a2e";
  g.beginPath();
  g.arc(cx + 14, cy - 2, 9, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#5aa9e6";
  g.beginPath();
  g.arc(cx + 14, cy - 2, 5.5, 0, Math.PI * 2);
  g.fill();
}

// Maison (2 × 2 cases), vue de dessus : toit de tuiles à deux pans, cheminée et porte en bas à gauche.
// smoke : quelqu'un est à l'intérieur, une fumée sort de la cheminée.
function houseBody(g: CanvasRenderingContext2D, gx: number, gy: number) {
  if (isViking()) {
    const v = variant(gx, gy);
    return P.blit(g, `house:${v}`, gx, gy, 2, (c) => P.paintHouse(c, v * 131 + 7));
  }
  const x = gx * C;
  const y = gy * C;
  const w = 2 * C;
  // seuil : tapis devant la porte (la case d'entrée est juste en dessous)
  g.fillStyle = "#c9a96e";
  g.beginPath();
  g.roundRect(x + 10, y + w - 6, 44, 24, 8);
  g.fill();
  // ombre et murs
  g.fillStyle = "rgba(40,30,10,0.28)";
  g.fillRect(x + 8, y + 10, w - 8, w - 8);
  g.fillStyle = "#efe2c0";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 6);
  g.fill();
  // porte sur le mur du bas
  g.fillStyle = "#7a4e2a";
  g.fillRect(x + 20, y + w - 12, 24, 10);
  g.fillStyle = "#e6c264";
  g.fillRect(x + 38, y + w - 8, 3, 3);
  // toit : deux pans, le haut plus sombre, le bas plus clair
  const rx = x + 2;
  const rw = w - 4;
  g.fillStyle = "#b5523a";
  g.beginPath();
  g.roundRect(rx, y + 2, rw, (w - 14) / 2, [8, 8, 0, 0]);
  g.fill();
  g.fillStyle = "#cf6a4c";
  g.beginPath();
  g.roundRect(rx, y + 2 + (w - 14) / 2, rw, (w - 14) / 2, [0, 0, 8, 8]);
  g.fill();
  // rangées de tuiles
  g.strokeStyle = "rgba(90,30,20,0.35)";
  g.lineWidth = 1.5;
  g.beginPath();
  for (let k = 1; k < 8; k++) {
    const ty = y + 2 + (k * (w - 14)) / 8;
    g.moveTo(rx + 3, ty);
    g.lineTo(rx + rw - 3, ty);
  }
  g.stroke();
  // faîtage
  g.strokeStyle = "#7d3624";
  g.lineWidth = 4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(rx + 6, y + 2 + (w - 14) / 2);
  g.lineTo(rx + rw - 6, y + 2 + (w - 14) / 2);
  g.stroke();
  // cheminée en pierre
  const cx = x + w * 0.7;
  const cy = y + w * 0.18;
  g.fillStyle = "rgba(40,30,10,0.3)";
  g.fillRect(cx - 9, cy - 7, 24, 24);
  g.fillStyle = "#9b9a96";
  g.fillRect(cx - 12, cy - 12, 24, 24);
  g.fillStyle = "#4a4743";
  g.fillRect(cx - 7, cy - 7, 14, 14);
  g.strokeStyle = "#7c7b77";
  g.lineWidth = 2;
  g.strokeRect(cx - 12, cy - 12, 24, 24);
}

// Camp de bûcheron (2 × 2 cases) : sol piétiné, tente, tas de bûches, foyer et souche avec une hache.
function campBody(g: CanvasRenderingContext2D, gx: number, gy: number) {
  if (isViking()) {
    const v = variant(gx, gy);
    return P.blit(g, `camp:${v}`, gx, gy, 2, (c) => P.paintCamp(c, v * 137 + 11));
  }
  const x = gx * C;
  const y = gy * C;
  const w = 2 * C;
  // seuil de l'entrée : un tapis de terre et deux piquets sur le bord bas, côté gauche (la case d'entrée est juste en dessous)
  g.fillStyle = "#c9a96e";
  g.beginPath();
  g.roundRect(x + 10, y + w - 8, 44, 26, 8);
  g.fill();
  g.fillStyle = "#6d4527";
  for (const px of [12, 52]) {
    g.beginPath();
    g.arc(x + px, y + w - 4, 3.4, 0, Math.PI * 2);
    g.fill();
  }
  // sol piétiné
  g.fillStyle = "#b79a63";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 24);
  g.fill();
  g.strokeStyle = "#9c8049";
  g.lineWidth = 2;
  g.stroke();
  g.fillStyle = "rgba(120,90,45,0.35)";
  for (const [px, py] of [[22, 100], [58, 70], [100, 62], [14, 52], [88, 112], [66, 22]]) {
    g.beginPath();
    g.arc(x + px, y + py, 2.4, 0, Math.PI * 2);
    g.fill();
  }

  // tente (en haut à gauche) : deux pans, faîtage, entrée sur le côté
  g.fillStyle = "rgba(40,30,10,0.25)";
  g.fillRect(x + 20, y + 20, 66, 52);
  g.fillStyle = "#e6d29c";
  g.fillRect(x + 14, y + 14, 66, 26);
  g.fillStyle = "#cdb67c";
  g.fillRect(x + 14, y + 40, 66, 26);
  g.strokeStyle = "#8a7440";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(x + 14, y + 40);
  g.lineTo(x + 80, y + 40);
  g.stroke();
  g.fillStyle = "#5a4a2a";
  g.fillRect(x + 74, y + 31, 6, 18);
  g.fillStyle = "#6b4a2b";
  for (const [px, py] of [[12, 12], [82, 12], [12, 68], [82, 68]]) {
    g.beginPath();
    g.arc(x + px, y + py, 2.6, 0, Math.PI * 2);
    g.fill();
  }

  // souche et hache (en haut à droite)
  g.fillStyle = "rgba(40,30,10,0.25)";
  g.beginPath();
  g.ellipse(x + 104, y + 34, 13, 11, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#6b4a2b";
  g.beginPath();
  g.arc(x + 100, y + 30, 12, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#c79a64";
  g.beginPath();
  g.arc(x + 100, y + 30, 8.6, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#a8794a";
  g.lineWidth = 1;
  g.beginPath();
  g.arc(x + 100, y + 30, 4.4, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = "#7a4e2a";
  g.lineWidth = 3;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(x + 98, y + 28);
  g.lineTo(x + 118, y + 14);
  g.stroke();
  g.fillStyle = "#b9bdc4";
  g.beginPath();
  g.moveTo(x + 94, y + 20);
  g.lineTo(x + 104, y + 26);
  g.lineTo(x + 101, y + 34);
  g.lineTo(x + 92, y + 28);
  g.closePath();
  g.fill();

  // foyer (en bas à gauche) : cercle de pierres et braises
  const fx = x + 34;
  const fy = y + 96;
  g.fillStyle = "#3a2a22";
  g.beginPath();
  g.arc(fx, fy, 13, 0, Math.PI * 2);
  g.fill();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    g.fillStyle = i % 2 ? "#8d8f94" : "#a7aab2";
    g.beginPath();
    g.arc(fx + Math.cos(a) * 15, fy + Math.sin(a) * 15, 5.2, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#f08a24";
  g.beginPath();
  g.ellipse(fx, fy, 8, 6, 0.4, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#ffd34d";
  g.beginPath();
  g.ellipse(fx - 1, fy - 1, 4, 3, 0.4, 0, Math.PI * 2);
  g.fill();

  // tas de bûches (en bas à droite) : trois rangées, bouts clairs à gauche
  g.fillStyle = "rgba(40,30,10,0.25)";
  g.fillRect(x + 74, y + 90, 48, 36);
  const woods = ["#8a5a2e", "#9a6a3a", "#7c4f27"];
  for (let r = 0; r < 3; r++) {
    const ly = y + 86 + r * 12;
    g.fillStyle = woods[r];
    g.beginPath();
    g.roundRect(x + 70 + (r % 2) * 4, ly, 46, 11, 5);
    g.fill();
    g.fillStyle = "#d9b27a";
    g.beginPath();
    g.arc(x + 71 + (r % 2) * 4, ly + 5.5, 5.5, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#a8794a";
    g.lineWidth = 1;
    g.beginPath();
    g.arc(x + 71 + (r % 2) * 4, ly + 5.5, 2.6, 0, Math.PI * 2);
    g.stroke();
  }
}

// Dépôt (3 × 3 cases) : grand entrepôt au toit de planches, porte ouverte devant, caisses et tonneau dehors.
function depotBody(g: CanvasRenderingContext2D, gx: number, gy: number, level = 1, pantry = false) {
  if (isViking() && pantry) {
    const v = variant(gx, gy);
    return P.blit(g, `pantry:${v}:${level}`, gx, gy, 3, (c) => P.paintPantry(c, v * 227 + 73, level));
  }
  if (isViking()) {
    const v = variant(gx, gy);
    return P.blit(g, `depot:${v}:${level}`, gx, gy, 3, (c) => P.paintDepot(c, v * 173 + 37, level));
  }
  const x = gx * C;
  const y = gy * C;
  const w = 3 * C;
  // seuil de l'entrée : un tapis de terre et deux piquets sous la porte, dans la colonne du milieu
  g.fillStyle = "#c9a96e";
  g.beginPath();
  g.roundRect(x + C + 8, y + w - 8, C - 16, 26, 8);
  g.fill();
  g.fillStyle = "#6d4527";
  for (const px of [C + 10, 2 * C - 10]) {
    g.beginPath();
    g.arc(x + px, y + w - 4, 3.4, 0, Math.PI * 2);
    g.fill();
  }
  // cour de terre devant l'entrepôt
  g.fillStyle = "#b79a63";
  g.beginPath();
  g.roundRect(x + 3, y + 3, w - 6, w - 6, 22);
  g.fill();
  g.strokeStyle = "#9c8049";
  g.lineWidth = 2;
  g.stroke();

  // entrepôt : ombre, deux pans de toit, faîtage, lignes de planches
  const bx = x + 14;
  const by = y + 12;
  const bw = w - 28;
  const bh = 128;
  g.fillStyle = "rgba(40,30,10,0.28)";
  g.fillRect(bx + 8, by + 9, bw, bh);
  // le toit change avec le niveau : bois brun, tuiles rouges, ardoise bleutée
  g.fillStyle = level >= 3 ? "#6f7f93" : level === 2 ? "#b4603f" : "#9a6b42";
  g.fillRect(bx, by, bw / 2, bh);
  g.fillStyle = level >= 3 ? "#56657a" : level === 2 ? "#94492d" : "#7f5632";
  g.fillRect(bx + bw / 2, by, bw / 2, bh);
  g.strokeStyle = "rgba(40,25,10,0.28)";
  g.lineWidth = 1;
  for (let i = 1; i < 12; i++) {
    g.beginPath();
    g.moveTo(bx, by + (i * bh) / 12);
    g.lineTo(bx + bw, by + (i * bh) / 12);
    g.stroke();
  }
  g.strokeStyle = "#4e3320";
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(bx + bw / 2, by);
  g.lineTo(bx + bw / 2, by + bh);
  g.stroke();
  g.strokeStyle = level >= 3 ? "#d9b24a" : "#5a3d24";
  g.lineWidth = 3;
  g.strokeRect(bx, by, bw, bh);
  if (level >= 2) {
    // soubassement de pierre et pierres d'angle
    g.fillStyle = "#a9a49a";
    g.fillRect(bx - 2, by + bh - 12, bw + 4, 12);
    g.strokeStyle = "#6f6a60";
    g.lineWidth = 1.5;
    for (let k = 0; k <= 6; k++) {
      g.beginPath();
      g.moveTo(bx + (k * bw) / 6, by + bh - 12);
      g.lineTo(bx + (k * bw) / 6, by + bh);
      g.stroke();
    }
    g.strokeRect(bx - 2, by + bh - 12, bw + 4, 12);
  }
  if (level >= 3) {
    // fanion doré au sommet du toit
    g.strokeStyle = "#5a3d24";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(bx + bw / 2, by + 4);
    g.lineTo(bx + bw / 2, by - 26);
    g.stroke();
    g.fillStyle = "#d9b24a";
    g.beginPath();
    g.moveTo(bx + bw / 2, by - 26);
    g.lineTo(bx + bw / 2 + 24, by - 19);
    g.lineTo(bx + bw / 2, by - 12);
    g.closePath();
    g.fill();
  }

  // grande porte ouverte, au milieu du bord bas
  const dx = bx + bw / 2 - 26;
  g.fillStyle = "#2d2118";
  g.fillRect(dx, by + bh - 4, 52, 14);
  g.fillStyle = "#b98a52";
  g.fillRect(dx - 14, by + bh + 2, 16, 8);
  g.fillRect(dx + 50, by + bh + 2, 16, 8);
  g.strokeStyle = "#6d4527";
  g.lineWidth = 1.5;
  g.strokeRect(dx - 14, by + bh + 2, 16, 8);
  g.strokeRect(dx + 50, by + bh + 2, 16, 8);

  // caisses et tonneau dans la cour
  const crate = (cx: number, cy: number) => {
    g.fillStyle = "rgba(40,30,10,0.25)";
    g.fillRect(cx + 3, cy + 4, 24, 24);
    g.fillStyle = "#b98a52";
    g.fillRect(cx, cy, 24, 24);
    g.strokeStyle = "#7a5530";
    g.lineWidth = 2;
    g.strokeRect(cx, cy, 24, 24);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + 24, cy + 24);
    g.moveTo(cx + 24, cy);
    g.lineTo(cx, cy + 24);
    g.stroke();
  };
  crate(x + 20, by + bh + 20);
  crate(x + 48, by + bh + 26);
  g.fillStyle = "rgba(40,30,10,0.25)";
  g.beginPath();
  g.ellipse(x + w - 36, by + bh + 38, 14, 12, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#7a4e2a";
  g.beginPath();
  g.arc(x + w - 40, by + bh + 34, 13, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#4a2f18";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(x + w - 40, by + bh + 34, 9, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#a8794a";
  g.beginPath();
  g.arc(x + w - 40, by + bh + 34, 5, 0, Math.PI * 2);
  g.fill();
}

// ---------- chemins ----------

// Les chemins sont tracés d'un seul trait : chaque case est un disque relié à ses voisines, en trois passes
// (ombre, bord foncé, terre claire) pour que les virages et les carrefours soient continus.
// Une case de chemin « réaliste » dessinée une fois : terre granuleuse, ornières, cailloux, brins d'herbe, bords irréguliers. `mask` : voisins reliés (1 haut, 2 droite, 4 bas, 8 gauche).
const roadTiles = new Map<string, HTMLCanvasElement>();
function roadTile(mask: number, variant: number): HTMLCanvasElement {
  const key = `${mask}:${variant}`;
  let cv = roadTiles.get(key);
  if (cv) return cv;
  cv = document.createElement("canvas");
  cv.width = cv.height = C * 2;
  const t = cv.getContext("2d")!;
  themeContext(t);
  t.scale(2, 2);
  const r = P.prand(mask * 131 + variant * 977 + 7);
  const hw = 0.33 * C;
  // les rectangles du chemin dans la case (origine au centre)
  const rects: [number, number, number, number][] = [[-hw, -hw, hw, hw]];
  if (mask & 1) rects.push([-hw, -C / 2, hw, -hw]);
  if (mask & 2) rects.push([hw, -hw, C / 2, hw]);
  if (mask & 4) rects.push([-hw, hw, hw, C / 2]);
  if (mask & 8) rects.push([-C / 2, -hw, -hw, hw]);
  // distance (négative à l'intérieur) au chemin
  const dist = (x: number, y: number) => {
    let best = Infinity;
    for (const [x0, y0, x1, y1] of rects) {
      const dx = Math.max(x0 - x, 0, x - x1);
      const dy = Math.max(y0 - y, 0, y - y1);
      const d = dx || dy ? Math.hypot(dx, dy) : -Math.min(x - x0, x1 - x, y - y0, y1 - y);
      if (d < best) best = d;
    }
    return best;
  };
  t.translate(C / 2, C / 2);
  // bords irréguliers : des taches de terre qui mordent sur l'herbe, des touffes d'herbe qui mordent sur la terre
  for (let i = 0; i < 90; i++) {
    const x = (r() - 0.5) * (C - 8);
    const y = (r() - 0.5) * (C - 8);
    const d = dist(x, y);
    if (Math.abs(d) > 0.07 * C) continue;
    const rad = (0.03 + r() * 0.05) * C;
    if (x < -C / 2 + rad + 1 || x > C / 2 - rad - 1 || y < -C / 2 + rad + 1 || y > C / 2 - rad - 1) continue;
    t.fillStyle = d < 0 ? (r() < 0.55 ? "rgba(150,126,86,0.85)" : "rgba(104,150,70,0.55)") : r() < 0.7 ? "rgba(139,118,80,0.8)" : "rgba(104,150,70,0.6)";
    t.beginPath();
    t.ellipse(x, y, rad * 1.2, rad, r() * 3, 0, Math.PI * 2);
    t.fill();
  }
  // grain de la terre : une multitude de petits points clairs et sombres
  const tones = ["rgba(205,186,146,0.55)", "rgba(222,205,168,0.45)", "rgba(96,76,48,0.45)", "rgba(120,98,64,0.4)", "rgba(80,62,40,0.3)"];
  for (let i = 0; i < 150; i++) {
    const x = (r() - 0.5) * C;
    const y = (r() - 0.5) * C;
    if (dist(x, y) > -2) continue;
    t.fillStyle = tones[Math.floor(r() * tones.length)];
    const s = 0.6 + r() * 1.4;
    t.fillRect(x, y, s, s * (0.6 + r() * 0.8));
  }
  // les ornières, un peu irrégulières, avec un reflet de terre humide
  const rut = (x0: number, y0: number, x1: number, y1: number, wob: number) => {
    const mx = (x0 + x1) / 2 + wob * (Math.abs(y1 - y0) > Math.abs(x1 - x0) ? 1 : 0);
    const my = (y0 + y1) / 2 + wob * (Math.abs(x1 - x0) > Math.abs(y1 - y0) ? 1 : 0);
    t.strokeStyle = "rgba(72,54,32,0.5)";
    t.lineWidth = 3.2;
    t.lineCap = "round";
    t.beginPath();
    t.moveTo(x0, y0);
    t.quadraticCurveTo(mx, my, x1, y1);
    t.stroke();
    t.strokeStyle = "rgba(190,170,130,0.35)";
    t.lineWidth = 1.2;
    t.beginPath();
    t.moveTo(x0 + (y0 === y1 ? 0 : 2), y0 + (y0 === y1 ? 2 : 0));
    t.quadraticCurveTo(mx + (y0 === y1 ? 0 : 2), my + (y0 === y1 ? 2 : 0), x1 + (y0 === y1 ? 0 : 2), y1 + (y0 === y1 ? 2 : 0));
    t.stroke();
  };
  const o = 0.17 * C;
  const L = C / 2;
  const horiz = mask & 10;
  const vert = mask & 5;
  for (const s of [-o, o]) {
    const wob = (r() - 0.5) * 4;
    if (horiz) rut(mask & 8 ? -L : 0, s, mask & 2 ? L : 0, s, wob);
    if (vert) rut(s, mask & 1 ? -L : 0, s, mask & 4 ? L : 0, wob);
    if (!horiz && !vert) rut(-6, s, 6, s, 0);
  }
  // l'herbe qui pousse entre les ornières
  for (let i = 0; i < 5; i++) {
    const x = (r() - 0.5) * 0.3 * C;
    const y = (r() - 0.5) * 0.3 * C;
    if (dist(x, y) > -3) continue;
    t.strokeStyle = "rgba(98,146,62,0.75)";
    t.lineWidth = 1.2;
    t.beginPath();
    t.moveTo(x, y + 2);
    t.lineTo(x + (r() - 0.5) * 3, y - 2 - r() * 3);
    t.stroke();
  }
  // cailloux
  const stones = ["#7e7a70", "#9a9488", "#b8b0a0", "#6d5a40", "#cfc6b0"];
  for (let i = 0; i < 7; i++) {
    const x = (r() - 0.5) * C * 0.9;
    const y = (r() - 0.5) * C * 0.9;
    if (dist(x, y) > -3) continue;
    const rad = 0.9 + r() * 2;
    t.fillStyle = "rgba(30,20,8,0.28)";
    t.beginPath();
    t.ellipse(x + 0.8, y + 1.1, rad * 1.2, rad, 0, 0, Math.PI * 2);
    t.fill();
    t.fillStyle = stones[Math.floor(r() * stones.length)];
    t.beginPath();
    t.ellipse(x, y, rad * 1.2, rad, r() * 3, 0, Math.PI * 2);
    t.fill();
  }
  roadTiles.set(key, cv);
  return cv;
}

// Les autres styles de chemins (au choix dans ☰ Menu).
function drawRoadsAlt(g: CanvasRenderingContext2D, style: string, cells: [number, number][], has: (gx: number, gy: number) => boolean, stub: (gx: number, gy: number) => number) {
  const hashOf = (gx: number, gy: number, k = 0) => {
    let h = (gx * 73856093) ^ (gy * 19349663) ^ (k * 83492791);
    return () => {
      h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
  };
  g.lineCap = "round";
  g.lineJoin = "round";
  const segments = (width: number, color: string, dx = 0, dy = 0, off = 0) => {
    g.save();
    g.translate(dx, dy);
    g.strokeStyle = color;
    g.lineWidth = width * C;
    g.beginPath();
    for (const [gx, gy] of cells) {
      const x = (gx + 0.5) * C;
      const y = (gy + 0.5) * C;
      if (!off) {
        g.moveTo(x, y);
        g.lineTo(x + 0.01, y);
      }
      if (has(gx + 1, gy)) for (const o of off ? [-off, off] : [0]) { g.moveTo(x, y + o * C); g.lineTo(x + C, y + o * C); }
      if (has(gx, gy + 1)) for (const o of off ? [-off, off] : [0]) { g.moveTo(x + o * C, y); g.lineTo(x + o * C, y + C); }

    const sb = stub(gx, gy);
    if (sb) {
      for (const [bit, dx, dy] of [[1, 0, -1], [2, 1, 0], [4, 0, 1], [8, -1, 0]] as [number, number, number][]) {
        if (!(sb & bit)) continue;
        for (const o of (off ? [-off, off] : [0])) {
          if (dx === 0) { g.moveTo(x + o * C, y); g.lineTo(x + o * C, y + (dy * C) / 2); }
          else { g.moveTo(x, y + o * C); g.lineTo(x + (dx * C) / 2, y + o * C); }
        }
      }
    }
    }
    g.stroke();
    g.restore();
  };
  if (style === "realiste") {
    // la bande de terre : bords doux en plusieurs couches, puis chaque case reçoit sa texture
    segments(1.0, "rgba(120,140,70,0.14)");
    segments(0.9, "rgba(130,122,72,0.24)");
    segments(0.76, "#8b7650");
    segments(0.68, "#a28a62");
    for (const [gx, gy] of cells) {
      const mask = (has(gx, gy - 1) ? 1 : 0) | (has(gx + 1, gy) ? 2 : 0) | (has(gx, gy + 1) ? 4 : 0) | (has(gx - 1, gy) ? 8 : 0) | stub(gx, gy);
      g.drawImage(roadTile(mask, hashOf(gx, gy, 12)() < 0.5 ? 0 : hashOf(gx, gy, 13)() < 0.5 ? 1 : 2), gx * C, gy * C, C, C);
    }
    return;
  }
  if (style === "poudre") {
    // une piste nette de terre claire aux bords doux
    segments(1.0, "rgba(176,170,96,0.30)");
    segments(0.86, "#cdbf94");
    segments(0.72, "#d6c9a0");
    segments(0.5, "#dcd0aa");
    for (const [gx, gy] of cells) {
      const r = hashOf(gx, gy, 2);
      for (let i = 0; i < 2; i++) {
        g.fillStyle = "rgba(255,250,225,0.35)";
        g.beginPath();
        g.ellipse((gx + 0.2 + r() * 0.6) * C, (gy + 0.2 + r() * 0.6) * C, (0.07 + r() * 0.08) * C, (0.04 + r() * 0.05) * C, r() * 3, 0, Math.PI * 2);
        g.fill();
      }
    }
  } else if (style === "traces") {
    // presque rien : deux traces de roues qui usent l'herbe, avec la bande du milieu un peu éclaircie
    segments(0.5, "rgba(158,176,92,0.45)");
    segments(0.1, "rgba(122,98,62,0.85)", 0, 0, 0.19);
    segments(0.05, "rgba(86,66,40,0.55)", 0, 0, 0.19);
    for (const [gx, gy] of cells) {
      const r = hashOf(gx, gy, 4);
      if (r() < 0.7) {
        g.fillStyle = ["#8f8c80", "#a8a292", "#7d6a4c"][Math.floor(r() * 3)];
        g.beginPath();
        g.ellipse((gx + 0.25 + r() * 0.5) * C, (gy + 0.2 + r() * 0.6) * C, (0.02 + r() * 0.025) * C, (0.015 + r() * 0.02) * C, r() * 3, 0, Math.PI * 2);
        g.fill();
      }
    }
  } else if (style === "pave") {
    // des pavés de pierre irréguliers, la mousse sur les bords
    for (const [gx, gy] of cells) {
      const r = hashOf(gx, gy, 6);
      const edge = (dx: number, dy: number) => !has(gx + dx, gy + dy);
      g.fillStyle = "rgba(30,30,20,0.20)";
      g.fillRect(gx * C + 5, gy * C + 7, C - 6, C - 6);
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 4; i++) {
          const border = (i === 0 && edge(-1, 0)) || (i === 3 && edge(1, 0)) || (j === 0 && edge(0, -1)) || (j === 3 && edge(0, 1));
          if (border && r() < 0.4) continue;
          const tone = 128 + Math.floor(r() * 42);
          const sx = gx * C + i * 16 + (r() - 0.5) * 2;
          const sy = gy * C + j * 16 + (r() - 0.5) * 2;
          g.fillStyle = `rgb(${tone},${tone - 4},${tone - 14})`;
          g.beginPath();
          g.roundRect(sx + 1, sy + 1, 13.5 + (r() - 0.5) * 2, 13.5 + (r() - 0.5) * 2, 4);
          g.fill();
          g.strokeStyle = "rgba(50,45,35,0.55)";
          g.lineWidth = 1;
          g.stroke();
        }
      }
      for (let i = 0; i < 2; i++) {
        g.fillStyle = "rgba(96,140,64,0.35)";
        g.beginPath();
        g.ellipse((gx + r()) * C, (gy + r()) * C, (0.05 + r() * 0.07) * C, (0.04 + r() * 0.05) * C, r() * 3, 0, Math.PI * 2);
        g.fill();
      }
    }
  } else {
    // une passerelle de planches posées en travers
    segments(0.78, "rgba(20,12,4,0.28)", 2, 3);
    segments(0.78, "#5a3d1c");
    for (const [gx, gy] of cells) {
      const r = hashOf(gx, gy, 8);
      const horiz = has(gx - 1, gy) || has(gx + 1, gy);
      const vert = has(gx, gy - 1) || has(gx, gy + 1);
      const drawPlanks = (alongX: boolean) => {
        for (let k = 0; k < 6; k++) {
          const tone = 122 + Math.floor(r() * 30);
          g.fillStyle = `rgb(${tone + 24},${tone - 8},${tone - 52})`;
          const p = k * (C / 6);
          if (alongX) g.fillRect(gx * C + p + 0.6, gy * C + 0.13 * C, C / 6 - 1.2, 0.74 * C);
          else g.fillRect(gx * C + 0.13 * C, gy * C + p + 0.6, 0.74 * C, C / 6 - 1.2);
        }
      };
      if (horiz || !vert) drawPlanks(true);
      if (vert) drawPlanks(false);
      g.fillStyle = "#2f1d0e"; // clous
      for (const [nx, ny] of [[0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) g.fillRect((gx + nx) * C - 1, (gy + ny) * C - 1, 2, 2);
    }
    segments(0.04, "#2f1d0e", 0, 0, 0.37);
  }
}

// Les chemins du thème viking : une piste discrète d'herbe usée et de terre claire, qui serpente (les tronçons se courbent et leur largeur varie),
// avec des plaques d'herbe qui repoussent, quelques cailloux et des brins d'herbe sur les bords.
function drawRoadsPainted(g: CanvasRenderingContext2D, has: (gx: number, gy: number) => boolean, cells: [number, number][], stub: (gx: number, gy: number) => number) {
  const style = getRoadStyle();
  if (style !== "terre") return drawRoadsAlt(g, style, cells, has, stub);
  const hashOf = (gx: number, gy: number, k = 0) => {
    let h = (gx * 73856093) ^ (gy * 19349663) ^ (k * 83492791);
    return () => {
      h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
  };
  // le centre de chaque case est décalé un peu (le même pour tous les tronçons qui y arrivent)
  const centre = (gx: number, gy: number): [number, number] => {
    const r = hashOf(gx, gy, 3);
    return [(gx + 0.5 + (r() - 0.5) * 0.12) * C, (gy + 0.5 + (r() - 0.5) * 0.12) * C];
  };
  interface Seg {
    ax: number;
    ay: number;
    cx: number;
    cy: number;
    bx: number;
    by: number;
    wf: number;
  }
  const segs: Seg[] = [];
  const dots: { x: number; y: number; wf: number }[] = [];
  for (const [gx, gy] of cells) {
    const [ax, ay] = centre(gx, gy);
    dots.push({ x: ax, y: ay, wf: 0.8 + hashOf(gx, gy, 5)() * 0.4 });
    const sb = stub(gx, gy); // le chemin se prolonge jusqu'à la porte du bâtiment
    for (const [bit, dx, dy] of [[1, 0, -1], [2, 1, 0], [4, 0, 1], [8, -1, 0]] as [number, number, number][]) {
      if (sb & bit) segs.push({ ax, ay, cx: ax + (dx * C) / 4, cy: ay + (dy * C) / 4, bx: ax + (dx * C) / 2, by: ay + (dy * C) / 2, wf: 1 });
    }
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      if (!has(gx + dx, gy + dy)) continue;
      const [bx, by] = centre(gx + dx, gy + dy);
      const r = hashOf(gx * 2 + dx, gy * 2 + dy, 9);
      const off = (r() - 0.5) * 0.12 * C; // le tronçon se courbe très légèrement de côté
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const nx = -(by - ay);
      const ny = bx - ax;
      const nl = Math.hypot(nx, ny) || 1;
      segs.push({ ax, ay, cx: mx + (nx / nl) * off, cy: my + (ny / nl) * off, bx, by, wf: 0.8 + r() * 0.4 });
    }
  }
  g.lineCap = "round";
  const pass = (color: string, width: number) => {
    g.strokeStyle = color;
    g.fillStyle = color;
    for (const s of segs) {
      g.lineWidth = width * C * s.wf;
      g.beginPath();
      g.moveTo(s.ax, s.ay);
      g.quadraticCurveTo(s.cx, s.cy, s.bx, s.by);
      g.stroke();
    }
    for (const d of dots) {
      g.beginPath();
      g.arc(d.x, d.y, (width * C * d.wf) / 2, 0, Math.PI * 2);
      g.fill();
    }
  };
  pass("#a9b46a", 0.94); // transition : l'herbe usée
  pass("#b3a572", 0.76); // la terre
  pass("#bdac7e", 0.54); // le milieu, plus clair
  // plaques claires, plaques d'herbe qui repoussent, cailloux, brins d'herbe
  const tones = ["#8f8c80", "#a8a292", "#bdb5a2", "#7d6a4c"];
  for (const [gx, gy] of cells) {
    const r = hashOf(gx, gy, 11);
    const [cx, cy] = centre(gx, gy);
    for (let i = 0; i < 3; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(214,196,150,0.30)" : "rgba(120,100,62,0.16)";
      g.beginPath();
      g.ellipse(cx + (r() - 0.5) * 0.6 * C, cy + (r() - 0.5) * 0.6 * C, (0.08 + r() * 0.12) * C, (0.05 + r() * 0.08) * C, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    if (r() < 0.55) { // l'herbe qui repousse au milieu : le chemin est irrégulier
      g.fillStyle = "rgba(140,180,84,0.5)";
      g.beginPath();
      g.ellipse(cx + (r() - 0.5) * 0.5 * C, cy + (r() - 0.5) * 0.5 * C, (0.07 + r() * 0.1) * C, (0.04 + r() * 0.06) * C, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 2; i++) {
      const x = cx + (r() - 0.5) * 0.7 * C;
      const y = cy + (r() - 0.5) * 0.7 * C;
      const rad = (0.02 + r() * 0.03) * C;
      g.fillStyle = "rgba(30,20,8,0.22)";
      g.beginPath();
      g.ellipse(x + 1, y + 1.2, rad * 1.3, rad, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = tones[Math.floor(r() * tones.length)];
      g.beginPath();
      g.ellipse(x, y, rad * 1.3, rad, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    if (r() < 0.6) {
      g.strokeStyle = "#5f9442";
      g.lineWidth = 1.6;
      const bx = cx + (r() - 0.5) * 0.95 * C;
      const by = cy + (r() - 0.5) * 0.95 * C;
      for (let b = -1; b <= 1; b++) {
        g.beginPath();
        g.moveTo(bx + b * 3, by + 3);
        g.lineTo(bx + b * 4.5, by - 3.5 - r() * 3);
        g.stroke();
      }
    }
  }
}

export function drawRoads(g: CanvasRenderingContext2D, roads: Record<number, 1>, grid: number, view: { x0: number; y0: number; x1: number; y1: number }, entrances: [number, number, number][] = []) {
  const gx0 = Math.max(0, Math.floor(view.x0 / C) - 1);
  const gx1 = Math.min(grid - 1, Math.floor(view.x1 / C) + 1);
  const gy0 = Math.max(0, Math.floor(view.y0 / C) - 1);
  const gy1 = Math.min(grid - 1, Math.floor(view.y1 / C) + 1);
  const cells: [number, number][] = [];
  for (let gy = gy0; gy <= gy1; gy++) for (let gx = gx0; gx <= gx1; gx++) if (roads[gy * grid + gx]) cells.push([gx, gy]);
  // thème viking : devant chaque porte, un peu de terre battue, même sans chemin, pour que l'entrée se voie toujours
  const aprons = new Set<number>();
  const stubs = new Map<number, number>(); // côté du bâtiment, pour chaque case de porte : le chemin se prolonge jusqu'à la porte
  if (isViking()) {
    for (const [ex, ey, rot] of entrances) {
      if (ex < gx0 || ex > gx1 || ey < gy0 || ey > gy1) continue;
      const k = ey * grid + ex;
      stubs.set(k, ((stubs.get(k) ?? 0) | [1, 2, 4, 8][((rot % 4) + 4) % 4]));
      if (roads[k] || aprons.has(k)) continue;
      aprons.add(k);
      cells.push([ex, ey]);
    }
  }
  if (!cells.length) return;
  g.lineCap = "round";
  g.lineJoin = "round";
  if (isViking()) return drawRoadsPainted(g, (gx, gy) => gx >= 0 && gy >= 0 && gx < grid && gy < grid && (!!roads[gy * grid + gx] || aprons.has(gy * grid + gx)), cells, (gx, gy) => stubs.get(gy * grid + gx) ?? 0);
  const passes: [string, number, number][] = [
    ["rgba(110,140,50,0.28)", 1.04, 0], // lisière : l'herbe piétinée autour du chemin
    ["rgba(60,40,10,0.22)", 0.86, 1],
    ["#a98650", 0.86, 0],
    ["#d6b983", 0.7, 0],
    ["#e2c995", 0.46, 0],
  ];
  for (const [color, width, shadow] of passes) {
    g.save();
    if (shadow) g.translate(3, 4);
    g.strokeStyle = color;
    g.lineWidth = width * C;
    g.beginPath();
    for (const [gx, gy] of cells) {
      const x = (gx + 0.5) * C;
      const y = (gy + 0.5) * C;
      g.moveTo(x, y);
      g.lineTo(x + 0.01, y); // un point : avec le bout arrondi, c'est un disque
      if (roads[gy * grid + gx + 1] && gx + 1 < grid) {
        g.moveTo(x, y);
        g.lineTo(x + C, y);
      }
      if (roads[(gy + 1) * grid + gx]) {
        g.moveTo(x, y);
        g.lineTo(x, y + C);
      }
    }
    g.stroke();
    g.restore();
  }
  // cailloux et brins d'herbe, toujours aux mêmes endroits (tirés du numéro de la case)
  for (const [gx, gy] of cells) {
    let h = (gx * 73856093) ^ (gy * 19349663);
    const rnd = () => {
      h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < 3; i++) {
      const x = (gx + 0.22 + rnd() * 0.56) * C;
      const y = (gy + 0.22 + rnd() * 0.56) * C;
      const r = (0.035 + rnd() * 0.04) * C;
      g.fillStyle = rnd() < 0.5 ? "#9a7a4a" : "#f0dfb4";
      g.beginPath();
      g.ellipse(x, y, r * 1.3, r, rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }
    if (rnd() < 0.35) {
      g.strokeStyle = "#7fae4c";
      g.lineWidth = 2;
      const x = (gx + 0.5 + (rnd() - 0.5) * 0.9) * C;
      const y = (gy + 0.5 + (rnd() - 0.5) * 0.9) * C;
      g.beginPath();
      g.moveTo(x - 3, y + 3);
      g.lineTo(x, y - 3);
      g.lineTo(x + 3, y + 3);
      g.stroke();
    }
  }
}

// Une case de chemin isolée (aperçu de pose).
export function drawRoadCell(g: CanvasRenderingContext2D, gx: number, gy: number) {
  const x = (gx + 0.5) * C;
  const y = (gy + 0.5) * C;
  for (const [color, width] of [["#9c7a46", 0.86], ["#cfae74", 0.68]] as [string, number][]) {
    g.fillStyle = color;
    g.beginPath();
    g.arc(x, y, (width * C) / 2, 0, Math.PI * 2);
    g.fill();
  }
}

// Vignette d'une structure dans la barre de construction.
export function drawStructureThumb(canvas: HTMLCanvasElement, id: string) {
  const g = canvas.getContext("2d")!;
  themeContext(g);
  g.clearRect(0, 0, canvas.width, canvas.height);
  const def = STRUCTURES[id];
  const size = def.kind === "road" ? 2.2 : def.size + 0.3;
  const k = canvas.width / (C * size);
  g.save();
  g.scale(k, k);
  g.fillStyle = "#a3ca63";
  g.fillRect(0, 0, C * size, C * size);
  if (def.kind === "road") {
    // deux cases de chemin en ligne, au centre
    g.translate(0.1 * C, 0.6 * C);
    drawRoads(g, { 0: 1, 1: 1 }, 64, { x0: 0, y0: 0, x1: 2 * C, y1: C });
  } else {
    g.translate(0.15 * C, 0.15 * C);
    if (def.kind === "camp") drawCamp(g, 0, 0);
    else if (def.kind === "house") drawHouse(g, 0, 0, false, 0);
    else if (def.kind === "sawmill") drawSawmill(g, 0, 0, false, 0);
    else if (def.kind === "well") drawWell(g, 0, 0);
    else if (def.kind === "lodge") drawLodge(g, 0, 0);
    else if (def.kind === "butcher") drawButcher(g, 0, 0, false, 0);
    else if (def.kind === "port") drawPort(g, 0, 0);
    else if (def.kind === "apiary") drawApiary(g, 0, 0, false, 0);
    else if (def.kind === "clinic") drawClinic(g, 0, 0);
    else if (def.kind === "church") drawChurch(g, 0, 0);
    else if (def.kind === "farm") drawFarm(g, 0, 0);
    else if (def.kind === "stable") drawStable(g, 0, 0, 0, [{ eat: 0, drink: 0 }, { eat: 0, drink: 0 }]);
    else if (def.kind === "market") drawMarket(g, 0, 0, 0, true);
    else if (def.kind === "shipyard") drawShipyard(g, 0, 0, 0, 4);
    else if (def.kind === "tavern") drawTavern(g, 0, 0, 0, true);
    else if (def.kind === "pantry") drawDepot(g, 0, 0, 0, 1, true);
    else if (def.kind === "pigpen") drawPigpen(g, 0, 0, 0, [{ age: 300, eat: 0, drink: 0 }, { age: 100, eat: 0, drink: 0 }, { age: 300, eat: 0, drink: 0 }]);
    else drawDepot(g, 0, 0);
  }
  g.restore();
}

// Repère d'entrée : une flèche pulsante vers le bâtiment, jaune tant qu'aucun chemin n'y arrive, verte une fois reliée.
export function drawEntrance(g: CanvasRenderingContext2D, gx: number, gy: number, linked: boolean, t: number, rot = 0) {
  const cx = (gx + 0.5) * C;
  const cy = (gy + 0.5) * C;
  const pulse = 0.5 + 0.5 * Math.sin(t / 220);
  const r = C * (0.26 + 0.04 * pulse);
  g.save();
  g.translate(cx, cy);
  g.rotate((rot * Math.PI) / 2);
  g.fillStyle = linked ? "rgba(107,207,99,0.9)" : "rgba(255,211,77,0.95)";
  g.strokeStyle = "#4a3b2a";
  g.lineWidth = 3;
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(0, -r); // la pointe regarde vers le bâtiment (en haut)
  g.lineTo(r, r * 0.7);
  g.lineTo(0, r * 0.25);
  g.lineTo(-r, r * 0.7);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}

// Chantier : fondations posées, puis le bâtiment qui monte à mesure que la construction avance.
// have/need : bois livré ; progress : de 0 à 1 une fois les matériaux réunis.
export function drawSite(g: CanvasRenderingContext2D, kind: "camp" | "depot" | "house" | "sawmill" | "well" | "lodge" | "butcher" | "port" | "apiary" | "clinic" | "church" | "farm" | "stable" | "pigpen" | "market" | "shipyard" | "tavern" | "pantry", gx: number, gy: number, have: number, need: number, progress: number, t: number, rot = 0, undo = false, plank = false) {
  const size = kind === "farm" ? 5 : kind === "shipyard" ? 6 : kind === "stable" || kind === "pigpen" ? 4 : kind === "depot" || kind === "pantry" || kind === "sawmill" || kind === "butcher" || kind === "port" || kind === "church" || kind === "market" || kind === "tavern" ? 3 : 2;
  const x = gx * C;
  const y = gy * C;
  const w = size * C;
  // fondations : dalle de terre battue bordée de planches
  g.fillStyle = "rgba(60,40,20,0.28)";
  g.fillRect(x + 4, y + 6, w, w);
  g.fillStyle = "#b9a27a";
  g.fillRect(x, y, w, w);
  g.fillStyle = "#a58d65";
  for (let i = 1; i < size * 2; i++) {
    g.fillRect(x + (i * C) / 2 - 1, y, 2, w);
    g.fillRect(x, y + (i * C) / 2 - 1, w, 2);
  }
  g.strokeStyle = "#7a5a34";
  g.lineWidth = 5;
  g.strokeRect(x + 2.5, y + 2.5, w - 5, w - 5);
  g.fillStyle = "#7a5a34";
  for (const [cx, cy] of [[0, 0], [w, 0], [0, w], [w, w]]) g.fillRect(x + cx - 5, y + cy - 5, 10, 10);

  // le bâtiment monte par le bas, en transparence
  if (progress > 0) {
    g.save();
    g.beginPath();
    g.rect(x - 8, y + w * (1 - progress), w + 16, w * progress + 8);
    g.clip();
    g.globalAlpha = 0.85;
    if (kind === "camp") drawCamp(g, gx, gy, rot);
    else if (kind === "house") drawHouse(g, gx, gy, false, 0, rot);
    else if (kind === "sawmill") drawSawmill(g, gx, gy, false, 0, rot);
    else if (kind === "well") drawWell(g, gx, gy, rot);
    else if (kind === "lodge") drawLodge(g, gx, gy, rot);
    else if (kind === "butcher") drawButcher(g, gx, gy, false, 0, rot);
    else if (kind === "port") drawPort(g, gx, gy, rot);
    else if (kind === "apiary") drawApiary(g, gx, gy, false, 0, rot);
    else if (kind === "clinic") drawClinic(g, gx, gy, rot);
    else if (kind === "church") drawChurch(g, gx, gy, rot);
    else if (kind === "farm") drawFarm(g, gx, gy, rot);
    else if (kind === "stable") drawStable(g, gx, gy, rot);
    else if (kind === "pigpen") drawPigpen(g, gx, gy, rot);
    else if (kind === "market") drawMarket(g, gx, gy, rot);
    else if (kind === "shipyard") drawShipyard(g, gx, gy, rot);
    else if (kind === "tavern") drawTavern(g, gx, gy, rot);
    else if (kind === "pantry") drawDepot(g, gx, gy, rot, 1, true);
    else drawDepot(g, gx, gy, rot);
    g.restore();
    g.globalAlpha = 1;
    // échafaudage : ligne de coupe
    g.strokeStyle = "#7a5a34";
    g.lineWidth = 3;
    const ly = y + w * (1 - progress);
    g.beginPath();
    g.moveTo(x - 6, ly);
    g.lineTo(x + w + 6, ly);
    g.stroke();
  } else if (need > 0) {
    // tas de bûches : une bûche par bois livré
    for (let i = 0; i < Math.min(have, 12); i++) {
      const lx = x + w * 0.18 + (i % 4) * C * 0.28;
      const ly = y + w * 0.2 + Math.floor(i / 4) * C * 0.22;
      g.fillStyle = i % 2 ? "#8a5a2e" : "#9a6a3a";
      g.beginPath();
      g.roundRect(lx, ly, C * 0.3, C * 0.15, 5);
      g.fill();
      g.fillStyle = "#d9b27a";
      g.beginPath();
      g.arc(lx + C * 0.3 - 3, ly + C * 0.075, 3.5, 0, Math.PI * 2);
      g.fill();
    }
  }

  // jauge : matériaux (bois) puis construction
  const bw = w * 0.8;
  const bx = x + (w - bw) / 2;
  const by = y - 16;
  g.fillStyle = "rgba(40,28,14,0.8)";
  g.beginPath();
  g.roundRect(bx - 3, by - 3, bw + 6, 20, 6);
  g.fill();
  const frac = need > 0 && have < need ? have / need : progress;
  g.fillStyle = have < need ? "#d9a441" : "#7bc25a";
  g.fillRect(bx, by + 8, bw * frac, 6);
  g.fillStyle = "rgba(255,255,255,0.18)";
  g.fillRect(bx + bw * frac, by + 8, bw * (1 - frac), 6);
  g.font = "bold 11px 'Trebuchet MS', sans-serif";
  g.textAlign = "center";
  g.fillStyle = "#fff6e0";
  const label = undo ? `🧰 Démontage ${Math.floor(progress * 100)}%` : need > 0 && have < need ? `${plank ? "🪚" : "🪵"} ${have}/${need}` : progress > 0 ? `🔨 ${Math.floor(progress * 100)}%` : "à construire";
  g.fillText(label, bx + bw / 2, by + 6 + (Math.sin(t / 400) > 2 ? 1 : 0));
}
