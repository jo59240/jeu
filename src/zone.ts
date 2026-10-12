// Zone de travail d'un personnage, en cases : un disque (clic sur un arbre) ou un rectangle (Maj + glisser).
export type Zone =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "rect"; x0: number; y0: number; x1: number; y1: number };

export function zoneBounds(z: Zone) {
  return z.kind === "circle"
    ? { x0: z.cx - z.r, y0: z.cy - z.r, x1: z.cx + z.r, y1: z.cy + z.r }
    : { x0: Math.min(z.x0, z.x1), y0: Math.min(z.y0, z.y1), x1: Math.max(z.x0, z.x1), y1: Math.max(z.y0, z.y1) };
}

export function zoneContains(z: Zone, x: number, y: number): boolean {
  if (z.kind === "circle") return Math.hypot(x - z.cx, y - z.cy) <= z.r;
  const b = zoneBounds(z);
  return x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1;
}
