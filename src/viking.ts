// Décor du thème viking : boucliers ronds, bannière, tête de dragon, pierres runiques, et le drakkar du port.
// (Tout ceci n'est dessiné que si le thème viking est actif : voir theme.ts.)
const C = 64; // pixels du monde par case (comme dans draw.ts)

const SHIELDS = ["#a8322d", "#c9972f", "#2f5f8a", "#e6d9b8"];

function shield(g: CanvasRenderingContext2D, x: number, y: number, r: number, i: number) {
  g.fillStyle = "rgba(20,10,5,0.3)";
  g.beginPath();
  g.arc(x + 1.5, y + 2, r, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = SHIELDS[i % SHIELDS.length];
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#2a1a10";
  g.lineWidth = 2;
  g.stroke();
  // croix en bois du bouclier et son umbo de fer
  g.strokeStyle = "rgba(255,240,210,0.55)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(x - r * 0.75, y);
  g.lineTo(x + r * 0.75, y);
  g.moveTo(x, y - r * 0.75);
  g.lineTo(x, y + r * 0.75);
  g.stroke();
  g.fillStyle = "#b9bec6";
  g.beginPath();
  g.arc(x, y, r * 0.3, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#4a4f57";
  g.lineWidth = 1;
  g.stroke();
}

// Une tête de dragon sculptée au bout d'un pignon (regarde vers `dir` : 1 à droite, -1 à gauche).
function dragonHead(g: CanvasRenderingContext2D, x: number, y: number, dir: number) {
  g.save();
  g.translate(x, y);
  g.scale(dir, 1);
  g.fillStyle = "#3a2415";
  g.strokeStyle = "#1c1008";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(0, 8);
  g.quadraticCurveTo(-2, -2, 6, -6); // le cou qui se dresse
  g.quadraticCurveTo(12, -12, 18, -8); // le crâne
  g.lineTo(23, -5); // le museau
  g.lineTo(17, -3);
  g.lineTo(20, 0); // la gueule
  g.lineTo(12, 0);
  g.quadraticCurveTo(8, 4, 8, 8);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = "#e8c24e"; // l'œil
  g.beginPath();
  g.arc(13, -6, 1.5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#e6d9b8"; // la crête
  g.beginPath();
  g.moveTo(7, -7);
  g.lineTo(9, -13);
  g.lineTo(11, -8);
  g.closePath();
  g.fill();
  g.restore();
}

// Une pierre runique.
function runeStone(g: CanvasRenderingContext2D, x: number, y: number, rune: string) {
  g.fillStyle = "rgba(20,15,10,0.3)";
  g.beginPath();
  g.ellipse(x + 3, y + 9, 10, 5, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#8d939c";
  g.beginPath();
  g.roundRect(x - 8, y - 12, 16, 22, [8, 8, 3, 3]);
  g.fill();
  g.strokeStyle = "#4a4f57";
  g.lineWidth = 1.5;
  g.stroke();
  g.fillStyle = "#e8d9a8";
  g.font = "bold 13px serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(rune, x, y - 1);
  g.textBaseline = "alphabetic";
}

export type DecoKind = "house" | "depot" | "camp" | "sawmill" | "well" | "lodge" | "butcher" | "port" | "apiary" | "clinic" | "church" | "farm" | "stable" | "pigpen" | "market" | "tavern";

// Décore un bâtiment de `size` cases dont le coin haut-gauche est (gx, gy).
export function drawVikingDeco(g: CanvasRenderingContext2D, kind: DecoKind, gx: number, gy: number, size: number, t: number) {
  const x = gx * C;
  const y = gy * C;
  const w = size * C;
  g.save();
  // une rangée de boucliers ronds accrochés sous le bord du haut
  if (kind !== "well" && kind !== "port") {
    const n = size >= 4 ? 5 : size === 3 ? 4 : 2;
    const r = size >= 3 ? 9 : 8;
    for (let i = 0; i < n; i++) shield(g, x + ((i + 1) * w) / (n + 1), y + (size >= 3 ? 0.17 : 0.2) * C, r, i + gx);
  }
  // une bannière rouge qui claque au vent, au coin du haut
  const px = x + w - 5;
  const py = y + 3;
  g.strokeStyle = "#2a1a10";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(px, py + 34);
  g.lineTo(px, py - 4);
  g.stroke();
  const wave = Math.sin(t / 260 + gx) * 3;
  g.fillStyle = "#a8322d";
  g.beginPath();
  g.moveTo(px, py - 2);
  g.quadraticCurveTo(px - 12, py + 2 + wave, px - 24, py - 1 + wave);
  g.lineTo(px - 19, py + 7 + wave);
  g.lineTo(px - 24, py + 15 + wave);
  g.quadraticCurveTo(px - 12, py + 12 + wave, px, py + 14);
  g.closePath();
  g.fill();
  g.strokeStyle = "#e6d9b8";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(px - 4, py + 5);
  g.lineTo(px - 14, py + 4 + wave * 0.7);
  g.stroke();
  // tête de dragon aux pignons des grandes maisons
  if (kind === "house" || kind === "depot" || kind === "stable" || kind === "pigpen" || kind === "tavern" || kind === "church" || kind === "lodge") dragonHead(g, x + 4, y + 0.1 * C + 8, 1);
  // pierres runiques à l'entrée des lieux sacrés et du port
  if (kind === "church") {
    runeStone(g, x - 12, y + w - 18, "ᛟ");
    runeStone(g, x + w + 12, y + w - 18, "ᚦ");
  } else if (kind === "port") {
    runeStone(g, x - 8, y + w - 10, "ᚨ");
  } else if (kind === "well") {
    runeStone(g, x + w + 4, y + w - 8, "ᚱ");
  }
  g.restore();
}

// Le drakkar : coque effilée, proue en tête de dragon, voile carrée rayée, boucliers le long du bord. Dessiné dans le repère du bateau (l'avant vers +x).
export function drawLongship(g: CanvasRenderingContext2D, L: number, W: number, time: number) {
  g.fillStyle = "rgba(10,40,70,0.3)";
  g.beginPath();
  g.ellipse(5, 6, L * 1.05, W * 0.9, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(0, 0, L * 1.15, W * 1.1, 0, 0, Math.PI * 2);
  g.stroke();
  // coque : très allongée, relevée aux deux bouts
  g.fillStyle = "#6a4426";
  g.beginPath();
  g.moveTo(L * 1.05, -W * 0.15);
  g.quadraticCurveTo(L * 0.6, W * 0.95, -L * 0.2, W * 0.8);
  g.quadraticCurveTo(-L * 0.9, W * 0.7, -L * 1.05, W * 0.1);
  g.quadraticCurveTo(-L * 0.9, -W * 0.7, -L * 0.2, -W * 0.8);
  g.quadraticCurveTo(L * 0.6, -W * 0.95, L * 1.05, -W * 0.15);
  g.closePath();
  g.fill();
  g.strokeStyle = "#2a1a10";
  g.lineWidth = 3;
  g.stroke();
  // planches et pont
  g.strokeStyle = "rgba(30,15,5,0.35)";
  g.lineWidth = 1.5;
  for (const k of [-0.5, -0.25, 0, 0.25, 0.5]) {
    g.beginPath();
    g.moveTo(-L * 0.95, W * k * 0.85);
    g.lineTo(L * 0.95, W * k * 0.85);
    g.stroke();
  }
  // boucliers le long des deux bords
  for (let i = 0; i < 7; i++) {
    const sx = -L * 0.7 + i * (L * 0.27);
    for (const side of [-1, 1]) {
      g.fillStyle = SHIELDS[(i + (side > 0 ? 1 : 0)) % SHIELDS.length];
      g.beginPath();
      g.arc(sx, side * W * 0.7, W * 0.17, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#2a1a10";
      g.lineWidth = 1.5;
      g.stroke();
    }
  }
  // voile carrée rayée rouge et crème
  g.save();
  g.translate(L * 0.05, 0);
  g.fillStyle = "#e6d9b8";
  g.beginPath();
  g.roundRect(-L * 0.12, -W * 1.05, L * 0.24, W * 2.1, 5);
  g.fill();
  g.fillStyle = "#a8322d";
  for (let i = 0; i < 4; i++) g.fillRect(-L * 0.12 + i * (L * 0.06), -W * 1.05, L * 0.03, W * 2.1);
  g.strokeStyle = "#2a1a10";
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(-L * 0.12, -W * 1.05, L * 0.24, W * 2.1, 5);
  g.stroke();
  g.fillStyle = "#2a1a10"; // le mât
  g.beginPath();
  g.arc(0, 0, 5, 0, Math.PI * 2);
  g.fill();
  g.restore();
  // proue : tête de dragon ; poupe : queue enroulée
  g.save();
  g.translate(L * 1.02, -W * 0.12 + Math.sin(time / 350) * 1.5);
  g.fillStyle = "#3a2415";
  g.strokeStyle = "#1c1008";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(-8, W * 0.2);
  g.quadraticCurveTo(0, -W * 0.5, 10, -W * 0.45);
  g.lineTo(18, -W * 0.3);
  g.lineTo(10, -W * 0.18);
  g.quadraticCurveTo(4, W * 0.05, 0, W * 0.25);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = "#e8c24e";
  g.beginPath();
  g.arc(8, -W * 0.36, 1.6, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.strokeStyle = "#3a2415";
  g.lineWidth = 4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(-L * 1.0, W * 0.1);
  g.quadraticCurveTo(-L * 1.2, -W * 0.5, -L * 1.05, -W * 0.7);
  g.stroke();
}
