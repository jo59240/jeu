// Réglages généraux : taille de la carte et ressources de la nature.
export const GRID = 192;
export const CHUNK = 16; // taille d'un morceau de carte dessiné d'un bloc (en cases)

import { REGROW_MS as REGROW, START_COINS as START } from "./balance";

export const START_COINS = START; // voir balance.ts


// Ressources de la nature.
export const REGROW_MS = REGROW; // voir balance.ts
export const FISH_COOLDOWN_MS = 2500;

// Un jeu de test (?cheat ou ?demo=crops dans l'adresse) a sa propre sauvegarde.
const params = new URLSearchParams(location.search);
export const CHEAT = params.has("cheat") || params.has("demo");
export const DEMO = params.get("demo");
export const SAVE_KEY = CHEAT ? "ferme-save-test" : "ferme-save-v2";
