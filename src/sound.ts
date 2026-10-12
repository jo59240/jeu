// Sons du jeu (pack « Impact Sounds » de Kenney, licence CC0, dans public/sons).
// Au clic sur un villageois ou un bâtiment, on joue le son qui correspond à ce qu'il est en train de faire.

export type Cue =
  | "walk" // il marche
  | "wood" // coupe du bois
  | "carry" // porte un chargement
  | "hammer" // construit
  | "saw" // scie à l'atelier
  | "water" // eau : seau, puits
  | "hunt" // chasse
  | "bee" // ruches
  | "rest" // chez lui, se repose
  | "eat" // boit, mange, découpe
  | "angry" // mécontent
  | "bell" // le port
  | "door" // une maison
  | "idle"; // rien de particulier

// pour chaque situation : le pack de sons (fichiers « nom_000 » à « nom_004 ») et le volume
const CUES: Record<Cue, { file: string; volume: number }> = {
  walk: { file: "footstep_grass", volume: 0.5 },
  wood: { file: "impactWood_heavy", volume: 0.55 },
  carry: { file: "impactSoft_medium", volume: 0.55 },
  hammer: { file: "impactPlank_medium", volume: 0.55 },
  saw: { file: "impactMetal_medium", volume: 0.4 },
  water: { file: "impactTin_medium", volume: 0.5 },
  hunt: { file: "impactPunch_medium", volume: 0.5 },
  bee: { file: "impactGlass_light", volume: 0.35 },
  rest: { file: "impactSoft_heavy", volume: 0.45 },
  eat: { file: "impactPlate_light", volume: 0.5 },
  angry: { file: "impactPlate_heavy", volume: 0.5 },
  bell: { file: "impactBell_heavy", volume: 0.45 },
  door: { file: "impactWood_light", volume: 0.5 },
  idle: { file: "impactGeneric_light", volume: 0.45 },
};

// sons d'appoint pour varier selon l'état d'un bâtiment (au repos / en marche)
const EXTRA: Record<string, { file: string; volume: number }> = {
  sawIdle: { file: "impactWood_medium", volume: 0.45 },
  sawWork: { file: "impactMetal_heavy", volume: 0.45 },
  butcherWork: { file: "impactMetal_light", volume: 0.5 },
  siteIdle: { file: "impactMining", volume: 0.45 },
};

const MUTED = new URLSearchParams(location.search).has("mute");
let last = 0;

// Réglages du son (menu du jeu), gardés dans le navigateur.
const KEY = "ferme-son";
let volume = 0.8;
let off = false;
try {
  const o = JSON.parse(localStorage.getItem(KEY) ?? "{}");
  if (typeof o.volume === "number") volume = Math.max(0, Math.min(1, o.volume));
  off = !!o.off;
} catch {
  /* réglages par défaut */
}
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ volume, off }));
  } catch {
    /* tant pis */
  }
};
export const getVolume = () => volume;
export const isSoundOff = () => off;
export function setVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  save();
}
export function setSoundOff(b: boolean) {
  off = b;
  save();
}

export function play(cue: Cue | keyof typeof EXTRA): void {
  if (MUTED || off || volume <= 0) return;
  const now = performance.now();
  if (now - last < 120) return; // pas deux sons collés
  last = now;
  const def = (CUES as Record<string, { file: string; volume: number }>)[cue] ?? EXTRA[cue];
  if (!def) return;
  const n = Math.floor(Math.random() * 5);
  const a = new Audio(`./sons/${def.file}_00${n}.ogg`);
  a.volume = Math.min(1, def.volume * volume * 1.25);
  a.play().catch(() => {}); // le navigateur peut refuser tant que la page n'a pas reçu de clic
}
