// Règles du jeu et sauvegarde. Rien ici ne dépend de l'affichage.
import { CHEAT, GRID, REGROW_MS, SAVE_KEY, START_COINS } from "./config";
import { CROP_BY_ID } from "./crops";
import { STRUCTURES } from "./structures";
import {
  MAX_CREW, ARRIVAL_SEC, HOUSE_CAPACITY, CARRY_MAX, HAUL_MAX, CAMP_CAPACITY, DEPOT_CAPACITY, SAWMILL_LOGS_CAP, SAWMILL_PLANKS_CAP, LOGS_PER_PLANK, PLANK_SEC, WELL_CAP, WELL_REFILL_SEC, HOUSE_WATER_CAP, HOUSE_WATER_START, WATER_SEC, WATER_MAX, BERRY_REGROW_MS, BERRY_YIELD, DEPOT_LEVELS, THIRST_FULL_SEC, HUNGER_FULL_SEC, NEED_BAD, NEED_UNREST, NEED_FULL_SEC, NEED_NOSOURCE_UNREST, LODGE_CAP, HUNT_CARRY, HUNT_RADIUS, BUTCHER_MEAT_CAP, BUTCHER_CUTS_CAP, CUT_SEC, HOUSE_FOOD_CAP, HOUSE_FOOD_START, FOOD_SEC, FOOD_MAX,
} from "./balance";
import { DAY_SEC, DAY_START, DISCONTENT_FALL, DISCONTENT_FALL_K, DISCONTENT_RISE, DISCONTENT_TOL, LEAVE_AFTER_SEC, MOOD, SEASONS, SEASON_DAYS, SeasonRules, WorkplaceKind, THREAT_CALM } from "./balance";
import { RECIPES, DISH_CAP, SHIPYARD_SIZE, DRAKKAR_STAGES, COLONY_GOAL, MARKET_FIRST_SEC, MARKET_GAP_SEC, MARKET_STAY_SEC, MARKET_BUY_MULT, MARKET_SELL_MULT, MARKET_PURSE, MARKET_WANTS, PIGPEN_SIZE, PIGS_MAX, PIG_PRICE, PIG_SELL, PIG_ADULT_SEC, PIG_EAT_SEC, PIG_DRINK_SEC, PIG_BREED_SEC, PIG_MEAT, PIG_KEEP, STABLE_SIZE, STABLE_COWS_MAX, STABLE_FEED_CAP, STABLE_WATER_CAP, STABLE_MILK_CAP, COW_PRICE, COW_SELL, COW_EAT_SEC, COW_DRINK_SEC, MILK_SEC, MILK_SEASON, EXPORT_GOODS, ExportGood, FARM_SIZE, WET_SEC, DRY_BELOW, FARM_CROPS, FARM_PLOTS, FarmCrop, CHURCH_GRAVES, CORPSE_SICK_AFTER, CORPSE_SICK_RADIUS, AGE_ARRIVAL, AGE_START, AGE_WARN, AGE_YEARS_PER_DAY, LIFESPAN_MAX, LIFESPAN_MIN, CONTAGION_NEIGHBOR, CONTAGION_NEIGHBOR_RADIUS, CONTAGION_WORK, HEAL_LEVELS, PREVENT_CONTAGION, PREVENT_ONSET, PREVENT_SEC, QUARANTINE_HOUSE, CLINIC_BERRY_CAP, CLINIC_HONEY_CAP, CLINIC_REMEDY_CAP, CONTAGION_RADIUS, HEALTH_RISK, HEALTH_TICK, ILLNESSES, IMMUNE_SEC, IllnessKind, REMEDIES, RemedyKind, SICK_BED, SYRUP_BERRIES, SYRUP_HONEY, TISANE_BERRIES, TREAT_SLOW_SEC } from "./balance";
import { COSTS, HARVEST_MAX, HIVE_CARE_SEC, HONEY_CAP, HONEY_SEC, PORT_CAP, PORT_QUOTA_DEFAULT, PRICE_CUTS, PRICE_HONEY, PRICE_BERRIES, PRICE_PLANK, SHIP_CYCLE } from "./balance";
// Tous les réglages vivent dans balance.ts ; on les ré-exporte ici pour le reste du jeu.
export {
  MAX_CREW, ARRIVAL_SEC, HOUSE_CAPACITY, CARRY_MAX, HAUL_MAX, CAMP_CAPACITY, DEPOT_CAPACITY, SAWMILL_LOGS_CAP, SAWMILL_PLANKS_CAP, LOGS_PER_PLANK, PLANK_SEC, WELL_CAP, WELL_REFILL_SEC, HOUSE_WATER_CAP, HOUSE_WATER_START, WATER_SEC, WATER_MAX, BERRY_REGROW_MS, BERRY_YIELD, DEPOT_LEVELS, THIRST_FULL_SEC, HUNGER_FULL_SEC, NEED_BAD, NEED_UNREST, NEED_FULL_SEC, NEED_NOSOURCE_UNREST, LODGE_CAP, HUNT_CARRY, HUNT_RADIUS, BUTCHER_MEAT_CAP, BUTCHER_CUTS_CAP, CUT_SEC, HOUSE_FOOD_CAP, HOUSE_FOOD_START, FOOD_SEC, FOOD_MAX,
};
import { T, isWater, loneTreeOfCell, objects, terrainAt } from "./world";
import { Zone } from "./zone";

export type Pos = { gx: number; gy: number };

export type Cell =
  | { kind: "grass" }
  | { kind: "plowed" }
  | { kind: "crop"; crop: string; plantedAt: number; readyAt: number };

export interface Save {
  coins: number;
  corn: number; // nombre de récoltes depuis le début
  cells: Cell[];
  goods: Record<string, number>; // poisson, œufs… (le bois, lui, est stocké dans chaque dépôt)
  workers: WorkerSave[]; // l'équipe : le premier personnage est le fermier du départ
  camps: Camp[]; // camps de bûcheron : le bois porté y est déposé
  depots: Depot[]; // dépôts : le seul endroit où le bois du joueur est stocké
  houses: House[]; // maisons : chaque villageois y a sa place
  sawmills: Sawmill[]; // scieries : transforment les bûches en planches
  wells: Well[]; // puits : de l'eau pour les maisons
  lodges: Lodge[]; // camps de chasseur : la viande y est rapportée
  butchers: Butcher[]; // boucheries : préparent la viande
  ports: Port[]; // ports : exportent des marchandises contre des pièces
  taverns: Tavern[]; // tavernes : des plats qui redonnent de l'énergie
  shipyards: Shipyard[]; // chantiers navals : le grand drakkar
  island?: number; // numéro de l'île (0 : l'île de départ)
  arrival?: boolean; // le drakkar vient d'arriver : à annoncer une fois
  victory?: boolean; // la colonie a atteint son objectif
  markets: Market[]; // marchés : une caravane y passe de temps en temps
  pigpens: Pigpen[]; // porcheries : des cochons pour leur viande
  stables: Stable[]; // étables : des vaches qui donnent du lait
  farms: Farm[]; // fermes : parcelles de blé, maïs, tomates ou carottes
  churches: Church[]; // églises : cimetière et fossoyeurs
  corpses: Corpse[]; // défunts pas encore enterrés
  clinics: Clinic[]; // maisons du soigneur : remèdes et malades
  lost?: { day: number; year: number; cause: string }; // la partie est perdue : plus aucun villageois
  healthT?: number; // secondes depuis le dernier tirage des maladies
  apiaries: Apiary[]; // ruchers : du miel, si un apiculteur s'en occupe
  clock: number; // secondes de jeu écoulées : l'heure du jour et le numéro du jour s'en déduisent
  grow: number; // « temps de pousse » écoulé en ms (il avance plus vite au printemps et s'arrête en hiver) : sert à faire repousser les arbres
  sites: Site[]; // chantiers : fondations posées, bâtiment en cours de construction
  roads: Record<number, 1>; // cases de chemin (indice = gy * GRID + gx)
  picked: Record<number, number>; // arbustes à baies cueillis : indice → moment (temps de pousse)
  felled: Record<number, number>; // arbres abattus : indice de l'arbre → moment où il est tombé
}

export type Action = "plow" | "plant" | "harvest" | "growing" | "poor" | "blocked";
export type BuildResult = "ok" | "poor" | "blocked" | "terrain";

export function newSave(): Save {
  return {
    coins: CHEAT ? 9999 : START_COINS,
    corn: CHEAT ? 99 : 0,
    cells: Array.from({ length: GRID * GRID }, () => ({ kind: "grass" }) as Cell),
    goods: {},
    felled: {},
    picked: {},
    camps: [],
    depots: [],
    houses: [],
    sawmills: [],
    wells: [],
    lodges: [],
    butchers: [],
    ports: [],
    apiaries: [],
    clinics: [],
    churches: [],
    farms: [],
    stables: [],
    pigpens: [],
    markets: [],
    shipyards: [],
    taverns: [],
    corpses: [],
    clock: DAY_SEC * DAY_START,
    grow: 0,
    sites: [],
    roads: {},
    workers: [{ id: 1, role: "none", carry: 0, name: CREW_NAMES[0], color: 0, x: GRID / 2 + 0.5, y: GRID / 2 + 0.5, job: null }],
  };
}

// Seules les cases labourées ou cultivées sont sauvegardées : la carte fait 16 384 cases.
// Version du format de sauvegarde. À chaque changement qui casserait les anciennes parties, on l'augmente et on écrit sa migration dans migrateStored :
// les joueurs gardent leurs parties d'une mise à jour à l'autre (ne plus jamais changer SAVE_KEY).
export const SAVE_VERSION = 1;

interface Stored extends Omit<Save, "cells"> {
  sparse: [number, Cell][];
  version?: number;
}

function migrateStored(st: Stored): Stored {
  const v = st.version ?? 0;
  // v0 → v1 : le format n'a pas changé, seul le numéro de version est apparu.
  // exemple pour plus tard : if (v < 2) { ...adapter st... }
  void v;
  st.version = SAVE_VERSION;
  return st;
}

export function load(): Save {
  try {
    const raw = localStorage.getItem(SAVE_KEY) ?? window.ferme?.readSave(SAVE_KEY) ?? null; // application de bureau : la copie sur disque sert de secours
    if (raw) {
      const st = migrateStored(JSON.parse(raw) as Stored);
      if (Array.isArray(st.sparse)) {
        const s = newSave();
        for (const [i, c] of st.sparse) if (i >= 0 && i < s.cells.length) s.cells[i] = c;
        for (const c of s.cells) if (c.kind === "crop") c.crop ??= "carrot";
        s.coins = st.coins ?? s.coins;
        s.corn = st.corn ?? 0;
        s.goods = st.goods ?? {};
        s.felled = st.felled ?? {};
        s.picked = st.picked ?? {};
        if (st.workers?.length) s.workers = st.workers;
        s.lost = st.lost;
        if (st.lost) s.workers = []; // partie perdue : plus personne
        for (const w of s.workers) {
          w.role ??= w.job ? "wood" : "none";
          w.carry ??= 0;
        }
        s.camps = st.camps ?? [];
        for (const c of s.camps) c.wood ??= 0;
        s.depots = st.depots ?? [];
        for (const d of s.depots) {
          d.wood = 0; // les dépôts ne gardent plus de bûches : tout passe par la scierie
          d.planks ??= 0;
          d.cuts ??= 0;
          d.honey ??= 0;
        }
        // ancienne sauvegarde : le bois était un stock commun, on le range dans les dépôts
        if (s.goods.wood) addToStorage(s, s.goods.wood);
        delete s.goods.wood;
        for (const w of s.workers) {
          if (w.name === "Fermier") w.name = "Gaspard";
          w.age ??= Math.round(randRange(AGE_START)); // ancienne sauvegarde : un âge au hasard
          w.lifespan ??= Math.round(LIFESPAN_MIN + Math.random() * (LIFESPAN_MAX - LIFESPAN_MIN));
          if ((w.job as { type: string } | null)?.type === "craft") w.job = null; // ancien ouvrier sur place : il sera reconfié à son poste
          if (w.job?.type === "haul" && (w.job as { depotId?: number }).depotId === undefined) w.job = null; // ancien porteur lié à un camp : à reconfier
        }
        s.sites = st.sites ?? [];
        s.houses = st.houses ?? [];
        s.sawmills = st.sawmills ?? [];
        s.wells = st.wells ?? [];
        s.lodges = st.lodges ?? [];
        s.butchers = st.butchers ?? [];
        s.ports = st.ports ?? [];
        s.apiaries = st.apiaries ?? [];
        s.clinics = st.clinics ?? [];
        s.churches = st.churches ?? [];
        s.stables = st.stables ?? [];
        s.pigpens = st.pigpens ?? [];
        s.markets = st.markets ?? [];
        s.shipyards = st.shipyards ?? [];
        s.taverns = st.taverns ?? [];
        s.island = st.island;
        s.arrival = st.arrival;
        s.victory = st.victory;
        s.farms = (st.farms ?? []).filter((f) => f.plots?.length === FARM_PLOTS && f.water !== undefined); // anciennes fermes (3 × 3, six parcelles) : retirées et remboursées
        s.coins += ((st.farms ?? []).length - s.farms.length) * 50;
        for (const f of s.farms) for (const pl of f.plots) if (pl.t === undefined) pl.t = f.crop; // parcelles d'avant le choix par parcelle
        s.corpses = st.corpses ?? [];
        s.healthT = st.healthT ?? 0;
        s.clock = st.clock ?? DAY_SEC * DAY_START;
        s.grow = st.grow ?? 0;
        // anciennes sauvegardes : les arbres abattus étaient datés de l'heure réelle ; on garde le temps déjà écoulé
        for (const k of Object.keys(s.felled)) {
          const v = s.felled[Number(k)];
          if (v > 1e11) s.felled[Number(k)] = s.grow - Math.max(0, Date.now() - v);
        }
        for (const m of s.ports) {
          // anciens ports : des champs séparés par marchandise → un stock et un quota par ressource
          const old = m as unknown as Record<string, number | boolean | undefined>;
          const n = (k: string, d = 0) => (typeof old[k] === "number" ? (old[k] as number) : d);
          m.stock ??= { plank: n("planks"), cuts: n("cuts"), honey: n("honey"), berries: n("berries") };
          m.quota ??= {
            plank: old.sellPlanks === false ? 0 : n("quotaPlanks", PORT_QUOTA_DEFAULT),
            cuts: old.sellCuts === false ? 0 : n("quotaCuts", PORT_QUOTA_DEFAULT),
            honey: n("quotaHoney", PORT_QUOTA_DEFAULT),
            berries: n("quotaBerries"),
            wheat: n("quotaCrops"),
            corn: n("quotaCrops"),
            tomato: n("quotaCrops"),
            carrot: n("quotaCrops"),
          };
        }
        for (const l of s.lodges) l.meat ??= 0;
        for (const h of s.houses) {
          h.water ??= HOUSE_WATER_START;
          h.food ??= HOUSE_FOOD_START;
        }
        s.roads = st.roads ?? {};
        return s;
      }
    }
  } catch {
    /* sauvegarde absente ou illisible : on repart de zéro */
  }
  return newSave();
}

export function persist(s: Save) {
  try {
    const { cells, ...rest } = s;
    const sparse: [number, Cell][] = [];
    cells.forEach((c, i) => {
      if (c.kind !== "grass") sparse.push([i, c]);
    });
    const json = JSON.stringify({ ...rest, sparse, version: SAVE_VERSION });
    try {
      localStorage.setItem(SAVE_KEY, json);
    } catch {
      /* stockage bloqué : le jeu reste jouable sans sauvegarde */
    }
    window.ferme?.writeSave(SAVE_KEY, json); // application de bureau : copie sur disque (dossier de l'utilisateur, intact après une mise à jour)
  } catch {
    /* tant pis */
  }
}

export function growth(c: Cell, now: number): number {
  if (c.kind !== "crop") return 0;
  return Math.min(1, Math.max(0, (now - c.plantedAt) / (c.readyAt - c.plantedAt)));
}

// Un seul point d'entrée pour toute action du joueur sur un champ : plus tard, le serveur
// exécutera la même fonction pour valider.
export function interact(s: Save, i: number, now: number, cropId = "carrot"): Action {
  const gx = i % GRID;
  const gy = Math.floor(i / GRID);
  if (occupied(s, gx, gy) || roadAt(s, gx, gy) || !canBuild(s, gx, gy)) return "blocked";
  const c = s.cells[i];
  if (c.kind === "grass") {
    s.cells[i] = { kind: "plowed" };
    return "plow";
  }
  if (c.kind === "plowed") {
    const def = CROP_BY_ID[cropId];
    if (s.coins < def.cost) return "poor";
    s.coins -= def.cost;
    s.cells[i] = { kind: "crop", crop: cropId, plantedAt: now, readyAt: now + def.growMs };
    return "plant";
  }
  if (growth(c, now) >= 1) {
    s.cells[i] = { kind: "plowed" };
    s.coins += CROP_BY_ID[c.crop]?.gain ?? 0;
    s.corn += 1;
    return "harvest";
  }
  return "growing";
}

// ---- Nature : terrain constructible, arbres et pêche ----

// Un arbre est « tombé » : pour toujours s'il est isolé, le temps de repousser s'il fait partie d'une forêt.
export function isFelled(s: Save, idx: number, now: number): boolean {
  const t = s.felled[idx];
  if (t === undefined) return false;
  return objects[idx].lone ? true : (s.grow - t) / 1 < REGROW_MS; // la repousse suit le temps de pousse : accélérée au printemps, arrêtée en hiver
}

// On ne construit et on ne cultive que sur l'herbe dégagée (ou une case dont l'arbre isolé a été abattu).
export function canBuild(s: Save, gx: number, gy: number): boolean {
  const t = terrainAt(gx, gy);
  if (t === T.Grass) return true;
  if (t !== T.Tree) return false;
  const idx = loneTreeOfCell.get(gy * GRID + gx);
  return idx !== undefined && s.felled[idx] !== undefined;
}

// Un arbuste à baies est cueilli : il n'a plus de baies tant qu'il n'a pas eu le temps de repousser (le temps de pousse : arrêté en hiver).
// Un bâtiment ou un chemin posé sur un arbuste à baies le fait disparaître pour de bon (la zone, en cases, plus `margin` autour).
export function clearBerries(s: Save, gx: number, gy: number, w: number, h: number, margin = 0): void {
  objects.forEach((o, i) => {
    if (o.kind === "berry" && o.x >= gx - margin && o.x < gx + w + margin && o.y >= gy - margin && o.y < gy + h + margin) s.picked[i] = BERRY_GONE;
  });
}

export const BERRY_GONE = 1e15; // « cueilli » à une date lointaine : l'arbuste ne repousse jamais
export const isBerryGone = (s: Save, idx: number) => (s.picked[idx] ?? 0) >= BERRY_GONE;

export function isPicked(s: Save, idx: number): boolean {
  const t = s.picked[idx];
  return t !== undefined && s.grow - t < BERRY_REGROW_MS;
}

// Cueille un arbuste ; renvoie les baies récoltées (0 s'il n'en avait pas).
export function pickBush(s: Save, idx: number): number {
  if (isPicked(s, idx)) return 0;
  s.picked[idx] = s.grow;
  return BERRY_YIELD + (objects[idx].size > 1.05 ? 1 : 0);
}

// Un cueilleur range ses baies dans ce dépôt, dans la limite de sa place ; renvoie la quantité acceptée.
export function addBerriesToDepot(d: Depot, n: number): number {
  const taken = Math.max(0, Math.min(n, depotFree(d)));
  d.berries = (d.berries ?? 0) + taken;
  return taken;
}

export const berryStock = (s: Save) => s.depots.reduce((a, d) => a + (d.berries ?? 0), 0);

// Abat un arbre et renvoie le bois qu'il donne (sans le mettre en stock : un bûcheron le porte jusqu'à un camp).
export function felTree(s: Save, idx: number, now: number): number {
  const o = objects[idx];
  s.felled[idx] = s.grow; // daté du temps de pousse, pas de l'heure réelle
  return Math.max(1, Math.round(1 + o.size * 1.5 + (o.kind === "oak" ? 0.8 : 0)));
}

// Coup de hache du joueur lui-même : le bois va dans un dépôt, s'il y a de la place.
export function chopTree(s: Save, idx: number, now: number): number {
  const wood = felTree(s, idx, now);
  return addToStorage(s, wood);
}

// Un coup de ligne : l'eau profonde est plus généreuse que les bords.
export function catchFish(s: Save, deep: boolean): number {
  const roll = Math.random();
  const n = deep ? (roll < 0.2 ? 2 : roll < 0.65 ? 1 : 0) : roll < 0.5 ? 1 : 0;
  if (n) s.goods.fish = (s.goods.fish ?? 0) + n;
  return n;
}

// ---- Déplacements ----

// Les villageois (pas les animaux) peuvent aussi traverser une ferme : c'est là, dans les champs, que travaille le fermier.
export const walkableByPeople = (s: Save, gx: number, gy: number): boolean =>
  walkable(s, gx, gy) ||
  ((s.farms.some((f) => gx >= f.gx && gx < f.gx + FARM_SIZE && gy >= f.gy && gy < f.gy + FARM_SIZE) || s.stables.some((m) => gx >= m.gx && gx < m.gx + STABLE_SIZE && gy >= m.gy && gy < m.gy + STABLE_SIZE) || s.pigpens.some((m) => gx >= m.gx && gx < m.gx + PIGPEN_SIZE && gy >= m.gy && gy < m.gy + PIGPEN_SIZE)) && terrainAt(gx, gy) !== T.Deep);

// Peut-on marcher sur cette case ? Pas dans l'eau, ni sur la roche, ni à travers un arbre debout,
// ni à travers un camp ou un dépôt (on les contourne).
export function walkable(s: Save, gx: number, gy: number): boolean {
  if (occupied(s, gx, gy)) return false;
  const t = terrainAt(gx, gy);
  if (t === T.Grass || t === T.Sand || t === T.Forest || t === T.Road) return true;
  return t === T.Tree && canBuild(s, gx, gy);
}

// ---- L'équipe ----

// Un travail : couper les arbres d'une zone, ou transporter le bois d'un camp jusqu'à un dépôt.
export type Job =
  | { type: "wood"; zone: Zone; chopped: number } // chopped : arbres coupés depuis le début de ce travail
  | { type: "haul"; depotId: number; hauled: number; sawmill?: boolean; dest?: HaulDest | "any"; craft?: boolean } // sawmill : la destination est une scierie (depotId est alors son identifiant)
  // // le porteur appartient à un dépôt ; hauled : bois livré
  | { type: "build"; siteId: number; delivered: number } // bâtisseur d'un chantier ; delivered : bois apporté
  | { type: "swine"; pigpenId: number; slaughtered: number } // porcher d'une porcherie ; slaughtered : cochons abattus
  | { type: "tend"; stableId: number; milked: number } // éleveur d'une étable ; milked : lait rapporté
  | { type: "farm"; farmId: number; harvested: number } // fermier d'une ferme ; harvested : récolte rapportée
  | { type: "bury"; churchId: number; buried: number } // fossoyeur d'une église ; buried : défunts enterrés
  | { type: "heal"; clinicId: number; treated: number } // soigneur d'une maison du soigneur ; treated : soins donnés
  | { type: "gather"; depotId: number; gathered: number } // cueilleur : il ramasse les baies autour de ce dépôt et les y range
  | { type: "bee"; apiaryId: number; harvested: number } // apiculteur d'un rucher ; harvested : miel récolté
  | { type: "hunt"; lodgeId: number; hunted: number } // chasseur d'un camp ; hunted : viande rapportée
  | { type: "cook"; tavernId: number; cooked: number } // cuisinier d'une taverne ; cooked : plats préparés
  | { type: "water"; houseId: number; hauled: number; food?: boolean; dine?: number }; // food : il va chercher à manger (à la boucherie) au lieu de l'eau
  // // corvée d'eau : un habitant remplit sa maison au puits ; hauled : eau livrée

// Métier d'un personnage : il détermine sa tenue. Le travail vient après.
export type Role = "none" | "wood" | "haul" | "build" | "water" | "hunt" | "bee" | "craft" | "gather" | "heal" | "bury" | "farm" | "tend" | "swine" | "cook";

export interface WorkerSave {
  id: number;
  role: Role;
  name: string;
  carry: number; // bois porté sur le dos, pas encore déposé
  color: number; // indice dans CREW_COLORS
  x: number; // position en cases
  y: number;
  job: Job | null;
  home?: number | null; // maison où il habite
  inside?: boolean; // il est dans sa maison (invisible)
  resume?: { role: Role; job: Job | null }; // activité à reprendre après une corvée d'eau ou un repos
  energy?: number; // énergie de 0 à 100 (100 : en pleine forme) ; la fatigue est son contraire
  body?: { name: string; age: number; cause: string; color: number }; // le défunt qu'un fossoyeur porte
  age?: number; // âge en années
  lifespan?: number; // espérance de vie : il meurt de vieillesse à cet âge
  oldWarned?: boolean; // prévenu qu'il approche de la fin
  xp?: number; // expérience de soigneur
  protect?: number; // secondes de protection qu'il lui reste (tisane préventive)
  illness?: Illness; // maladie en cours
  immune?: number; // secondes d'immunité qu'il lui reste après une guérison
  thirst?: number; // soif, de 0 à 100 %
  hunger?: number; // faim, de 0 à 100 %
  visit?: boolean; // il est rentré chez lui boire ou manger
  resting?: boolean; // il est rentré se reposer et reprendra son activité une fois remis
  workplace?: { kind: WorkplaceKind; id: number }; // son employeur : le bâtiment qui l'emploie (absent : sans emploi)
  discontent?: number; // mécontentement de 0 à 100 : monte tant que les nuisances persistent près de sa maison, retombe quand elles diminuent
  threat?: number; // à 100 % il menace de partir : secondes restantes avant qu'il quitte sa maison (absent s'il ne menace pas)
  unsupplied?: boolean; // sa maison est à sec (eau ou nourriture) et aucune source n'est disponible nulle part : il s'énerve
  thirstFull?: number; // secondes passées à 100 % de soif
  hungerFull?: number; // secondes passées à 100 % de faim
  fedFor?: number; // secondes pendant lesquelles un bon repas le rassasie : il n'a pas faim
  shunned?: number[]; // maisons qu'il a quittées exaspéré : il n'y retourne pas tant que la gêne y reste forte
  cargo?: "wood" | "plank" | "water" | "meat" | "cuts" | "honey" | "berries" | "tisane" | "syrup" | "body" | "milk" | FarmCrop; // ce qu'il porte : des bûches (par défaut), des planches ou de l'eau
}

export const FEMALE_NAMES = ["Léa", "Maëlle", "Nina", "Zoé", "Camille"]; // pour accorder les phrases
export const CREW_NAMES = ["Gaspard", "Léa", "Hugo", "Maëlle", "Tom", "Nina", "Paul", "Zoé", "Jules", "Camille"];
export const CREW_COLORS = ["#3c7fc4", "#c4513c", "#4c9a52", "#8e5bb5", "#d19a2a", "#2f9aa0"];


// Chaque recrue coûte plus cher que la précédente.
export function recruitCost(s: Save): number {
  return 25 * s.workers.length;
}

export function recruit(s: Save): WorkerSave | null {
  const cost = recruitCost(s);
  if (s.workers.length >= MAX_CREW || s.coins < cost) return null;
  s.coins -= cost;
  const base = s.workers[0] ?? { x: GRID / 2, y: GRID / 2 };
  const spot = freeSpotNear(s, Math.floor(base.x), Math.floor(base.y));
  return addVillager(s, spot.gx + 0.5, spot.gy + 0.5);
}

// Un nouveau villageois, sans métier, à cette position.
const randRange = ([a, b]: number[]) => a + Math.random() * (b - a);

export function addVillager(s: Save, x: number, y: number, arrival = false): WorkerSave {
  // un prénom et une couleur que personne ne porte déjà (après un départ, on ne retombe pas sur le même)
  const names = new Set(s.workers.map((o) => o.name));
  const colors = new Set(s.workers.map((o) => o.color));
  const n = s.workers.length;
  const w: WorkerSave = {
    id: Math.max(0, ...s.workers.map((o) => o.id)) + 1,
    role: "none",
    carry: 0,
    name: CREW_NAMES.find((k) => !names.has(k)) ?? CREW_NAMES[n % CREW_NAMES.length],
    color: CREW_COLORS.findIndex((_, i) => !colors.has(i)) >= 0 ? CREW_COLORS.findIndex((_, i) => !colors.has(i)) : n % CREW_COLORS.length,
    x,
    y,
    job: null,
    age: Math.round(randRange(arrival ? AGE_ARRIVAL : AGE_START)),
    lifespan: Math.round(LIFESPAN_MIN + Math.random() * (LIFESPAN_MAX - LIFESPAN_MIN)),
  };
  s.workers.push(w);
  return w;
}

// Case praticable la plus proche de (gx, gy) où personne ne se tient : deux personnages ne partagent jamais une case.
export function freeSpotNear(s: Save, gx: number, gy: number): Pos {
  const taken = new Set(s.workers.map((w) => Math.floor(w.y) * GRID + Math.floor(w.x)));
  for (let r = 0; r < 12; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = gx + dx;
        const y = gy + dy;
        if (walkable(s, x, y) && !taken.has(y * GRID + x)) return { gx: x, gy: y };
      }
    }
  }
  return { gx, gy };
}

// ---- Structures : camps, dépôts, chemins ----

export const CAMP_COST = STRUCTURES["camp-wood"].cost;
export const DEPOT_WOOD = STRUCTURES["depot"].woodCost ?? 0; // bois à livrer pour construire un dépôt
export const HOUSE_COST = STRUCTURES["house"].cost;
export const HOUSE_WOOD = STRUCTURES["house"].woodCost ?? 0;
export const HOUSE_BUILD_SEC = STRUCTURES["house"].buildSec;
export const CAMP_BUILD_SEC = STRUCTURES["camp-wood"].buildSec;
export const DEPOT_BUILD_SEC = STRUCTURES["depot"].buildSec;
export const ROAD_COST = STRUCTURES["road"].cost;

// Un camp occupe 2 × 2 cases à partir de (gx, gy).
export interface Camp {
  id: number;
  gx: number;
  gy: number;
  wood: number; // bois stocké au camp
  rot?: number; // orientation : nombre de quarts de tour (0 à 3)
}

// Un dépôt occupe 3 × 3 cases à partir de (gx, gy) et a son propre stock de bois.
export interface Depot {
  id: number;
  gx: number;
  gy: number;
  wood: number; // bûches stockées
  planks?: number; // planches stockées
  cuts?: number; // viande préparée stockée (comptée à part des planches ; elles se partagent les places du dépôt)
  honey?: number; // pots de miel stockés (à part, mais dans les mêmes places)
  pantry?: boolean; // garde-manger : il range toute la nourriture (viande, baies, miel, lait, récoltes) ; le reste va dans les dépôts ordinaires
  level?: number; // 1 (défaut), 2 ou 3 : plus de places et un autre aspect
  meat?: number; // viande brute en réserve (rapportée des camps de chasseur, pour les bouchers)
  milk?: number; // lait de l'étable (nourriture ; à exporter)
  berries?: number; // baies stockées (à part, mêmes places) : de la nourriture pour les maisons
  crops?: Partial<Record<FarmCrop, number>>; // récoltes de la ferme (blé, maïs, tomates, carottes) : de la nourriture, et à exporter
  rot?: number;
}

// Une maison occupe 2 × 2 cases à partir de (gx, gy).
export interface House {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  water?: number; // eau en réserve : les habitants la boivent
  sip?: number; // secondes depuis la dernière gorgée
  food?: number; // nourriture (viande préparée) en réserve : les habitants la mangent
  munch?: number; // secondes depuis le dernier repas
  quarantine?: boolean; // les malades de cette maison doivent y rester (la contagion ne sort plus)
}

export function houseAt(s: Save, gx: number, gy: number): House | null {
  return s.houses.find((h) => gx >= h.gx && gx <= h.gx + 1 && gy >= h.gy && gy <= h.gy + 1) ?? null;
}

type Placed = Pos & { rot?: number };

// Case d'entrée d'un bâtiment carré de `size` cases : à l'origine, sous la case `col` du bord bas ; chaque quart de tour la fait tourner autour du bâtiment (dans le sens des aiguilles d'une montre).
function entranceAt(b: Placed, size: number, col: number): Pos {
  let vx = col + 0.5 - size / 2;
  let vy = size / 2 + 0.5;
  for (let i = 0; i < (b.rot ?? 0) % 4; i++) [vx, vy] = [-vy, vx];
  return { gx: b.gx + Math.floor(size / 2 + vx), gy: b.gy + Math.floor(size / 2 + vy) };
}

export const houseEntrance = (h: Placed): Pos => entranceAt(h, 2, 0); // sous la case bas-gauche de la maison

export function campAt(s: Save, gx: number, gy: number): Camp | null {
  return s.camps.find((c) => gx >= c.gx && gx <= c.gx + 1 && gy >= c.gy && gy <= c.gy + 1) ?? null;
}

export function depotAt(s: Save, gx: number, gy: number): Depot | null {
  return s.depots.find((d) => gx >= d.gx && gx <= d.gx + 2 && gy >= d.gy && gy <= d.gy + 2) ?? null;
}

// Une case est occupée par un camp ou un dépôt : obstacle pour les personnages et pour la construction.
export function occupied(s: Save, gx: number, gy: number): boolean {
  return !!campAt(s, gx, gy) || !!depotAt(s, gx, gy) || !!houseAt(s, gx, gy) || !!sawmillAt(s, gx, gy) || !!wellAt(s, gx, gy) || !!lodgeAt(s, gx, gy) || !!butcherAt(s, gx, gy) || !!portAt(s, gx, gy) || !!apiaryAt(s, gx, gy) || !!clinicAt(s, gx, gy) || !!churchAt(s, gx, gy) || !!farmAt(s, gx, gy) || !!stableAt(s, gx, gy) || !!pigpenAt(s, gx, gy) || !!marketAt(s, gx, gy) || !!shipyardAt(s, gx, gy) || !!tavernAt(s, gx, gy) || !!siteAt(s, gx, gy);
}

export function roadAt(s: Save, gx: number, gy: number): boolean {
  return gx >= 0 && gy >= 0 && gx < GRID && gy < GRID && !!s.roads[gy * GRID + gx];
}

// Emplacement libre pour une structure de `size` × `size` cases : herbe dégagée, ni culture, ni structure, ni chemin.
// On ne bâtit pas sur l'entrée d'un autre bâtiment (sauf un chemin, qui doit justement y arriver).
function footprintFree(s: Save, gx: number, gy: number, size: number, forRoad = false): boolean {
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      const x = gx + dx;
      const y = gy + dy;
      if (!canBuild(s, x, y) || occupied(s, x, y) || roadAt(s, x, y)) return false;
      if (s.cells[y * GRID + x].kind !== "grass") return false;
      if (!forRoad && isEntrance(s, x, y)) return false;
    }
  }
  return true;
}

function footprintTerrainOk(s: Save, gx: number, gy: number, size: number): boolean {
  for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) if (!canBuild(s, gx + dx, gy + dy)) return false;
  return true;
}

// L'entrée du bâtiment doit pouvoir accueillir un chemin : terrain constructible et libre.
function entranceOk(s: Save, e: Pos): boolean {
  return canBuild(s, e.gx, e.gy) && !occupied(s, e.gx, e.gy);
}

export const canPlaceCamp = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, 2) && entranceOk(s, campEntrance({ gx, gy, rot }));
export const canPlaceHouse = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, 2) && entranceOk(s, houseEntrance({ gx, gy, rot }));
export const canPlaceDepot = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, 3) && entranceOk(s, depotEntrance({ gx, gy, rot }));
export const canPlaceRoad = (s: Save, gx: number, gy: number) => footprintFree(s, gx, gy, 1, true) && !roadAt(s, gx, gy);

// Pose un camp : les 25 pièces sont payées tout de suite et les fondations apparaissent ; un bâtisseur doit ensuite le construire.
// instant : le camp existe tout de suite (pour les essais).
export function placeCamp(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = campEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, 2) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceCamp(s, gx, gy, rot)) return "blocked";
  if (s.coins < CAMP_COST) return "poor";
  s.coins -= CAMP_COST;
  if (instant) s.camps.push({ id: Math.max(0, ...s.camps.map((c) => c.id)) + 1, gx, gy, wood: 0, rot });
  else s.sites.push({ id: nextSiteId(s), kind: "camp", rot, gx, gy, need: 0, have: 0, progress: 0, buildSec: CAMP_BUILD_SEC });
  return "ok";
}

// Pose un dépôt : seules les fondations apparaissent. Il faudra y livrer DEPOT_WOOD bois (un bâtisseur les apporte).
// instant : le dépôt existe tout de suite (pour les essais).
export function placeDepot(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = depotEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, 3) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceDepot(s, gx, gy, rot)) return "blocked";
  if (instant) s.depots.push({ id: Math.max(0, ...s.depots.map((d) => d.id)) + 1, gx, gy, wood: 0, rot });
  else s.sites.push({ id: nextSiteId(s), kind: "depot", rot, gx, gy, need: DEPOT_WOOD, mat: "plank", have: 0, progress: 0, buildSec: DEPOT_BUILD_SEC });
  return "ok";
}

// Le garde-manger : un dépôt réservé à la nourriture. Il se pose comme un dépôt (fondations, puis des planches à livrer).
export function placePantry(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = depotEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, 3) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceDepot(s, gx, gy, rot)) return "blocked";
  if (s.coins < COSTS.pantry.coins) return "poor";
  s.coins -= COSTS.pantry.coins;
  if (instant) s.depots.push({ id: Math.max(0, ...s.depots.map((d) => d.id)) + 1, gx, gy, wood: 0, rot, pantry: true });
  else s.sites.push({ id: nextSiteId(s), kind: "pantry", rot, gx, gy, need: COSTS.pantry.mat, mat: "plank", have: 0, progress: 0, buildSec: COSTS.pantry.sec });
  return "ok";
}

// Quand il y a un garde-manger, toute la nourriture y est rangée : ce qui traîne dans les dépôts ordinaires y est transporté, et le bois ou les planches qui
// auraient atterri dans un garde-manger vont dans un dépôt. Renvoie true si quelque chose a bougé.
export function consolidateFood(s: Save): boolean {
  const pantries = s.depots.filter((d) => d.pantry);
  if (!pantries.length) return false;
  const stores = s.depots.filter((d) => !d.pantry);
  let moved = false;
  const food: ("cuts" | "honey" | "berries" | "milk" | "meat")[] = ["cuts", "honey", "berries", "milk", "meat"];
  for (const d of stores) {
    for (const k of food) {
      let n = d[k] ?? 0;
      for (const p of pantries) {
        if (n <= 0) break;
        const t = Math.min(n, depotFree(p));
        if (t <= 0) continue;
        d[k] = (d[k] ?? 0) - t;
        p[k] = (p[k] ?? 0) + t;
        n -= t;
        moved = true;
      }
    }
    for (const c of Object.keys(d.crops ?? {}) as FarmCrop[]) {
      let n = d.crops?.[c] ?? 0;
      for (const p of pantries) {
        if (n <= 0) break;
        const t = Math.min(n, depotFree(p));
        if (t <= 0) continue;
        d.crops = { ...(d.crops ?? {}), [c]: (d.crops?.[c] ?? 0) - t };
        p.crops = { ...(p.crops ?? {}), [c]: (p.crops?.[c] ?? 0) + t };
        n -= t;
        moved = true;
      }
    }
  }
  for (const p of pantries) {
    for (const k of ["planks", "wood"] as const) {
      let n = p[k] ?? 0;
      for (const d of stores) {
        if (n <= 0) break;
        const t = Math.min(n, depotFree(d));
        if (t <= 0) continue;
        p[k] = (p[k] ?? 0) - t;
        d[k] = (d[k] ?? 0) + t;
        n -= t;
        moved = true;
      }
    }
  }
  return moved;
}

// Pose une maison : les pièces sont payées, les fondations apparaissent ; un bâtisseur apporte HOUSE_WOOD bois puis construit.
// instant : la maison existe tout de suite (pour les essais).
export function placeHouse(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = houseEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, 2) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceHouse(s, gx, gy, rot)) return "blocked";
  if (s.coins < HOUSE_COST) return "poor";
  s.coins -= HOUSE_COST;
  if (instant) s.houses.push({ id: Math.max(0, ...s.houses.map((h) => h.id)) + 1, gx, gy, rot, water: HOUSE_WATER_START, food: HOUSE_FOOD_START });
  else s.sites.push({ id: nextSiteId(s), kind: "house", rot, gx, gy, need: HOUSE_WOOD, mat: "plank", have: 0, progress: 0, buildSec: HOUSE_BUILD_SEC });
  return "ok";
}

// Démolir une maison : ses habitants sortent et n'ont plus de toit ; la moitié du prix est rendue.
export function removeHouse(s: Save, house: House) {
  s.houses = s.houses.filter((h) => h !== house);
  s.coins += Math.floor(HOUSE_COST / 2);
  refundPlanks(s, Math.floor(HOUSE_WOOD / 2));
  for (const w of s.workers) if (w.home === house.id) {
    w.home = null;
    w.inside = false;
  }
}

// Pose une case de chemin. Une case déjà en chemin est ignorée sans erreur (on peut repasser dessus en glissant).
export function placeRoad(s: Save, gx: number, gy: number): BuildResult | "already" {
  if (roadAt(s, gx, gy)) return "already";
  if (!canBuild(s, gx, gy)) return "terrain";
  if (!canPlaceRoad(s, gx, gy)) return "blocked";
  if (s.coins < ROAD_COST) return "poor";
  s.coins -= ROAD_COST;
  s.roads[gy * GRID + gx] = 1;
  return "ok";
}

export function removeRoad(s: Save, gx: number, gy: number): boolean {
  if (!roadAt(s, gx, gy)) return false;
  delete s.roads[gy * GRID + gx];
  return true;
}

export function removeCamp(s: Save, camp: Camp) {
  s.camps = s.camps.filter((c) => c !== camp);
  s.coins += Math.floor(CAMP_COST / 2);
}

// Démolir un dépôt : le bois qu'il contenait est perdu, la moitié du bois de construction est rendue (dans un camp ou un autre dépôt).
export function removeDepot(s: Save, depot: Depot) {
  s.depots = s.depots.filter((d) => d !== depot);
  refundPlanks(s, Math.floor(DEPOT_WOOD / 2));
}

// ---- Entrées des bâtiments ----
// Chaque bâtiment a une entrée : la case juste en dessous. C'est là que les personnages travaillent,
// et c'est là que le chemin doit arriver pour que le bâtiment soit relié (passer à côté ne suffit pas).
export const campEntrance = (c: Placed): Pos => entranceAt(c, 2, 0); // sous la case bas-gauche du camp
export const depotEntrance = (d: Placed): Pos => entranceAt(d, 3, 1); // sous la porte du dépôt

export function isEntrance(s: Save, gx: number, gy: number): boolean {
  const is = (e: Pos) => e.gx === gx && e.gy === gy;
  return s.camps.some((c) => is(campEntrance(c))) || s.houses.some((h) => is(houseEntrance(h))) || s.sawmills.some((m) => is(sawmillEntrance(m))) || s.wells.some((m) => is(wellEntrance(m))) || s.lodges.some((m) => is(lodgeEntrance(m))) || s.butchers.some((m) => is(butcherEntrance(m))) || s.ports.some((m) => is(portEntrance(m))) || s.apiaries.some((m) => is(apiaryEntrance(m))) || s.clinics.some((m) => is(clinicEntrance(m))) || s.churches.some((m) => is(churchEntrance(m))) || s.farms.some((m) => is(farmEntrance(m))) || s.stables.some((m) => is(stableEntrance(m))) || s.pigpens.some((m) => is(pigpenEntrance(m))) || s.markets.some((m) => is(marketEntrance(m))) || s.shipyards.some((m) => is(shipyardEntrance(m))) || s.taverns.some((m) => is(tavernEntrance(m))) || s.depots.some((d) => is(depotEntrance(d))) || s.sites.some((t) => is(siteEntrance(t)));
}

// ---- Bois : camps, dépôts et transport ----

// Dépose du bois au camp : il prend ce qui rentre et renvoie la quantité acceptée.
export function depositAtCamp(camp: Camp, n: number): number {
  const taken = Math.max(0, Math.min(n, CAMP_CAPACITY - camp.wood));
  camp.wood += taken;
  return taken;
}

// Un porteur prend du bois au camp ; renvoie la quantité prise.
export function takeFromCamp(camp: Camp, max: number): number {
  const taken = Math.max(0, Math.min(camp.wood, max));
  camp.wood -= taken;
  return taken;
}

export const depotLevel = (d: Depot) => Math.min(DEPOT_LEVELS.length, Math.max(1, d.level ?? 1));
export const depotCapacity = (d: Depot) => DEPOT_LEVELS[depotLevel(d) - 1].cap * (d.pantry ? 2 : 1); // un garde-manger a deux fois la place d'un dépôt
export const depotFree = (d: Depot) => Math.max(0, depotCapacity(d) - (d.planks ?? 0) - (d.cuts ?? 0) - (d.honey ?? 0) - (d.berries ?? 0) - (d.milk ?? 0) - (d.meat ?? 0) - cropTotal(d)); // un dépôt stocke des planches et de la viande préparée : ils se partagent ses places
export const storageCapacity = (s: Save) => s.depots.reduce((a, d) => a + depotCapacity(d), 0);
export const woodStock = (s: Save) => s.depots.reduce((a, d) => a + d.wood, 0);
export const storageFree = (s: Save) => s.depots.reduce((a, d) => a + depotFree(d), 0);

// Un porteur livre à CE dépôt, dans la limite de sa place ; renvoie la quantité acceptée.
export function addToDepot(d: Depot, n: number): number {
  const taken = Math.max(0, Math.min(n, depotFree(d)));
  d.wood += taken;
  return taken;
}

// Un porteur livre des planches à CE dépôt, dans la limite de sa place ; renvoie la quantité acceptée.
export function addPlanksToDepot(d: Depot, n: number): number {
  const taken = Math.max(0, Math.min(n, depotFree(d)));
  d.planks = (d.planks ?? 0) + taken;
  return taken;
}

// Un porteur livre de la viande préparée à CE dépôt, dans la limite de sa place ; renvoie la quantité acceptée.
export function addCutsToDepot(d: Depot, n: number): number {
  const taken = Math.max(0, Math.min(n, depotFree(d)));
  d.cuts = (d.cuts ?? 0) + taken;
  return taken;
}

// Bois que le joueur coupe lui-même : il va dans le premier dépôt qui a de la place ; renvoie la quantité rangée.
export function addToStorage(s: Save, n: number): number {
  let left = n;
  for (const d of s.depots) left -= addToDepot(d, left);
  return n - left;
}

// ---- Bois de construction ----

// Rend du bois : dans un camp qui a de la place, sinon dans un dépôt.
export function refundWood(s: Save, n: number) {
  let left = n;
  for (const c of s.camps) left -= depositAtCamp(c, left);
  for (const d of s.depots) left -= addToDepot(d, left);
}

// ---- Chantiers ----

export type SiteKind = "camp" | "depot" | "house" | "sawmill" | "well" | "lodge" | "butcher" | "port" | "apiary" | "clinic" | "church" | "farm" | "stable" | "pigpen" | "market" | "shipyard" | "tavern" | "pantry";

// Un chantier : les fondations sont posées, puis on y livre les matériaux, puis le bâtiment se construit.
export interface Site {
  id: number;
  kind: SiteKind;
  gx: number;
  gy: number;
  need: number; // matériaux à livrer
  have: number; // matériaux déjà livrés
  mat?: "wood" | "plank"; // nature des matériaux : bûches (par défaut) ou planches
  progress: number; // avancement de la construction, de 0 à 1 (elle ne démarre qu'une fois les matériaux réunis)
  buildSec: number; // durée de la construction par un bâtisseur
  rot?: number;
  undo?: Gain; // démontage en cours : l'avancement redescend tout seul, puis ceci est rendu
}

export const siteSize = (k: SiteKind) => (k === "farm" ? FARM_SIZE : k === "shipyard" ? SHIPYARD_SIZE : k === "stable" || k === "pigpen" ? STABLE_SIZE : k === "pantry" || k === "tavern" || k === "market" || k === "depot" || k === "sawmill" || k === "butcher" || k === "port" || k === "church" ? 3 : 2);
export const siteEntrance = (t: Site): Pos => (t.kind === "depot" || t.kind === "pantry" ? depotEntrance(t) : t.kind === "sawmill" ? sawmillEntrance(t) : t.kind === "well" ? wellEntrance(t) : t.kind === "apiary" ? apiaryEntrance(t) : t.kind === "clinic" ? clinicEntrance(t) : t.kind === "church" ? churchEntrance(t) : t.kind === "farm" ? farmEntrance(t) : t.kind === "stable" ? stableEntrance(t) : t.kind === "tavern" ? tavernEntrance(t) : t.kind === "shipyard" ? shipyardEntrance(t) : t.kind === "market" ? marketEntrance(t) : t.kind === "pigpen" ? pigpenEntrance(t) : t.kind === "port" ? portEntrance(t) : t.kind === "butcher" ? butcherEntrance(t) : t.kind === "lodge" ? lodgeEntrance(t) : t.kind === "house" ? houseEntrance(t) : campEntrance(t));
const nextSiteId = (s: Save) => Math.max(0, ...s.sites.map((t) => t.id)) + 1;

export function siteAt(s: Save, gx: number, gy: number): Site | null {
  return s.sites.find((t) => gx >= t.gx && gx < t.gx + siteSize(t.kind) && gy >= t.gy && gy < t.gy + siteSize(t.kind)) ?? null;
}

export const siteMissing = (t: Site) => Math.max(0, t.need - t.have);
export const siteReady = (t: Site) => t.have >= t.need; // les matériaux sont réunis : la construction peut avancer

// Un bâtisseur dépose du bois au chantier ; renvoie ce que le chantier a pu prendre.
export function addToSite(t: Site, n: number): number {
  const taken = Math.max(0, Math.min(n, siteMissing(t)));
  t.have += taken;
  return taken;
}

// Un bâtisseur travaille dt secondes. Renvoie true quand le bâtiment est terminé : le chantier devient un vrai camp ou dépôt.
export function workOnSite(s: Save, t: Site, dt: number): boolean {
  if (!siteReady(t)) return false;
  t.progress = Math.min(1, t.progress + dt / t.buildSec);
  if (t.progress < 1) return false;
  s.sites = s.sites.filter((x) => x !== t);
  const rot = t.rot ?? 0;
  if (t.kind === "sawmill") s.sawmills.push({ id: Math.max(0, ...s.sawmills.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, logs: 0, planks: 0, prog: 0 });
  else if (t.kind === "house") s.houses.push({ id: Math.max(0, ...s.houses.map((h) => h.id)) + 1, gx: t.gx, gy: t.gy, rot, water: HOUSE_WATER_START, food: HOUSE_FOOD_START });
  else if (t.kind === "pantry") s.depots.push({ id: Math.max(0, ...s.depots.map((d) => d.id)) + 1, gx: t.gx, gy: t.gy, wood: 0, rot, pantry: true });
  else if (t.kind === "tavern") s.taverns.push({ id: Math.max(0, ...s.taverns.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, pantry: {}, dishes: {} });
  else if (t.kind === "shipyard") s.shipyards.push({ id: Math.max(0, ...s.shipyards.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, stage: 0, have: {} });
  else if (t.kind === "market") s.markets.push({ id: Math.max(0, ...s.markets.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, here: false, clock: MARKET_FIRST_SEC, stock: {}, wants: {}, purse: 0 });
  else if (t.kind === "pigpen") s.pigpens.push({ id: Math.max(0, ...s.pigpens.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, pigs: [], feed: 0, water: 0, order: 0, breed: 0 });
  else if (t.kind === "stable") s.stables.push({ id: Math.max(0, ...s.stables.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, cows: [], feed: 0, water: 0, milk: 0 });
  else if (t.kind === "farm") s.farms.push({ id: Math.max(0, ...s.farms.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, crop: "wheat", plots: newPlots(), water: 0 });
  else if (t.kind === "church") s.churches.push({ id: Math.max(0, ...s.churches.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, graves: [] });
  else if (t.kind === "clinic") s.clinics.push({ id: Math.max(0, ...s.clinics.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, berries: 0, honey: 0, tisane: 0, syrup: 0, prog: 0 });
  else if (t.kind === "apiary") s.apiaries.push({ id: Math.max(0, ...s.apiaries.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, care: 100, honey: 0, acc: 0 });
  else if (t.kind === "port") s.ports.push({ id: Math.max(0, ...s.ports.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, stock: {}, quota: {}, t: 0 });
  else if (t.kind === "butcher") s.butchers.push({ id: Math.max(0, ...s.butchers.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, meat: 0, cuts: 0, prog: 0 });
  else if (t.kind === "lodge") s.lodges.push({ id: Math.max(0, ...s.lodges.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, meat: 0 });
  else if (t.kind === "well") s.wells.push({ id: Math.max(0, ...s.wells.map((m) => m.id)) + 1, gx: t.gx, gy: t.gy, rot, water: WELL_CAP, acc: 0 });
  else if (t.kind === "camp") s.camps.push({ id: Math.max(0, ...s.camps.map((c) => c.id)) + 1, gx: t.gx, gy: t.gy, wood: 0, rot });
  else s.depots.push({ id: Math.max(0, ...s.depots.map((d) => d.id)) + 1, gx: t.gx, gy: t.gy, wood: 0, rot });
  return true;
}

export const DISMANTLE_SEC = 5; // durée du démontage d'un bâtiment

export interface Gain {
  coins: number;
  wood: number; // bûches
  planks: number;
}

// Ce qu'on récupère en démontant un bâtiment : la moitié du prix, la moitié des matériaux de construction, et ce qu'il contenait.
export function dismantleGain(s: Save, b: House | Camp | Depot | Sawmill | Well | Lodge | Butcher | Port | Apiary | Clinic | Church | Farm | Stable | Pigpen | Market | Shipyard | Tavern): Gain {
  if (s.taverns.includes(b as Tavern)) return { coins: Math.floor(COSTS.tavern.coins / 2), wood: 0, planks: Math.floor(COSTS.tavern.mat / 2) };
  if (s.shipyards.includes(b as Shipyard)) return { coins: Math.floor(COSTS.shipyard.coins / 2), wood: 0, planks: Math.floor(COSTS.shipyard.mat / 2) };
  if (s.markets.includes(b as Market)) return { coins: Math.floor(COSTS.market.coins / 2), wood: 0, planks: Math.floor(COSTS.market.mat / 2) };
  if (s.pigpens.includes(b as Pigpen)) return { coins: Math.floor(COSTS.pigpen.coins / 2), wood: 0, planks: Math.floor(COSTS.pigpen.mat / 2) };
  if (s.stables.includes(b as Stable)) return { coins: Math.floor(COSTS.stable.coins / 2), wood: 0, planks: Math.floor(COSTS.stable.mat / 2) };
  if (s.farms.includes(b as Farm)) return { coins: Math.floor(COSTS.farm.coins / 2), wood: 0, planks: Math.floor(COSTS.farm.mat / 2) };
  if (s.churches.includes(b as Church)) return { coins: Math.floor(COSTS.church.coins / 2), wood: 0, planks: Math.floor(COSTS.church.mat / 2) };
  if (s.clinics.includes(b as Clinic)) return { coins: Math.floor(COSTS.clinic.coins / 2), wood: 0, planks: Math.floor(COSTS.clinic.mat / 2) };
  if (s.apiaries.includes(b as Apiary)) return { coins: Math.floor(COSTS.apiary.coins / 2), wood: 0, planks: Math.floor(COSTS.apiary.mat / 2) };
  if (s.ports.includes(b as Port)) return { coins: Math.floor(PORT_COST / 2), wood: 0, planks: Math.floor(PORT_PLANKS / 2) };
  if (s.butchers.includes(b as Butcher)) return { coins: Math.floor(BUTCHER_COST / 2), wood: 0, planks: Math.floor(BUTCHER_PLANKS / 2) };
  if (s.lodges.includes(b as Lodge)) return { coins: Math.floor(LODGE_COST / 2), wood: 0, planks: 0 };
  if (s.wells.includes(b as Well)) return { coins: Math.floor(WELL_COST / 2), wood: Math.floor(WELL_WOOD / 2), planks: 0 };
  if (s.sawmills.includes(b as Sawmill)) {
    const m = b as Sawmill;
    return { coins: Math.floor(SAWMILL_COST / 2), wood: Math.floor(SAWMILL_WOOD / 2) + m.logs, planks: m.planks };
  }
  if (s.houses.includes(b as House)) return { coins: Math.floor(HOUSE_COST / 2), wood: 0, planks: Math.floor(HOUSE_WOOD / 2) };
  if (s.camps.includes(b as Camp)) return { coins: Math.floor(CAMP_COST / 2), wood: (b as Camp).wood, planks: 0 };
  return { coins: 0, wood: (b as Depot).wood, planks: Math.floor(DEPOT_WOOD / 2) + ((b as Depot).planks ?? 0) };
}

// Le bâtiment devient un chantier de démontage : il se défait en DISMANTLE_SEC secondes, puis le gain est rendu (voir tickDismantle).
export function startDismantle(s: Save, b: House | Camp | Depot | Sawmill | Well | Lodge | Butcher | Port | Apiary | Clinic | Church | Farm | Stable | Pigpen | Market | Shipyard | Tavern) {
  const gain = dismantleGain(s, b);
  const kind: SiteKind = s.taverns.includes(b as Tavern) ? "tavern" : s.shipyards.includes(b as Shipyard) ? "shipyard" : s.markets.includes(b as Market) ? "market" : s.pigpens.includes(b as Pigpen) ? "pigpen" : s.stables.includes(b as Stable) ? "stable" : s.farms.includes(b as Farm) ? "farm" : s.churches.includes(b as Church) ? "church" : s.clinics.includes(b as Clinic) ? "clinic" : s.apiaries.includes(b as Apiary) ? "apiary" : s.ports.includes(b as Port) ? "port" : s.butchers.includes(b as Butcher) ? "butcher" : s.lodges.includes(b as Lodge) ? "lodge" : s.wells.includes(b as Well) ? "well" : s.sawmills.includes(b as Sawmill) ? "sawmill" : s.houses.includes(b as House) ? "house" : s.camps.includes(b as Camp) ? "camp" : "depot";
  s.houses = s.houses.filter((h) => h !== b);
  s.camps = s.camps.filter((c) => c !== b);
  s.depots = s.depots.filter((d) => d !== b);
  s.sawmills = s.sawmills.filter((m) => m !== b);
  s.wells = s.wells.filter((m) => m !== b);
  s.lodges = s.lodges.filter((m) => m !== b);
  s.butchers = s.butchers.filter((m) => m !== b);
  s.ports = s.ports.filter((m) => m !== b);
  s.apiaries = s.apiaries.filter((m) => m !== b);
  s.clinics = s.clinics.filter((m) => m !== b);
  s.churches = s.churches.filter((m) => m !== b);
  s.farms = s.farms.filter((m) => m !== b);
  s.stables = s.stables.filter((m) => m !== b);
  s.pigpens = s.pigpens.filter((m) => m !== b);
  s.markets = s.markets.filter((m) => m !== b);
  s.shipyards = s.shipyards.filter((m) => m !== b);
  s.taverns = s.taverns.filter((m) => m !== b);
  for (const w of s.workers) if (kind === "house" && w.home === (b as House).id) w.home = null;
  s.sites.push({ id: nextSiteId(s), kind, rot: b.rot, gx: b.gx, gy: b.gy, need: 0, have: 0, progress: 1, buildSec: DISMANTLE_SEC, undo: gain });
}

// Fait avancer les démontages ; renvoie ce qui vient d'être rendu pour chaque démontage terminé.
export function tickDismantle(s: Save, dt: number): Gain[] {
  const done: Gain[] = [];
  for (const t of [...s.sites]) {
    if (!t.undo) continue;
    t.progress -= dt / t.buildSec;
    if (t.progress > 0) continue;
    s.sites = s.sites.filter((x) => x !== t);
    s.coins += t.undo.coins;
    refundWood(s, t.undo.wood);
    refundPlanks(s, t.undo.planks);
    done.push(t.undo);
  }
  return done;
}

// Ce que rend l'annulation d'un chantier : la moitié des pièces et tous les matériaux déjà livrés.
export function siteRefund(t: Site): Gain {
  if (t.undo) return t.undo;
  const coins = t.kind === "pantry" ? Math.floor(COSTS.pantry.coins / 2) : t.kind === "tavern" ? Math.floor(COSTS.tavern.coins / 2) : t.kind === "shipyard" ? Math.floor(COSTS.shipyard.coins / 2) : t.kind === "market" ? Math.floor(COSTS.market.coins / 2) : t.kind === "pigpen" ? Math.floor(COSTS.pigpen.coins / 2) : t.kind === "stable" ? Math.floor(COSTS.stable.coins / 2) : t.kind === "farm" ? Math.floor(COSTS.farm.coins / 2) : t.kind === "church" ? Math.floor(COSTS.church.coins / 2) : t.kind === "clinic" ? Math.floor(COSTS.clinic.coins / 2) : t.kind === "apiary" ? Math.floor(COSTS.apiary.coins / 2) : t.kind === "port" ? Math.floor(PORT_COST / 2) : t.kind === "butcher" ? Math.floor(BUTCHER_COST / 2) : t.kind === "lodge" ? Math.floor(LODGE_COST / 2) : t.kind === "well" ? Math.floor(WELL_COST / 2) : t.kind === "camp" ? Math.floor(CAMP_COST / 2) : t.kind === "house" ? Math.floor(HOUSE_COST / 2) : t.kind === "sawmill" ? Math.floor(SAWMILL_COST / 2) : 0;
  return { coins, wood: t.mat === "plank" ? 0 : t.have, planks: t.mat === "plank" ? t.have : 0 };
}

// Annuler un chantier : la moitié des pièces et tout le bois déjà livré sont rendus.
export function removeSite(s: Save, t: Site) {
  s.sites = s.sites.filter((x) => x !== t);
  const g = siteRefund(t); // un démontage interrompu rend tout de suite ce qu'il devait rendre
  s.coins += g.coins;
  refundWood(s, g.wood);
  refundPlanks(s, g.planks);
}

// Case libre autour du chantier (hors coins), la plus proche de `from` : là où le bâtisseur se tient pour travailler.
export function workCell(s: Save, t: Site, from: Pos): Pos | null {
  const size = siteSize(t.kind);
  let best: Pos | null = null;
  let bestD = Infinity;
  for (let x = t.gx - 1; x <= t.gx + size; x++) {
    for (let y = t.gy - 1; y <= t.gy + size; y++) {
      const inX = x >= t.gx && x < t.gx + size;
      const inY = y >= t.gy && y < t.gy + size;
      if ((inX && inY) || (!inX && !inY)) continue; // dans le chantier, ou coin
      if (!walkable(s, x, y)) continue;
      const d = Math.hypot(x - from.gx, y - from.gy);
      if (d < bestD) {
        bestD = d;
        best = { gx: x, gy: y };
      }
    }
  }
  return best;
}

// Tourne un bâtiment d'un quart de tour, dans le sens des aiguilles d'une montre. Son entrée change de côté : on passe
// à la première orientation dont l'entrée est libre. Renvoie false s'il n'y a pas de place pour l'entrée.
export function rotateBuilding(s: Save, b: { gx: number; gy: number; rot?: number }, kind: SiteKind): boolean {
  const entrance = kind === "pantry" ? depotEntrance : kind === "tavern" ? tavernEntrance : kind === "shipyard" ? shipyardEntrance : kind === "market" ? marketEntrance : kind === "pigpen" ? pigpenEntrance : kind === "stable" ? stableEntrance : kind === "farm" ? farmEntrance : kind === "church" ? churchEntrance : kind === "clinic" ? clinicEntrance : kind === "apiary" ? apiaryEntrance : kind === "port" ? portEntrance : kind === "butcher" ? butcherEntrance : kind === "lodge" ? lodgeEntrance : kind === "well" ? wellEntrance : kind === "depot" ? depotEntrance : kind === "house" ? houseEntrance : kind === "sawmill" ? sawmillEntrance : campEntrance;
  const old = entrance(b);
  for (let k = 1; k <= 3; k++) {
    const rot = ((b.rot ?? 0) + k) % 4;
    const e = entrance({ gx: b.gx, gy: b.gy, rot });
    if (e.gx === old.gx && e.gy === old.gy) continue;
    if (!canBuild(s, e.gx, e.gy) || occupied(s, e.gx, e.gy) || isEntrance(s, e.gx, e.gy)) continue;
    b.rot = rot;
    return true;
  }
  return false;
}

// ---- Scierie : la première usine ----

export const SAWMILL_COST = STRUCTURES["sawmill"].cost;
export const SAWMILL_WOOD = STRUCTURES["sawmill"].woodCost ?? 0; // bûches à livrer pour la construire
export const SAWMILL_BUILD_SEC = STRUCTURES["sawmill"].buildSec;

// Une scierie occupe 3 × 3 cases à partir de (gx, gy).
export interface Sawmill {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  logs: number; // bûches en attente
  planks: number; // planches prêtes
  prog: number; // secondes de sciage de la planche en cours
}

export function sawmillAt(s: Save, gx: number, gy: number): Sawmill | null {
  return s.sawmills.find((m) => gx >= m.gx && gx <= m.gx + 2 && gy >= m.gy && gy <= m.gy + 2) ?? null;
}

export const sawmillEntrance = (m: Placed): Pos => entranceAt(m, 3, 1); // sous la porte, comme le dépôt
export const canPlaceSawmill = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, 3) && entranceOk(s, sawmillEntrance({ gx, gy, rot }));

// Pose une scierie : fondations (pièces payées), puis il faut y livrer SAWMILL_WOOD bûches.
export function placeSawmill(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = sawmillEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, 3) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceSawmill(s, gx, gy, rot)) return "blocked";
  if (s.coins < SAWMILL_COST) return "poor";
  s.coins -= SAWMILL_COST;
  if (instant) s.sawmills.push({ id: Math.max(0, ...s.sawmills.map((m) => m.id)) + 1, gx, gy, rot, logs: 0, planks: 0, prog: 0 });
  else s.sites.push({ id: nextSiteId(s), kind: "sawmill", rot, gx, gy, need: SAWMILL_WOOD, mat: "wood", have: 0, progress: 0, buildSec: SAWMILL_BUILD_SEC });
  return "ok";
}

export function removeSawmill(s: Save, m: Sawmill) {
  s.sawmills = s.sawmills.filter((x) => x !== m);
  s.coins += Math.floor(SAWMILL_COST / 2);
  refundWood(s, Math.floor(SAWMILL_WOOD / 2));
}

// Elle scie tant qu'elle a de quoi faire une planche et de la place pour la ranger.
export const sawmillWorking = (m: Sawmill) => m.logs >= LOGS_PER_PLANK && m.planks < SAWMILL_PLANKS_CAP;

// Fait tourner les scieries ; renvoie true si quelque chose a bougé (à sauvegarder).
// staff : combien d'ouvriers travaillent sur place (sans ouvrier, la scierie ne scie pas ; chacun double la cadence).
export function tickSawmills(s: Save, dt: number, staff: (id: number) => number = () => 1): boolean {
  let moved = false;
  for (const m of s.sawmills) {
    if (!sawmillWorking(m)) {
      m.prog = 0;
      continue;
    }
    const crew = staff(m.id);
    if (crew <= 0) continue;
    moved = true;
    m.prog += dt * crew;
    while (m.prog >= PLANK_SEC && sawmillWorking(m)) {
      m.prog -= PLANK_SEC;
      m.logs -= LOGS_PER_PLANK;
      m.planks++;
    }
  }
  return moved;
}

// Un porteur livre des bûches à la scierie ; renvoie ce qu'elle a pu prendre.
export function addLogs(m: Sawmill, n: number): number {
  const taken = Math.max(0, Math.min(n, SAWMILL_LOGS_CAP - m.logs));
  m.logs += taken;
  return taken;
}

// Un bâtisseur prend des planches ; renvoie la quantité prise.
export function takePlanks(m: Sawmill, max: number): number {
  const taken = Math.max(0, Math.min(m.planks, max));
  m.planks -= taken;
  return taken;
}

export const planksStock = (s: Save) => s.sawmills.reduce((a, m) => a + m.planks, 0) + s.depots.reduce((a, d) => a + (d.planks ?? 0), 0);

// Améliore un dépôt d'un niveau : pièces + planches prises dans les dépôts puis les scieries.
export function upgradeDepot(s: Save, d: Depot): "ok" | "max" | "poor" | "planks" {
  const lv = depotLevel(d);
  if (lv >= DEPOT_LEVELS.length) return "max";
  const next = DEPOT_LEVELS[lv];
  if (s.coins < next.coins) return "poor";
  if (planksStock(s) < next.planks) return "planks";
  s.coins -= next.coins;
  let left = next.planks;
  for (const x of [...s.depots, ...s.sawmills]) {
    if (left <= 0) break;
    if ("wood" in x) {
      const t = Math.min(left, x.planks ?? 0);
      x.planks = (x.planks ?? 0) - t;
      left -= t;
    } else {
      const t = Math.min(left, (x as Sawmill).planks);
      (x as Sawmill).planks -= t;
      left -= t;
    }
  }
  d.level = lv + 1;
  return "ok";
}

// Rend des planches : dans une scierie qui a de la place, sinon dans un dépôt (sinon elles sont perdues).
export function refundPlanks(s: Save, n: number) {
  let left = n;
  for (const m of s.sawmills) {
    const t = Math.max(0, Math.min(left, SAWMILL_PLANKS_CAP - m.planks));
    m.planks += t;
    left -= t;
  }
  for (const d of s.depots) left -= addPlanksToDepot(d, left);
}

// ---- Eau : le puits et la soif des foyers ----

export const WELL_COST = STRUCTURES["well"].cost;
export const WELL_WOOD = STRUCTURES["well"].woodCost ?? 0; // bûches à livrer pour le construire
export const WELL_BUILD_SEC = STRUCTURES["well"].buildSec;

// Un puits occupe 2 × 2 cases à partir de (gx, gy).
export interface Well {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  water: number;
  acc: number; // secondes depuis la dernière unité d'eau remontée
}

export function wellAt(s: Save, gx: number, gy: number): Well | null {
  return s.wells.find((m) => gx >= m.gx && gx <= m.gx + 1 && gy >= m.gy && gy <= m.gy + 1) ?? null;
}

export const wellEntrance = (m: Placed): Pos => entranceAt(m, 2, 0);
export const canPlaceWell = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, 2) && entranceOk(s, wellEntrance({ gx, gy, rot }));

// Pose un puits : fondations (pièces payées), puis il faut y livrer WELL_WOOD bûches.
export function placeWell(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = wellEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, 2) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceWell(s, gx, gy, rot)) return "blocked";
  if (s.coins < WELL_COST) return "poor";
  s.coins -= WELL_COST;
  if (instant) s.wells.push({ id: Math.max(0, ...s.wells.map((m) => m.id)) + 1, gx, gy, rot, water: WELL_CAP, acc: 0 });
  else s.sites.push({ id: nextSiteId(s), kind: "well", rot, gx, gy, need: WELL_WOOD, mat: "wood", have: 0, progress: 0, buildSec: WELL_BUILD_SEC });
  return "ok";
}

export function removeWell(s: Save, m: Well) {
  s.wells = s.wells.filter((x) => x !== m);
  s.coins += Math.floor(WELL_COST / 2);
  refundWood(s, Math.floor(WELL_WOOD / 2));
}

// Les puits se remplissent tout seuls ; renvoie true si quelque chose a bougé.
export function tickWells(s: Save, dt: number): boolean {
  let moved = false;
  for (const m of s.wells) {
    if (m.water >= WELL_CAP) {
      m.acc = 0;
      continue;
    }
    moved = true;
    m.acc += dt;
    while (m.acc >= WELL_REFILL_SEC && m.water < WELL_CAP) {
      m.acc -= WELL_REFILL_SEC;
      m.water++;
    }
  }
  return moved;
}

// La soif monte pour chaque villageois ; il la calme chez lui (voir Worker), en prenant une unité de la réserve de sa maison.
export function tickThirst(s: Save, dt: number): boolean {
  for (const w of s.workers) w.thirst = Math.min(100, (w.thirst ?? 0) + (dt * 100) / THIRST_FULL_SEC);
  return false;
}

// Un porteur d'eau remplit sa cruche au puits ; renvoie la quantité prise.
export function takeWater(m: Well, max: number): number {
  const taken = Math.max(0, Math.min(m.water, max));
  m.water -= taken;
  return taken;
}

// Il vide sa cruche dans une maison ; renvoie ce que la maison a pu prendre.
export function addWater(h: House, n: number): number {
  const taken = Math.max(0, Math.min(n, HOUSE_WATER_CAP - (h.water ?? 0)));
  h.water = (h.water ?? 0) + taken;
  return taken;
}

// Les habitants d'une maison sans eau ont soif.
export const houseThirsty = (h: House) => (h.water ?? 0) <= 0;

// ---- Chasse : le camp de chasseur ----

export const LODGE_COST = STRUCTURES["hunter-camp"].cost;
export const LODGE_BUILD_SEC = STRUCTURES["hunter-camp"].buildSec;

// Un camp de chasseur occupe 2 × 2 cases à partir de (gx, gy).
export interface Lodge {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  meat: number; // portions de viande rapportées
}

export function lodgeAt(s: Save, gx: number, gy: number): Lodge | null {
  return s.lodges.find((m) => gx >= m.gx && gx <= m.gx + 1 && gy >= m.gy && gy <= m.gy + 1) ?? null;
}

export const lodgeEntrance = (m: Placed): Pos => entranceAt(m, 2, 0);
export const lodgeFree = (m: Lodge) => Math.max(0, LODGE_CAP - m.meat);
export const canPlaceLodge = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, 2) && entranceOk(s, lodgeEntrance({ gx, gy, rot }));

// Pose un camp de chasseur : fondations (pièces payées), puis un bâtisseur le construit (aucun matériau).
export function placeLodge(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = lodgeEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, 2) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceLodge(s, gx, gy, rot)) return "blocked";
  if (s.coins < LODGE_COST) return "poor";
  s.coins -= LODGE_COST;
  if (instant) s.lodges.push({ id: Math.max(0, ...s.lodges.map((m) => m.id)) + 1, gx, gy, rot, meat: 0 });
  else s.sites.push({ id: nextSiteId(s), kind: "lodge", rot, gx, gy, need: 0, have: 0, progress: 0, buildSec: LODGE_BUILD_SEC });
  return "ok";
}

export function removeLodge(s: Save, m: Lodge) {
  s.lodges = s.lodges.filter((x) => x !== m);
  s.coins += Math.floor(LODGE_COST / 2);
}

// Un chasseur dépose sa viande ; renvoie ce que le camp a pu prendre.
export function addMeat(m: Lodge, n: number): number {
  const taken = Math.max(0, Math.min(n, lodgeFree(m)));
  m.meat += taken;
  return taken;
}

export const meatStock = (s: Save) => s.lodges.reduce((a, m) => a + m.meat, 0) + s.depots.reduce((a, d) => a + (d.meat ?? 0), 0);

// ---- Boucherie : la deuxième usine ----

// Où un porteur livre : un dépôt (planches), une scierie (bûches) ou une boucherie (viande).
export type HaulDest = "depot" | "sawmill" | "butcher" | "port";
export const haulDest = (job: { sawmill?: boolean; dest?: HaulDest | "any" }): HaulDest => (job.dest && job.dest !== "any" ? job.dest : job.sawmill ? "sawmill" : "depot");

export const BUTCHER_COST = STRUCTURES["butcher"].cost;
export const BUTCHER_PLANKS = STRUCTURES["butcher"].woodCost ?? 0; // planches à livrer pour la construire
export const BUTCHER_BUILD_SEC = STRUCTURES["butcher"].buildSec;

// Une boucherie occupe 3 × 3 cases à partir de (gx, gy).
export interface Butcher {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  meat: number; // viande brute en attente
  cuts: number; // viande préparée prête
  prog: number; // secondes de travail sur la portion en cours
}

export function butcherAt(s: Save, gx: number, gy: number): Butcher | null {
  return s.butchers.find((m) => gx >= m.gx && gx <= m.gx + 2 && gy >= m.gy && gy <= m.gy + 2) ?? null;
}

export const butcherEntrance = (m: Placed): Pos => entranceAt(m, 3, 1);
export const canPlaceButcher = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, 3) && entranceOk(s, butcherEntrance({ gx, gy, rot }));

// Pose une boucherie : fondations (pièces payées), puis il faut y livrer BUTCHER_PLANKS planches.
export function placeButcher(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = butcherEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, 3) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceButcher(s, gx, gy, rot)) return "blocked";
  if (s.coins < BUTCHER_COST) return "poor";
  s.coins -= BUTCHER_COST;
  if (instant) s.butchers.push({ id: Math.max(0, ...s.butchers.map((m) => m.id)) + 1, gx, gy, rot, meat: 0, cuts: 0, prog: 0 });
  else s.sites.push({ id: nextSiteId(s), kind: "butcher", rot, gx, gy, need: BUTCHER_PLANKS, mat: "plank", have: 0, progress: 0, buildSec: BUTCHER_BUILD_SEC });
  return "ok";
}

export function removeButcher(s: Save, m: Butcher) {
  s.butchers = s.butchers.filter((x) => x !== m);
  s.coins += Math.floor(BUTCHER_COST / 2);
  refundPlanks(s, Math.floor(BUTCHER_PLANKS / 2));
}

// Elle découpe tant qu'elle a de la viande à préparer et de la place pour la ranger.
export const butcherWorking = (m: Butcher) => m.meat >= 1 && m.cuts < BUTCHER_CUTS_CAP;

// Fait tourner les boucheries ; renvoie true si quelque chose a bougé (à sauvegarder).
export function tickButchers(s: Save, dt: number, staff: (id: number) => number = () => 1): boolean {
  let moved = false;
  for (const m of s.butchers) {
    if (!butcherWorking(m)) {
      m.prog = 0;
      continue;
    }
    const crew = staff(m.id);
    if (crew <= 0) continue;
    moved = true;
    m.prog += dt * crew;
    while (m.prog >= CUT_SEC && butcherWorking(m)) {
      m.prog -= CUT_SEC;
      m.meat -= 1;
      m.cuts += 1;
    }
  }
  return moved;
}

// Un porteur livre de la viande brute ; renvoie ce que la boucherie a pu prendre.
export function addRawMeat(m: Butcher, n: number): number {
  const taken = Math.max(0, Math.min(n, BUTCHER_MEAT_CAP - m.meat));
  m.meat += taken;
  return taken;
}

// Un porteur prend de la viande au camp de chasseur ; renvoie la quantité prise.
export function takeMeat(m: Lodge, max: number): number {
  const taken = Math.max(0, Math.min(m.meat, max));
  m.meat -= taken;
  return taken;
}

export const cutsStock = (s: Save) => s.butchers.reduce((a, m) => a + m.cuts, 0) + s.depots.reduce((a, d) => a + (d.cuts ?? 0), 0);

// ---- Nourriture des foyers ----


// La faim monte pour chaque villageois ; il la calme chez lui, en prenant une portion de la réserve de sa maison.
export function tickHunger(s: Save, dt: number): boolean {
  for (const w of s.workers) {
    if ((w.fedFor ?? 0) > 0) {
      w.fedFor = Math.max(0, (w.fedFor ?? 0) - dt); // un bon repas : pas de faim tant qu'il rassasie
      continue;
    }
    w.hunger = Math.min(100, (w.hunger ?? 0) + (dt * 100) / HUNGER_FULL_SEC);
  }
  return false;
}

// Un habitant prend de la viande préparée à la boucherie ; renvoie la quantité prise.
export function takeCuts(m: Butcher, max: number): number {
  const taken = Math.max(0, Math.min(m.cuts, max));
  m.cuts -= taken;
  return taken;
}

// Il la range dans sa maison ; renvoie ce que la maison a pu prendre.
export function addFood(h: House, n: number): number {
  const taken = Math.max(0, Math.min(n, HOUSE_FOOD_CAP - (h.food ?? 0)));
  h.food = (h.food ?? 0) + taken;
  return taken;
}

// ---- Faim ----

// Les habitants d'une maison sans nourriture ont faim.
export const houseHungry = (h: House) => (h.food ?? 0) <= 0;

// ---- Port : exporter des marchandises ----

export const PORT_COST = COSTS.port.coins;
export const PORT_PLANKS = COSTS.port.mat; // planches à livrer pour le construire
export { PORT_CAP, PORT_QUOTA_DEFAULT, PRICE_CUTS, PRICE_HONEY, PRICE_BERRIES, PRICE_PLANK, SHIP_CYCLE, HONEY_CAP, HARVEST_MAX };

// Un cycle de bateau, en fraction de SHIP_CYCLE : au large, il arrive, charge à quai, repart. La vente a lieu au départ.
export const SHIP_ARRIVE = 0.58;
export const SHIP_DOCKED = 0.65;
export const SHIP_DEPART = 0.73;
export const SHIP_GONE = 0.8;

// Un port occupe 3 × 3 cases à partir de (gx, gy). Son quai (côté nord quand rot = 0) fait face à l'eau ; l'entrée est du côté opposé.
export interface Port {
  id: number;
  gx: number;
  gy: number;
  rot?: number; // côté du quai : 0 nord, 1 est, 2 sud, 3 ouest (choisi tout seul d'après la côte)
  stock: Partial<Record<ExportGood, number>>; // ce qui attend le bateau au quai, par ressource
  reserve?: Partial<Record<ExportGood, number>>; // stock minimum à garder au village, par ressource : on n'exporte que ce qui dépasse
  quota: Partial<Record<ExportGood, number>>; // combien exporter par bateau, par ressource (0 : on n'en exporte pas)
  t: number; // secondes écoulées dans le cycle du bateau
}

export function portAt(s: Save, gx: number, gy: number): Port | null {
  return s.ports.find((m) => gx >= m.gx && gx <= m.gx + 2 && gy >= m.gy && gy <= m.gy + 2) ?? null;
}

export const portEntrance = (m: Placed): Pos => entranceAt(m, 3, 1);

// Côté du quai pour un port posé en (gx, gy) : un côté dont au moins deux cases voisines sont de l'eau, et dont le côté opposé
// laisse une entrée constructible. Renvoie -1 si ce n'est pas une côte.
export function portRot(s: Save, gx: number, gy: number): number {
  // le terrain du port : herbe dégagée ou sable, libre
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      const x = gx + dx;
      const y = gy + dy;
      const t = terrainAt(x, y);
      if (t !== T.Grass && t !== T.Sand) return -1;
      if (t === T.Grass && !canBuild(s, x, y)) return -1;
      if (occupied(s, x, y) || roadAt(s, x, y) || isEntrance(s, x, y)) return -1;
      if (s.cells[y * GRID + x].kind !== "grass") return -1;
    }
  }
  for (let rot = 0; rot < 4; rot++) {
    const outside: Pos[] = [];
    for (let k = 0; k < 3; k++) outside.push(rot === 0 ? { gx: gx + k, gy: gy - 1 } : rot === 1 ? { gx: gx + 3, gy: gy + k } : rot === 2 ? { gx: gx + k, gy: gy + 3 } : { gx: gx - 1, gy: gy + k });
    const wet = outside.filter((c) => isWater(terrainAt(c.gx, c.gy))).length;
    if (wet < 2) continue;
    const door = portEntrance({ gx, gy, rot });
    if (canBuild(s, door.gx, door.gy) && !occupied(s, door.gx, door.gy)) return rot;
  }
  return -1;
}

export const canPlacePort = (s: Save, gx: number, gy: number) => portRot(s, gx, gy) >= 0;

// Pose un port : fondations (pièces payées), puis il faut y livrer PORT_PLANKS planches. L'orientation vient de la côte.
export function placePort(s: Save, gx: number, gy: number, instant = false): BuildResult {
  const rot = portRot(s, gx, gy);
  if (rot < 0) return "terrain";
  if (s.coins < PORT_COST) return "poor";
  s.coins -= PORT_COST;
  if (instant) s.ports.push({ id: Math.max(0, ...s.ports.map((m) => m.id)) + 1, gx, gy, rot, stock: {}, quota: {}, t: 0 });
  else s.sites.push({ id: nextSiteId(s), kind: "port", rot, gx, gy, need: PORT_PLANKS, mat: "plank", have: 0, progress: 0, buildSec: COSTS.port.sec });
  return "ok";
}

export function removePort(s: Save, m: Port) {
  s.ports = s.ports.filter((x) => x !== m);
  s.coins += Math.floor(PORT_COST / 2);
  refundPlanks(s, Math.floor(PORT_PLANKS / 2));
}

// Les marchandises qu'un port peut exporter (voir EXPORT_GOODS).
export type Good = ExportGood;
export const EXPORT_LIST = Object.keys(EXPORT_GOODS) as ExportGood[];

export const portStock = (m: Port, good: Good) => m.stock[good] ?? 0;
export const portQuota = (m: Port, good: Good) => m.quota[good] ?? PORT_QUOTA_DEFAULT;
export const portReserve = (m: Port, good: Good) => m.reserve?.[good] ?? 0;

// Place restante pour une marchandise : le quota choisi moins ce qui attend déjà le bateau.
export const portSpace = (m: Port, good: Good) => Math.max(0, portQuota(m, good) - portStock(m, good));
export const portFree = (m: Port) => EXPORT_LIST.reduce((a, g) => a + portSpace(m, g), 0);

// Le port attend-il encore de cette marchandise ?
export const portAccepts = (m: Port, good: Good) => portSpace(m, good) > 0;

// Un porteur dépose des marchandises au port, dans la limite du quota ; renvoie ce qu'il a pu prendre.
export function addToPort(m: Port, n: number, good: Good): number {
  const taken = Math.max(0, Math.min(n, portSpace(m, good)));
  m.stock[good] = portStock(m, good) + taken;
  return taken;
}

// Avancement des bateaux. Quand un bateau repart, il emporte et paie tout ce qui attendait au quai.
export function tickPorts(s: Save, dt: number): { port: Port; coins: number }[] {
  const sales: { port: Port; coins: number }[] = [];
  for (const m of s.ports) {
    const before = m.t / SHIP_CYCLE;
    m.t += dt;
    const now = m.t / SHIP_CYCLE;
    const waiting = EXPORT_LIST.reduce((a, g) => a + portStock(m, g), 0);
    if (before < SHIP_DEPART && now >= SHIP_DEPART && waiting > 0) {
      const coins = EXPORT_LIST.reduce((a, g) => a + portStock(m, g) * EXPORT_GOODS[g].price, 0);
      sales.push({ port: m, coins });
      s.coins += coins;
      m.stock = {};
    }
    if (m.t >= SHIP_CYCLE) m.t -= SHIP_CYCLE;
  }
  return sales;
}

// D'où un porteur peut prendre des marchandises pour le port : dépôts (tout), scieries (planches), boucheries (viande préparée),
// camps de bûcheron (bûches), camps de chasseur (viande brute).
export type ExportSrcKind = "depot" | "sawmill" | "butcher" | "camp" | "lodge";
export type ExportSrc = Depot | Sawmill | Butcher | Camp | Lodge;

// Ce qu'une source a en stock, par ressource.
export function goodsOf(kind: ExportSrcKind, src: ExportSrc): Partial<Record<ExportGood, number>> {
  if (kind === "depot") {
    const d = src as Depot;
    return { plank: d.planks ?? 0, cuts: d.cuts ?? 0, honey: d.honey ?? 0, berries: d.berries ?? 0, wood: d.wood, meat: d.meat ?? 0, milk: d.milk ?? 0, wheat: d.crops?.wheat ?? 0, corn: d.crops?.corn ?? 0, tomato: d.crops?.tomato ?? 0, carrot: d.crops?.carrot ?? 0, grass: d.crops?.grass ?? 0 };
  }
  if (kind === "sawmill") return { plank: (src as Sawmill).planks };
  if (kind === "butcher") return { cuts: (src as Butcher).cuts };
  if (kind === "camp") return { wood: (src as Camp).wood };
  return { meat: (src as Lodge).meat };
}

// Prend jusqu'à `max` unités de cette ressource à la source ; renvoie ce qui a été pris.
export function takeGood(kind: ExportSrcKind, src: ExportSrc, good: Good, max: number): number {
  const have = goodsOf(kind, src)[good] ?? 0;
  const n = Math.max(0, Math.min(max, have));
  if (n <= 0) return 0;
  if (kind === "depot") {
    const d = src as Depot;
    if (good === "plank") d.planks = (d.planks ?? 0) - n;
    else if (good === "cuts") d.cuts = (d.cuts ?? 0) - n;
    else if (good === "honey") d.honey = (d.honey ?? 0) - n;
    else if (good === "berries") d.berries = (d.berries ?? 0) - n;
    else if (good === "wood") d.wood -= n;
    else if (good === "milk") d.milk = (d.milk ?? 0) - n;
    else if (good === "meat") d.meat = (d.meat ?? 0) - n;
    else if (good === "wheat" || good === "corn" || good === "tomato" || good === "carrot" || good === "grass") d.crops = { ...(d.crops ?? {}), [good]: (d.crops?.[good] ?? 0) - n };
  } else if (kind === "sawmill") (src as Sawmill).planks -= n;
  else if (kind === "butcher") (src as Butcher).cuts -= n;
  else if (kind === "camp") (src as Camp).wood -= n;
  else (src as Lodge).meat -= n;
  return n;
}

// Tout ce que le village a en stock de cette ressource (dépôts, scieries, boucheries, camps de bûcheron et de chasseur).
export function villageStock(s: Save, good: Good): number {
  let n = 0;
  for (const d of s.depots) n += goodsOf("depot", d)[good] ?? 0;
  for (const m of s.sawmills) n += goodsOf("sawmill", m)[good] ?? 0;
  for (const m of s.butchers) n += goodsOf("butcher", m)[good] ?? 0;
  for (const m of s.camps) n += goodsOf("camp", m)[good] ?? 0;
  for (const m of s.lodges) n += goodsOf("lodge", m)[good] ?? 0;
  return n;
}

// Ce qui peut vraiment partir à l'export : le stock du village moins le stock minimum que le joueur veut garder.
export const exportable = (s: Save, port: Port, good: Good) => Math.max(0, villageStock(s, good) - portReserve(port, good));

// La première ressource que cette source peut offrir à ce port (selon ses quotas et son stock minimum), et combien.
export function exportableOf(kind: ExportSrcKind, src: ExportSrc, port: Port, s: Save): { good: Good; n: number } | null {
  const have = goodsOf(kind, src);
  for (const g of EXPORT_LIST) {
    const n = Math.min(have[g] ?? 0, portSpace(port, g), exportable(s, port, g));
    if (n > 0) return { good: g, n };
  }
  return null;
}

// Tout ce que cette source peut offrir à ce port, toutes ressources confondues.
export const exportableTotal = (kind: ExportSrcKind, src: ExportSrc, port: Port, s: Save) => {
  const have = goodsOf(kind, src);
  return EXPORT_LIST.reduce((a, g) => a + Math.min(have[g] ?? 0, portSpace(port, g), exportable(s, port, g)), 0);
};

// ---- Rucher : du miel pour l'apiculteur ----

// Un rucher occupe 2 × 2 cases à partir de (gx, gy) : quatre ruches.
export interface Apiary {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  care: number; // soin des ruches, de 0 (à l'abandon) à 100 : il baisse tout seul, l'apiculteur le remet à 100
  honey: number; // pots de miel prêts
  acc: number; // secondes de butinage accumulées vers le prochain pot
}

export function apiaryAt(s: Save, gx: number, gy: number): Apiary | null {
  return s.apiaries.find((m) => gx >= m.gx && gx <= m.gx + 1 && gy >= m.gy && gy <= m.gy + 1) ?? null;
}

export const apiaryEntrance = (m: Placed): Pos => entranceAt(m, 2, 0);
export const canPlaceApiary = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, 2) && entranceOk(s, apiaryEntrance({ gx, gy, rot }));

// Pose un rucher : fondations (pièces payées), puis il faut y livrer des planches.
export function placeApiary(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = apiaryEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, 2) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceApiary(s, gx, gy, rot)) return "blocked";
  if (s.coins < COSTS.apiary.coins) return "poor";
  s.coins -= COSTS.apiary.coins;
  if (instant) s.apiaries.push({ id: Math.max(0, ...s.apiaries.map((m) => m.id)) + 1, gx, gy, rot, care: 100, honey: 0, acc: 0 });
  else s.sites.push({ id: nextSiteId(s), kind: "apiary", rot, gx, gy, need: COSTS.apiary.mat, mat: "plank", have: 0, progress: 0, buildSec: COSTS.apiary.sec });
  return "ok";
}

export function removeApiary(s: Save, m: Apiary) {
  s.apiaries = s.apiaries.filter((x) => x !== m);
  s.coins += Math.floor(COSTS.apiary.coins / 2);
  refundPlanks(s, Math.floor(COSTS.apiary.mat / 2));
}

// Les abeilles butinent : sans soin, le rucher se dégrade puis ne produit plus ; en hiver elles dorment (rien ne bouge).
// honey : facteur de production de la saison ; hive : facteur de dégradation. Renvoie true si quelque chose a bougé.
export function tickApiaries(s: Save, dt: number, honey: number, hive: number): boolean {
  let moved = false;
  for (const m of s.apiaries) {
    if (hive > 0 && m.care > 0) {
      m.care = Math.max(0, m.care - (dt * 100 * hive) / HIVE_CARE_SEC);
      moved = true;
    }
    if (honey > 0 && m.care > 0 && m.honey < HONEY_CAP) {
      m.acc += dt * (m.care / 100) * honey; // plus les ruches sont soignées, plus elles produisent
      while (m.acc >= HONEY_SEC && m.honey < HONEY_CAP) {
        m.acc -= HONEY_SEC;
        m.honey++;
      }
      moved = true;
    }
  }
  return moved;
}

// Ruches en activité : soignées, en saison, et de la place pour le miel.
export const apiaryBusy = (m: Apiary, honeyFactor: number) => honeyFactor > 0 && m.care > 0 && m.honey < HONEY_CAP;

// L'apiculteur soigne les ruches, puis récolte.
export function tendApiary(m: Apiary) {
  m.care = 100;
}
export function harvestApiary(m: Apiary, max: number): number {
  const taken = Math.max(0, Math.min(m.honey, max));
  m.honey -= taken;
  return taken;
}

// Un apiculteur dépose du miel dans ce dépôt, dans la limite de sa place ; renvoie la quantité acceptée.
export function addHoneyToDepot(d: Depot, n: number): number {
  const taken = Math.max(0, Math.min(n, depotFree(d)));
  d.honey = (d.honey ?? 0) + taken;
  return taken;
}

export const honeyStock = (s: Save) => s.apiaries.reduce((a, m) => a + m.honey, 0) + s.depots.reduce((a, d) => a + (d.honey ?? 0), 0);

// ---- Âge ----

export interface AgeEvent {
  type: "warn" | "death";
  worker: WorkerSave;
}

// Les villageois vieillissent ; renvoie ceux qui approchent de la fin ou qui meurent de vieillesse.
export function tickAging(s: Save, dt: number): AgeEvent[] {
  const ev: AgeEvent[] = [];
  for (const w of s.workers) {
    w.age = (w.age ?? 25) + (dt / DAY_SEC) * AGE_YEARS_PER_DAY;
    const life = w.lifespan ?? 80;
    if (w.age >= life) ev.push({ type: "death", worker: w });
    else if (w.age >= life - AGE_WARN && !w.oldWarned) {
      w.oldWarned = true;
      ev.push({ type: "warn", worker: w });
    }
  }
  return ev;
}

// ---- Récoltes dans les dépôts ----

// Les récoltes d'un dépôt ; edible : sans l'herbe (réservée aux vaches).
export const cropTotal = (d: Depot, edible = false) => Object.entries(d.crops ?? {}).reduce<number>((a, [c, n]) => a + (edible && c === "grass" ? 0 : n ?? 0), 0);

// Un fermier range sa récolte dans ce dépôt, dans la limite de sa place ; renvoie la quantité acceptée.
export function addCropToDepot(d: Depot, crop: FarmCrop, n: number): number {
  const taken = Math.max(0, Math.min(n, depotFree(d)));
  d.crops = { ...(d.crops ?? {}), [crop]: (d.crops?.[crop] ?? 0) + taken };
  return taken;
}

// Prend jusqu'à `max` unités de la culture la plus abondante du dépôt.
export function takeCropFromDepot(d: Depot, max: number, edible = false): { crop: FarmCrop; n: number } | null {
  let best: FarmCrop | null = null;
  for (const c of Object.keys(FARM_CROPS) as FarmCrop[]) if (!(edible && c === "grass") && (d.crops?.[c] ?? 0) > (best ? d.crops?.[best] ?? 0 : 0)) best = c;
  if (!best) return null;
  const n = Math.min(max, d.crops?.[best] ?? 0);
  d.crops = { ...(d.crops ?? {}), [best]: (d.crops?.[best] ?? 0) - n };
  return { crop: best, n };
}

// Les récoltes de tous les dépôts, par culture.
export function cropStock(s: Save): Record<FarmCrop, number> {
  const out = { wheat: 0, corn: 0, tomato: 0, carrot: 0, grass: 0 };
  for (const d of s.depots) for (const c of Object.keys(out) as FarmCrop[]) out[c] += d.crops?.[c] ?? 0;
  return out;
}

// ---- Étable et vaches ----

export interface Cow {
  eat: number; // secondes depuis son dernier repas
  drink: number; // secondes depuis sa dernière gorgée
  acc: number; // secondes de production accumulées vers le prochain lait
}

export interface Stable {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  cows: Cow[];
  feed: number; // l'auge : herbe en réserve
  water: number; // l'abreuvoir : eau en réserve
  milk: number; // lait trait, à ramasser
}

export function stableAt(s: Save, gx: number, gy: number): Stable | null {
  return s.stables.find((m) => gx >= m.gx && gx < m.gx + STABLE_SIZE && gy >= m.gy && gy < m.gy + STABLE_SIZE) ?? null;
}

export const stableEntrance = (m: Placed): Pos => entranceAt(m, STABLE_SIZE, 1);
export const canPlaceStable = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, STABLE_SIZE) && entranceOk(s, stableEntrance({ gx, gy, rot }));

export function placeStable(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = stableEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, STABLE_SIZE) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceStable(s, gx, gy, rot)) return "blocked";
  if (s.coins < COSTS.stable.coins) return "poor";
  s.coins -= COSTS.stable.coins;
  if (instant) s.stables.push({ id: Math.max(0, ...s.stables.map((m) => m.id)) + 1, gx, gy, rot, cows: [], feed: 0, water: 0, milk: 0 });
  else s.sites.push({ id: nextSiteId(s), kind: "stable", rot, gx, gy, need: COSTS.stable.mat, mat: "plank", have: 0, progress: 0, buildSec: COSTS.stable.sec });
  return "ok";
}

export function removeStable(s: Save, m: Stable) {
  s.stables = s.stables.filter((x) => x !== m);
  s.coins += Math.floor(COSTS.stable.coins / 2) + m.cows.length * COW_SELL; // les vaches sont revendues
  refundPlanks(s, Math.floor(COSTS.stable.mat / 2));
}

const newCow = (): Cow => ({ eat: 0, drink: 0, acc: 0 });

// Achète une vache pour cette étable (s'il y a de la place et assez de pièces).
export function buyCow(s: Save, m: Stable): "ok" | "poor" | "full" {
  if (m.cows.length >= STABLE_COWS_MAX) return "full";
  if (s.coins < COW_PRICE) return "poor";
  s.coins -= COW_PRICE;
  m.cows.push(newCow());
  return "ok";
}

// Revend une vache.
export function sellCow(s: Save, m: Stable): boolean {
  if (!m.cows.length) return false;
  m.cows.pop();
  s.coins += COW_SELL;
  return true;
}

// L'état d'une vache : nourrie / a faim, abreuvée / a soif.
export const cowFed = (c: Cow) => c.eat < COW_EAT_SEC * 1.5;
export const cowWatered = (c: Cow) => c.drink < COW_DRINK_SEC * 1.5;

// Les vaches mangent et boivent ce qu'il y a dans l'auge et l'abreuvoir, et donnent du lait quand elles sont nourries et abreuvées.
export function tickStables(s: Save, dt: number, seasonIndex: number) {
  for (const m of s.stables) {
    for (const c of m.cows) {
      c.eat += dt;
      c.drink += dt;
      if (c.eat >= COW_EAT_SEC && m.feed >= 1) {
        m.feed -= 1;
        c.eat = 0;
      }
      if (c.drink >= COW_DRINK_SEC && m.water >= 1) {
        m.water -= 1;
        c.drink = 0;
      }
      if (cowFed(c) && cowWatered(c) && m.milk < STABLE_MILK_CAP) {
        c.acc += dt * (MILK_SEASON[seasonIndex] ?? 1);
        while (c.acc >= MILK_SEC && m.milk < STABLE_MILK_CAP) {
          c.acc -= MILK_SEC;
          m.milk += 1;
        }
      }
    }
  }
}

// Une case du plan de l'étable (de 0 à 3, dessinée à l'endroit), ramenée à sa vraie place selon l'orientation.
function stableLocal(m: Stable, cx: number, cy: number): Pos {
  let vx = cx + 0.5 - STABLE_SIZE / 2;
  let vy = cy + 0.5 - STABLE_SIZE / 2;
  for (let i = 0; i < (m.rot ?? 0) % 4; i++) [vx, vy] = [-vy, vx];
  return { gx: m.gx + Math.floor(STABLE_SIZE / 2 + vx), gy: m.gy + Math.floor(STABLE_SIZE / 2 + vy) };
}
// où l'éleveur trait les vaches, et où il remplit l'auge et l'abreuvoir
export const stableMilkCell = (m: Stable): Pos => stableLocal(m, 1, 2);
export const stableTroughCell = (m: Stable): Pos => stableLocal(m, 2, 3);

// ---- La taverne ----

export interface Tavern {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  pantry: Partial<Record<ExportGood, number>>; // ingrédients rapportés des dépôts
  dishes: Record<string, number>; // plats prêts, par recette
}

export function tavernAt(s: Save, gx: number, gy: number): Tavern | null {
  return s.taverns.find((m) => gx >= m.gx && gx < m.gx + 3 && gy >= m.gy && gy < m.gy + 3) ?? null;
}

export const tavernEntrance = (m: Placed): Pos => entranceAt(m, 3, 1);
export const canPlaceTavern = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, 3) && entranceOk(s, tavernEntrance({ gx, gy, rot }));

export function placeTavern(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = tavernEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, 3) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceTavern(s, gx, gy, rot)) return "blocked";
  if (s.coins < COSTS.tavern.coins) return "poor";
  s.coins -= COSTS.tavern.coins;
  if (instant) s.taverns.push({ id: Math.max(0, ...s.taverns.map((m) => m.id)) + 1, gx, gy, rot, pantry: {}, dishes: {} });
  else s.sites.push({ id: nextSiteId(s), kind: "tavern", rot, gx, gy, need: COSTS.tavern.mat, mat: "plank", have: 0, progress: 0, buildSec: COSTS.tavern.sec });
  return "ok";
}

export function removeTavern(s: Save, m: Tavern) {
  s.taverns = s.taverns.filter((x) => x !== m);
  s.coins += Math.floor(COSTS.tavern.coins / 2);
  refundPlanks(s, Math.floor(COSTS.tavern.mat / 2));
}

export const dishCount = (m: Tavern) => RECIPES.reduce((a, r) => a + (m.dishes[r.id] ?? 0), 0);

// ---- Le grand drakkar ----

export interface Shipyard {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  stage: number; // étape en cours (DRAKKAR_STAGES.length : le drakkar est terminé)
  have: Partial<Record<ExportGood, number>>; // ce qui a déjà été livré pour l'étape en cours
}

export function shipyardAt(s: Save, gx: number, gy: number): Shipyard | null {
  return s.shipyards.find((m) => gx >= m.gx && gx < m.gx + SHIPYARD_SIZE && gy >= m.gy && gy < m.gy + SHIPYARD_SIZE) ?? null;
}

export const shipyardEntrance = (m: Placed): Pos => entranceAt(m, SHIPYARD_SIZE, 2);

// Côté de la mer pour un chantier posé en (gx, gy) : un côté dont au moins 3 cases voisines sont de l'eau, et dont le côté opposé laisse une entrée
// constructible (comme le port). Renvoie -1 si ce n'est pas une côte.
export function shipyardRot(s: Save, gx: number, gy: number): number {
  const n = SHIPYARD_SIZE;
  for (let dy = 0; dy < n; dy++) {
    for (let dx = 0; dx < n; dx++) {
      const x = gx + dx;
      const y = gy + dy;
      const t = terrainAt(x, y);
      if (t !== T.Grass && t !== T.Sand) return -1;
      if (t === T.Grass && !canBuild(s, x, y)) return -1;
      if (occupied(s, x, y) || roadAt(s, x, y) || isEntrance(s, x, y)) return -1;
      if (s.cells[y * GRID + x].kind !== "grass") return -1;
    }
  }
  for (let rot = 0; rot < 4; rot++) {
    const outside: Pos[] = [];
    for (let k = 0; k < n; k++) outside.push(rot === 0 ? { gx: gx + k, gy: gy - 1 } : rot === 1 ? { gx: gx + n, gy: gy + k } : rot === 2 ? { gx: gx + k, gy: gy + n } : { gx: gx - 1, gy: gy + k });
    if (outside.filter((c) => isWater(terrainAt(c.gx, c.gy))).length < 2) continue;
    const door = shipyardEntrance({ gx, gy, rot });
    if (canBuild(s, door.gx, door.gy) && !occupied(s, door.gx, door.gy)) return rot;
  }
  return -1;
}

// Aimant : l'emplacement valide le plus proche du curseur (dans un rayon de 8 cases) ; null s'il n'y en a pas.
export function shipyardSpot(s: Save, gx: number, gy: number): Pos | null {
  const R = 8;
  let best: Pos | null = null;
  let bestD = Infinity;
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      const d = Math.hypot(dx, dy);
      if (d >= bestD || d > R) continue;
      if (shipyardRot(s, gx + dx, gy + dy) >= 0) {
        best = { gx: gx + dx, gy: gy + dy };
        bestD = d;
      }
    }
  }
  return best;
}

export const canPlaceShipyard = (s: Save, gx: number, gy: number) => shipyardRot(s, gx, gy) >= 0;

// Pose le chantier : l'orientation vient de la côte (comme le port).
export function placeShipyard(s: Save, gx: number, gy: number, instant = false): BuildResult {
  const rot = shipyardRot(s, gx, gy);
  if (rot < 0) return "terrain";
  if (s.coins < COSTS.shipyard.coins) return "poor";
  s.coins -= COSTS.shipyard.coins;
  if (instant) s.shipyards.push({ id: Math.max(0, ...s.shipyards.map((m) => m.id)) + 1, gx, gy, rot, stage: 0, have: {} });
  else s.sites.push({ id: nextSiteId(s), kind: "shipyard", rot, gx, gy, need: COSTS.shipyard.mat, mat: "plank", have: 0, progress: 0, buildSec: COSTS.shipyard.sec });
  return "ok";
}

export function removeShipyard(s: Save, m: Shipyard) {
  s.shipyards = s.shipyards.filter((x) => x !== m);
  s.coins += Math.floor(COSTS.shipyard.coins / 2);
  refundPlanks(s, Math.floor(COSTS.shipyard.mat / 2));
}

export const shipyardDone = (m: Shipyard) => m.stage >= DRAKKAR_STAGES.length;

// Ce que demande l'étape en cours : [marchandise, déjà livré, nécessaire].
export function shipyardNeeds(m: Shipyard): [ExportGood, number, number][] {
  if (shipyardDone(m)) return [];
  return (Object.entries(DRAKKAR_STAGES[m.stage].needs) as [ExportGood, number][]).map(([g, n]) => [g, m.have[g] ?? 0, n]);
}

// Livre aux chantiers ce que les dépôts ont de ce qui manque ; passe à l'étape suivante quand tout est livré. Renvoie le nombre d'unités livrées.
export function deliverToShipyard(s: Save, m: Shipyard): number {
  let total = 0;
  for (const [g, have, need] of shipyardNeeds(m)) {
    let want = need - have;
    for (const d of s.depots) {
      if (want <= 0) break;
      const t = takeGood("depot", d, g, want);
      want -= t;
      total += t;
      m.have[g] = (m.have[g] ?? 0) + t;
    }
  }
  if (!shipyardDone(m) && shipyardNeeds(m).every(([, have, need]) => have >= need)) {
    m.stage += 1;
    m.have = {};
  }
  return total;
}

// Le voyage : tout le village embarque, une île nouvelle accueille les villageois (sans bâtiments) et les pièces. Renvoie la nouvelle partie (à enregistrer).
export function sail(s: Save): Save {
  const n = newSave();
  n.island = (s.island ?? 0) + 1;
  n.coins = s.coins;
  n.clock = s.clock;
  n.arrival = true;
  n.workers = s.workers.map((w, i) => ({
    id: w.id,
    role: "none" as const,
    carry: 0,
    name: w.name,
    color: w.color,
    x: GRID / 2 + 0.5 + (i % 4) * 0.9,
    y: GRID / 2 + 0.5 + Math.floor(i / 4) * 0.9,
    job: null,
    energy: 100,
    age: w.age,
    lifespan: w.lifespan,
    xp: w.xp,
    thirst: 0,
    hunger: 0,
  }));
  return n;
}

// Les objectifs du moment : sur l'île de départ, construire le drakkar ; sur une île de colonie, la faire prospérer.
export function goals(s: Save): { label: string; done: boolean }[] {
  if ((s.island ?? 0) === 0) {
    const y = s.shipyards[0];
    const out = [{ label: "Construire le chantier du grand drakkar", done: !!y }];
    DRAKKAR_STAGES.forEach((st, i) => out.push({ label: `${st.label}`, done: !!y && y.stage > i }));
    return out;
  }
  return [
    { label: `${COLONY_GOAL.people} habitants`, done: s.workers.length >= COLONY_GOAL.people },
    { label: "Un port", done: s.ports.length >= COLONY_GOAL.port },
    { label: "Une église", done: s.churches.length >= COLONY_GOAL.church },
    { label: "Un marché", done: s.markets.length >= COLONY_GOAL.market },
    { label: "Une ferme", done: s.farms.length >= COLONY_GOAL.farm },
  ];
}

// ---- Marché et caravane ----

export interface Market {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  here: boolean; // la caravane est là
  clock: number; // secondes avant son arrivée (si elle est partie) ou avant son départ (si elle est là)
  stock: Partial<Record<ExportGood, number>>; // ce qu'elle vend
  wants: Partial<Record<ExportGood, number>>; // ce qu'elle voudrait acheter (quantité restante)
  purse: number; // pièces qu'elle peut encore dépenser
}

export function marketAt(s: Save, gx: number, gy: number): Market | null {
  return s.markets.find((m) => gx >= m.gx && gx < m.gx + 3 && gy >= m.gy && gy < m.gy + 3) ?? null;
}

export const marketEntrance = (m: Placed): Pos => entranceAt(m, 3, 1);
export const canPlaceMarket = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, 3) && entranceOk(s, marketEntrance({ gx, gy, rot }));

export function placeMarket(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = marketEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, 3) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceMarket(s, gx, gy, rot)) return "blocked";
  if (s.coins < COSTS.market.coins) return "poor";
  s.coins -= COSTS.market.coins;
  if (instant) s.markets.push({ id: Math.max(0, ...s.markets.map((m) => m.id)) + 1, gx, gy, rot, here: false, clock: MARKET_FIRST_SEC, stock: {}, wants: {}, purse: 0 });
  else s.sites.push({ id: nextSiteId(s), kind: "market", rot, gx, gy, need: COSTS.market.mat, mat: "plank", have: 0, progress: 0, buildSec: COSTS.market.sec });
  return "ok";
}

export function removeMarket(s: Save, m: Market) {
  s.markets = s.markets.filter((x) => x !== m);
  s.coins += Math.floor(COSTS.market.coins / 2);
  refundPlanks(s, Math.floor(COSTS.market.mat / 2));
}

// Prix : le joueur paie plus que le port ne paie, et la caravane achète mieux que le port.
export const marketBuyPrice = (g: ExportGood) => Math.max(2, Math.ceil(EXPORT_GOODS[g].price * MARKET_BUY_MULT));
export const marketSellPrice = (g: ExportGood) => Math.max(1, Math.round(EXPORT_GOODS[g].price * MARKET_SELL_MULT));

const shuffled = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5);

// La caravane arrive avec des marchandises à vendre et une liste de ce qu'elle cherche.
export function arriveCaravan(m: Market) {
  const goods = shuffled(Object.keys(EXPORT_GOODS) as ExportGood[]);
  m.here = true;
  m.clock = MARKET_STAY_SEC;
  m.stock = {};
  m.wants = {};
  for (const g of goods.slice(0, 4)) m.stock[g] = EXPORT_GOODS[g].price >= 4 ? 4 + Math.floor(Math.random() * 5) : 6 + Math.floor(Math.random() * 9);
  for (const g of goods.slice(4, 7)) m.wants[g] = MARKET_WANTS;
  m.purse = MARKET_PURSE;
}

// Les caravanes arrivent et repartent ; renvoie les événements pour les annoncer.
export function tickMarkets(s: Save, dt: number): { market: Market; arrived: boolean }[] {
  const out: { market: Market; arrived: boolean }[] = [];
  for (const m of s.markets) {
    m.clock -= dt;
    if (m.clock > 0) continue;
    if (m.here) {
      m.here = false;
      m.stock = {};
      m.wants = {};
      m.purse = 0;
      m.clock = MARKET_GAP_SEC[0] + Math.random() * (MARKET_GAP_SEC[1] - MARKET_GAP_SEC[0]);
      out.push({ market: m, arrived: false });
    } else {
      arriveCaravan(m);
      out.push({ market: m, arrived: true });
    }
  }
  return out;
}

// Ce que tous les dépôts ont en stock de cette marchandise.
export const depotGoodTotal = (s: Save, g: ExportGood) => s.depots.reduce((a, d) => a + (goodsOf("depot", d)[g] ?? 0), 0);

// Range des marchandises dans un dépôt, dans la limite de sa place ; renvoie la quantité rangée.
function giveGood(d: Depot, good: ExportGood, n: number): number {
  const taken = Math.max(0, Math.min(n, depotFree(d)));
  if (taken <= 0) return 0;
  if (good === "plank") d.planks = (d.planks ?? 0) + taken;
  else if (good === "cuts") d.cuts = (d.cuts ?? 0) + taken;
  else if (good === "honey") d.honey = (d.honey ?? 0) + taken;
  else if (good === "berries") d.berries = (d.berries ?? 0) + taken;
  else if (good === "wood") d.wood += taken;
  else if (good === "milk") d.milk = (d.milk ?? 0) + taken;
  else if (good === "meat") d.meat = (d.meat ?? 0) + taken;
  else d.crops = { ...(d.crops ?? {}), [good]: (d.crops?.[good as FarmCrop] ?? 0) + taken };
  return taken;
}

// Achat à la caravane : renvoie la quantité achetée (0 : pas assez de pièces, plus de stock ou plus de place dans les dépôts).
export function buyFromCaravan(s: Save, m: Market, good: ExportGood, n: number): number {
  const price = marketBuyPrice(good);
  let want = Math.min(n, m.stock[good] ?? 0, Math.floor(s.coins / price));
  let got = 0;
  for (const d of s.depots) {
    if (want <= 0) break;
    const t = giveGood(d, good, want);
    want -= t;
    got += t;
  }
  if (got > 0) {
    s.coins -= got * price;
    m.stock[good] = (m.stock[good] ?? 0) - got;
  }
  return got;
}

// Vente à la caravane, prise dans les dépôts : renvoie la quantité vendue.
export function sellToCaravan(s: Save, m: Market, good: ExportGood, n: number): number {
  const price = marketSellPrice(good);
  let want = Math.min(n, m.wants[good] ?? 0, Math.floor(m.purse / price));
  let sold = 0;
  for (const d of s.depots) {
    if (want <= 0) break;
    const t = takeGood("depot", d, good, want);
    want -= t;
    sold += t;
  }
  if (sold > 0) {
    s.coins += sold * price;
    m.purse -= sold * price;
    m.wants[good] = (m.wants[good] ?? 0) - sold;
  }
  return sold;
}

// ---- Porcherie et cochons ----

export interface Pig {
  age: number; // secondes de croissance (il ne grandit que bien nourri et abreuvé)
  eat: number; // secondes depuis son dernier repas
  drink: number; // secondes depuis sa dernière gorgée
}

export interface Pigpen {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  pigs: Pig[];
  feed: number; // l'auge : légumes en réserve
  water: number; // l'abreuvoir : eau en réserve
  order: number; // cochons adultes à abattre (ordre du joueur)
  auto?: boolean; // abattage automatique au-delà de PIG_KEEP adultes
  breed: number; // secondes vers le prochain porcelet
}

export function pigpenAt(s: Save, gx: number, gy: number): Pigpen | null {
  return s.pigpens.find((m) => gx >= m.gx && gx < m.gx + PIGPEN_SIZE && gy >= m.gy && gy < m.gy + PIGPEN_SIZE) ?? null;
}

export const pigpenEntrance = (m: Placed): Pos => entranceAt(m, PIGPEN_SIZE, 1);
export const canPlacePigpen = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, PIGPEN_SIZE) && entranceOk(s, pigpenEntrance({ gx, gy, rot }));

export function placePigpen(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = pigpenEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, PIGPEN_SIZE) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlacePigpen(s, gx, gy, rot)) return "blocked";
  if (s.coins < COSTS.pigpen.coins) return "poor";
  s.coins -= COSTS.pigpen.coins;
  if (instant) s.pigpens.push({ id: Math.max(0, ...s.pigpens.map((m) => m.id)) + 1, gx, gy, rot, pigs: [], feed: 0, water: 0, order: 0, breed: 0 });
  else s.sites.push({ id: nextSiteId(s), kind: "pigpen", rot, gx, gy, need: COSTS.pigpen.mat, mat: "plank", have: 0, progress: 0, buildSec: COSTS.pigpen.sec });
  return "ok";
}

export function removePigpen(s: Save, m: Pigpen) {
  s.pigpens = s.pigpens.filter((x) => x !== m);
  s.coins += Math.floor(COSTS.pigpen.coins / 2) + m.pigs.length * PIG_SELL; // les cochons sont revendus
  refundPlanks(s, Math.floor(COSTS.pigpen.mat / 2));
}

export const pigAdult = (p: Pig) => p.age >= PIG_ADULT_SEC;
export const pigFed = (p: Pig) => p.eat < PIG_EAT_SEC * 1.5;
export const pigWatered = (p: Pig) => p.drink < PIG_DRINK_SEC * 1.5;
export const adultsOf = (m: Pigpen) => m.pigs.filter(pigAdult).length;

// Achète un porcelet.
export function buyPig(s: Save, m: Pigpen): "ok" | "poor" | "full" {
  if (m.pigs.length >= PIGS_MAX) return "full";
  if (s.coins < PIG_PRICE) return "poor";
  s.coins -= PIG_PRICE;
  m.pigs.push({ age: 0, eat: 0, drink: 0 });
  return "ok";
}

// Abat un cochon adulte ; renvoie la viande brute obtenue (0 s'il n'y en a pas).
export function slaughterPig(m: Pigpen): number {
  const i = m.pigs.findIndex(pigAdult);
  if (i < 0) return 0;
  m.pigs.splice(i, 1);
  return PIG_MEAT;
}

// Les cochons mangent et boivent ce qu'il y a dans l'auge et l'abreuvoir, grandissent quand ils sont bien soignés, et se reproduisent.
export function tickPigpens(s: Save, dt: number) {
  for (const m of s.pigpens) {
    for (const p of m.pigs) {
      p.eat += dt;
      p.drink += dt;
      if (p.eat >= PIG_EAT_SEC && m.feed >= 1) {
        m.feed -= 1;
        p.eat = 0;
      }
      if (p.drink >= PIG_DRINK_SEC && m.water >= 1) {
        m.water -= 1;
        p.drink = 0;
      }
      if (pigFed(p) && pigWatered(p) && p.age < PIG_ADULT_SEC) p.age += dt; // il ne grandit que bien soigné
    }
    // deux adultes bien soignés font un porcelet de temps en temps
    const healthy = m.pigs.filter((p) => pigAdult(p) && pigFed(p) && pigWatered(p)).length;
    if (healthy >= 2 && m.pigs.length < PIGS_MAX) {
      m.breed += dt;
      if (m.breed >= PIG_BREED_SEC) {
        m.breed = 0;
        m.pigs.push({ age: 0, eat: 0, drink: 0 });
      }
    } else m.breed = 0;
    // abattage automatique : on ne garde que PIG_KEEP adultes
    if (m.auto && adultsOf(m) - m.order > PIG_KEEP) m.order += 1;
    if (m.order > adultsOf(m)) m.order = adultsOf(m);
  }
}

// Une case du plan de la porcherie (de 0 à 3), ramenée à sa vraie place selon l'orientation.
function pigpenLocal(m: Pigpen, cx: number, cy: number): Pos {
  let vx = cx + 0.5 - PIGPEN_SIZE / 2;
  let vy = cy + 0.5 - PIGPEN_SIZE / 2;
  for (let i = 0; i < (m.rot ?? 0) % 4; i++) [vx, vy] = [-vy, vx];
  return { gx: m.gx + Math.floor(PIGPEN_SIZE / 2 + vx), gy: m.gy + Math.floor(PIGPEN_SIZE / 2 + vy) };
}
// où le porcher abat un cochon, et où il remplit l'auge et l'abreuvoir
export const pigpenSlaughterCell = (m: Pigpen): Pos => pigpenLocal(m, 1, 2);
export const pigpenTroughCell = (m: Pigpen): Pos => pigpenLocal(m, 2, 3);

// ---- Ferme : douze parcelles à arroser ----

export interface Plot {
  c: FarmCrop; // la culture semée
  t: FarmCrop | null; // ce qu'on y sèmera (au choix du joueur, parcelle par parcelle) ; null : à choisir, le fermier n'y sème rien
  p: number; // -1 : vide ; de 0 à 1 : ça pousse ; 1 : mûr
  wet: number; // humidité de 0 (sèche) à 1 (arrosée) : sèche, la pousse s'arrête
}

export interface Farm {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  crop: FarmCrop; // le « pinceau » du menu : la culture qu'on attribue en cliquant une parcelle
  plots: Plot[];
  water: number; // la cuve : l'eau rapportée du puits, qui sert à arroser
}

const newPlots = (): Plot[] => Array.from({ length: FARM_PLOTS }, () => ({ c: "wheat" as FarmCrop, t: null, p: -1, wet: 0 }));

export function farmAt(s: Save, gx: number, gy: number): Farm | null {
  return s.farms.find((m) => gx >= m.gx && gx < m.gx + FARM_SIZE && gy >= m.gy && gy < m.gy + FARM_SIZE) ?? null;
}

export const farmEntrance = (m: Placed): Pos => entranceAt(m, FARM_SIZE, 2);
export const canPlaceFarm = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, FARM_SIZE) && entranceOk(s, farmEntrance({ gx, gy, rot }));

export function placeFarm(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = farmEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, FARM_SIZE) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceFarm(s, gx, gy, rot)) return "blocked";
  if (s.coins < COSTS.farm.coins) return "poor";
  s.coins -= COSTS.farm.coins;
  if (instant) s.farms.push({ id: Math.max(0, ...s.farms.map((m) => m.id)) + 1, gx, gy, rot, crop: "wheat", plots: newPlots(), water: 0 });
  else s.sites.push({ id: nextSiteId(s), kind: "farm", rot, gx, gy, need: COSTS.farm.mat, mat: "plank", have: 0, progress: 0, buildSec: COSTS.farm.sec });
  return "ok";
}

export function removeFarm(s: Save, m: Farm) {
  s.farms = s.farms.filter((x) => x !== m);
  s.coins += Math.floor(COSTS.farm.coins / 2);
  refundPlanks(s, Math.floor(COSTS.farm.mat / 2));
}

// Une parcelle qui pousse et réclame de l'eau.
export const plotDry = (pl: Plot) => pl.p >= 0 && pl.p < 1 && pl.wet < DRY_BELOW;

// Ce qu'il y a à faire dans une ferme : parcelles mûres, vides, qui poussent, qui ont soif ; avancement moyen de la pousse.
export function farmCounts(f: Farm) {
  const growing = f.plots.filter((p) => p.p >= 0 && p.p < 1);
  const planted = f.plots.filter((p) => p.p >= 0);
  return {
    ripe: f.plots.filter((p) => p.p >= 1).length,
    empty: f.plots.filter((p) => p.p < 0).length,
    growing: growing.length,
    dry: f.plots.filter(plotDry).length,
    avg: planted.length ? planted.reduce((a, p) => a + Math.min(1, p.p), 0) / planted.length : 0,
  };
}

// Une case du plan de la ferme (de 0 à 4, dessinée à l'endroit), ramenée à sa vraie place selon l'orientation de la ferme.
function farmLocal(f: Farm, cx: number, cy: number): Pos {
  let vx = cx + 0.5 - FARM_SIZE / 2;
  let vy = cy + 0.5 - FARM_SIZE / 2;
  for (let i = 0; i < (f.rot ?? 0) % 4; i++) [vx, vy] = [-vy, vx];
  return { gx: f.gx + Math.floor(FARM_SIZE / 2 + vx), gy: f.gy + Math.floor(FARM_SIZE / 2 + vy) };
}

// La case où se tient le fermier pour travailler cette parcelle (dans le champ, au milieu de la parcelle).
export function farmPlotCell(f: Farm, i: number): Pos {
  return farmLocal(f, [0, 1, 3, 4][i % 4], Math.floor(i / 4));
}

// La case à côté de la cuve, où il verse l'eau.
export const farmTankCell = (f: Farm): Pos => farmLocal(f, 3, 4);

// Vitesse de pousse d'une culture à cette saison (0 : rien ne pousse).
export const cropSeasonFactor = (crop: FarmCrop, seasonIndex: number) => FARM_CROPS[crop].season[seasonIndex] ?? 1;

// Arrose une parcelle avec l'eau de la cuve ; renvoie false s'il n'y en a plus.
export function waterPlot(f: Farm, i: number): boolean {
  if (f.water < 1 || !f.plots[i]) return false;
  f.water -= 1;
  f.plots[i].wet = 1;
  return true;
}

// Les parcelles sèchent peu à peu ; les cultures poussent (chacune à sa vitesse, selon la saison) tant qu'elles sont humides.
// Renvoie true si une parcelle vient de mûrir.
export function tickFarms(s: Save, dt: number, seasonIndex: number): boolean {
  let ripened = false;
  for (const f of s.farms) {
    for (const pl of f.plots) {
      if (pl.wet > 0) pl.wet = Math.max(0, pl.wet - dt / WET_SEC);
      if (pl.p < 0 || pl.p >= 1 || pl.wet <= 0) continue; // vide, mûre ou sèche : rien ne pousse
      pl.p = Math.min(1, pl.p + (dt / FARM_CROPS[pl.c].growSec) * cropSeasonFactor(pl.c, seasonIndex));
      if (pl.p >= 1) ripened = true;
    }
  }
  return ripened;
}

// ---- Église, cimetière et défunts ----

// Un défunt pas encore enterré : son corps est devant sa maison.
export interface Corpse {
  id: number;
  name: string;
  color: number;
  age: number;
  cause: string;
  x: number; // en cases
  y: number;
  t: number; // secondes depuis la mort
}

export interface Grave {
  name: string;
  age: number;
  cause: string;
  color: number;
}

// Une église (3 × 3 cases) et son cimetière.
export interface Church {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  graves: Grave[];
}

export function churchAt(s: Save, gx: number, gy: number): Church | null {
  return s.churches.find((m) => gx >= m.gx && gx <= m.gx + 2 && gy >= m.gy && gy <= m.gy + 2) ?? null;
}

export const churchEntrance = (m: Placed): Pos => entranceAt(m, 3, 1);
export const canPlaceChurch = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, 3) && entranceOk(s, churchEntrance({ gx, gy, rot }));
export const gravesFree = (m: Church) => Math.max(0, CHURCH_GRAVES - m.graves.length);

export function placeChurch(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = churchEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, 3) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceChurch(s, gx, gy, rot)) return "blocked";
  if (s.coins < COSTS.church.coins) return "poor";
  s.coins -= COSTS.church.coins;
  if (instant) s.churches.push({ id: Math.max(0, ...s.churches.map((m) => m.id)) + 1, gx, gy, rot, graves: [] });
  else s.sites.push({ id: nextSiteId(s), kind: "church", rot, gx, gy, need: COSTS.church.mat, mat: "plank", have: 0, progress: 0, buildSec: COSTS.church.sec });
  return "ok";
}

export function removeChurch(s: Save, m: Church) {
  s.churches = s.churches.filter((x) => x !== m);
  s.coins += Math.floor(COSTS.church.coins / 2);
  refundPlanks(s, Math.floor(COSTS.church.mat / 2));
}

// Un villageois meurt : son corps reste devant sa maison (ou là où il est tombé s'il n'en avait pas).
export function spawnCorpse(s: Save, w: WorkerSave, cause: string) {
  const home = s.houses.find((h) => h.id === w.home);
  const door = home ? houseEntrance(home) : null;
  const here = s.corpses.filter((c) => door && Math.floor(c.x) === door.gx && Math.floor(c.y) === door.gy).length;
  s.corpses.push({
    id: Math.max(0, ...s.corpses.map((c) => c.id)) + 1,
    name: w.name,
    color: w.color,
    age: Math.floor(w.age ?? 0),
    cause,
    x: door ? door.gx + 0.5 + here * 0.28 : w.x,
    y: door ? door.gy + 0.55 : w.y,
    t: 0,
  });
}

export function tickCorpses(s: Save, dt: number) {
  for (const c of s.corpses) c.t += dt;
}

// ---- Maison du soigneur et maladies ----

// Une maison du soigneur occupe 2 × 2 cases à partir de (gx, gy). Elle garde des ingrédients (baies, miel) et les remèdes préparés.
export interface Clinic {
  id: number;
  gx: number;
  gy: number;
  rot?: number;
  berries: number;
  honey: number;
  tisane: number;
  syrup: number;
  prog: number; // secondes de préparation accumulées
  prevent?: boolean; // le soigneur donne des tisanes préventives (vrai par défaut)
}

export function clinicAt(s: Save, gx: number, gy: number): Clinic | null {
  return s.clinics.find((m) => gx >= m.gx && gx <= m.gx + 1 && gy >= m.gy && gy <= m.gy + 1) ?? null;
}

export const clinicEntrance = (m: Placed): Pos => entranceAt(m, 2, 0);
export const canPlaceClinic = (s: Save, gx: number, gy: number, rot = 0) => footprintFree(s, gx, gy, 2) && entranceOk(s, clinicEntrance({ gx, gy, rot }));

export function placeClinic(s: Save, gx: number, gy: number, instant = false, rot = 0): BuildResult {
  const door = clinicEntrance({ gx, gy, rot });
  if (!footprintTerrainOk(s, gx, gy, 2) || !canBuild(s, door.gx, door.gy)) return "terrain";
  if (!canPlaceClinic(s, gx, gy, rot)) return "blocked";
  if (s.coins < COSTS.clinic.coins) return "poor";
  s.coins -= COSTS.clinic.coins;
  if (instant) s.clinics.push({ id: Math.max(0, ...s.clinics.map((m) => m.id)) + 1, gx, gy, rot, berries: 0, honey: 0, tisane: 0, syrup: 0, prog: 0 });
  else s.sites.push({ id: nextSiteId(s), kind: "clinic", rot, gx, gy, need: COSTS.clinic.mat, mat: "plank", have: 0, progress: 0, buildSec: COSTS.clinic.sec });
  return "ok";
}

export function removeClinic(s: Save, m: Clinic) {
  s.clinics = s.clinics.filter((x) => x !== m);
  s.coins += Math.floor(COSTS.clinic.coins / 2);
  refundPlanks(s, Math.floor(COSTS.clinic.mat / 2));
}

// Le soigneur range des baies ou du miel dans la maison du soigneur ; renvoie la quantité acceptée.
export function addClinicStock(m: Clinic, good: "berries" | "honey", n: number): number {
  const room = good === "berries" ? CLINIC_BERRY_CAP - m.berries : CLINIC_HONEY_CAP - m.honey;
  const taken = Math.max(0, Math.min(n, room));
  if (good === "berries") m.berries += taken;
  else m.honey += taken;
  return taken;
}

// Quel remède peut-on préparer maintenant ? Le sirop est préféré quand il manque, sinon la tisane.
export function brewable(m: Clinic): RemedyKind | null {
  const canSyrup = m.berries >= SYRUP_BERRIES && m.honey >= SYRUP_HONEY && m.syrup < CLINIC_REMEDY_CAP;
  const canTisane = m.berries >= TISANE_BERRIES && m.tisane < CLINIC_REMEDY_CAP;
  if (canSyrup && (m.syrup <= m.tisane || !canTisane)) return "syrup";
  if (canTisane) return "tisane";
  return canSyrup ? "syrup" : null;
}

export function brew(m: Clinic, kind: RemedyKind, saveChance = 0) {
  const free = Math.random() < saveChance; // un soigneur expérimenté gaspille moins : parfois les ingrédients ne sont pas consommés
  if (kind === "syrup") {
    if (!free) {
      m.berries -= SYRUP_BERRIES;
      m.honey -= SYRUP_HONEY;
    }
    m.syrup++;
  } else {
    if (!free) m.berries -= TISANE_BERRIES;
    m.tisane++;
  }
}

// Le niveau d'un soigneur d'après son expérience.
export function healSkill(xp: number) {
  let level = 0;
  HEAL_LEVELS.forEach((l, i) => {
    if (xp >= l.xp) level = i;
  });
  const cur = HEAL_LEVELS[level];
  const next = HEAL_LEVELS[level + 1];
  return { level, label: cur.label, power: cur.power, save: cur.save, brew: cur.brew, from: cur.xp, to: next ? next.xp : null };
}

// Une tisane préventive : le villageois est protégé un moment.
export function protectVillager(w: WorkerSave) {
  w.protect = PREVENT_SEC;
}

// Le meilleur remède en stock pour cette maladie : le sirop pour une maladie grave ou la grippe, sinon la tisane.
export function bestRemedy(m: Clinic, il: Illness): RemedyKind | null {
  const strong = il.kind === "flu" || il.sev >= 60;
  if (strong && m.syrup > 0) return "syrup";
  if (m.tisane > 0) return "tisane";
  return m.syrup > 0 ? "syrup" : null;
}

export interface Illness {
  kind: IllnessKind;
  sev: number; // gravité, de 0 à 100 % : à 100 %, le villageois meurt
  age: number; // secondes depuis le début de la maladie
  slowUntil?: number; // jusque-là (en secondes de maladie), un soin ralentit la maladie
}

export interface HealthEvent {
  type: "sick" | "cured" | "death";
  worker: WorkerSave;
  kind: IllnessKind;
  epidemic?: boolean;
  from?: string; // contaminé par ce villageois
}

export function infect(w: WorkerSave, kind: IllnessKind, sev = 8): boolean {
  if (w.illness || (w.immune ?? 0) > 0) return false;
  w.illness = { kind, sev, age: 0 };
  return true;
}

// Un remède : la gravité baisse ; renvoie true si le villageois est guéri.
export function applyRemedy(w: WorkerSave, remedy: RemedyKind, mult = 1): boolean {
  const il = w.illness;
  if (!il) return true;
  il.sev = Math.max(0, il.sev - REMEDIES[remedy].power[il.kind] * mult);
  il.slowUntil = il.age + TREAT_SLOW_SEC;
  if (il.sev <= 0) {
    w.illness = undefined;
    w.immune = IMMUNE_SEC;
    return true;
  }
  return false;
}

// Une maison compte-t-elle des malades ? (pour l'icône et le menu)
export const sickIn = (s: Save, houseId: number) => s.workers.filter((w) => w.home === houseId && w.illness);

// Fait évoluer les maladies : la gravité monte (moins vite après un soin), le rhume passe tout seul, la mort à 100 % ; et, toutes les HEALTH_TICK s,
// tirage de nouvelles maladies (selon soif, faim, fatigue, saison) et de la contagion. Renvoie les événements à annoncer.
export function tickHealth(s: Save, dt: number, winter: boolean): HealthEvent[] {
  const ev: HealthEvent[] = [];
  for (const w of s.workers) {
    if ((w.immune ?? 0) > 0) w.immune = Math.max(0, (w.immune ?? 0) - dt);
    if ((w.protect ?? 0) > 0) w.protect = Math.max(0, (w.protect ?? 0) - dt);
    const il = w.illness;
    if (!il) continue;
    il.age += dt;
    const def = ILLNESSES[il.kind];
    const slow = (il.slowUntil ?? 0) > il.age ? (il.kind === "flu" ? 0 : 0.35) : 1; // soignée, la grippe ne progresse plus le temps que le soigneur revienne
    const worse = (w.thirst ?? 0) >= 80 || (w.hunger ?? 0) >= 80 ? 1.4 : 1; // soif et faim aggravent la maladie
    il.sev = Math.min(def.cap, il.sev + def.rate * slow * worse * dt);
    if (def.selfCureSec > 0 && il.age >= def.selfCureSec) {
      w.illness = undefined;
      w.immune = IMMUNE_SEC;
      ev.push({ type: "cured", worker: w, kind: il.kind });
    } else if (il.sev >= 100) ev.push({ type: "death", worker: w, kind: il.kind });
  }
  s.healthT = (s.healthT ?? 0) + dt;
  while (s.healthT >= HEALTH_TICK) {
    s.healthT -= HEALTH_TICK;
    const healthy = s.workers.filter((w) => !w.illness && (w.immune ?? 0) <= 0);
    // nouvelles maladies, au hasard (5 fois plus rares pour un villageois protégé)
    for (const w of healthy) {
      const tired = (w.energy ?? 100) < 25;
      const nearCorpse = s.corpses.some((c) => c.t > CORPSE_SICK_AFTER && Math.hypot(c.x - w.x, c.y - w.y) <= CORPSE_SICK_RADIUS);
      const guard = ((w.protect ?? 0) > 0 ? PREVENT_ONSET : 1) * (1 + Math.max(0, (w.age ?? 25) - 50) / 40) * (nearCorpse ? 2.5 : 1);
      const roll = Math.random();
      const pCold = HEALTH_RISK.cold * (winter ? 3 : 1) * (tired ? 1.5 : 1) * guard;
      const pPoison = ((w.hunger ?? 0) >= 85 ? HEALTH_RISK.poisonHungry : HEALTH_RISK.poisonBase) * guard;
      const pFever = HEALTH_RISK.fever * ((w.thirst ?? 0) >= 85 || (w.energy ?? 100) < 15 ? 3 : 1) * guard;
      const kind: IllnessKind | null = roll < pFever ? "fever" : roll < pFever + pPoison ? "poison" : roll < pFever + pPoison + pCold ? "cold" : null;
      if (kind && infect(w, kind)) ev.push({ type: "sick", worker: w, kind });
    }
    // contagion : même maison, maisons voisines, collègues, proximité dehors ; la quarantaine la contient
    const houseOf = (id: number | null | undefined) => (id == null ? undefined : s.houses.find((h) => h.id === id));
    for (const sick of s.workers) {
      const il = sick.illness;
      if (!il) continue;
      const c = ILLNESSES[il.kind].contagion;
      if (c <= 0) continue;
      const home = houseOf(sick.home);
      const quarantined = !!home?.quarantine;
      const bedridden = il.sev >= SICK_BED || !!sick.inside || quarantined;
      for (const w of s.workers) {
        if (w === sick || w.illness || (w.immune ?? 0) > 0) continue;
        let p = 0;
        if (sick.home != null && sick.home === w.home) p = c * HEALTH_TICK * (quarantined ? QUARANTINE_HOUSE : 1);
        else if (!quarantined) {
          const wh = houseOf(w.home);
          if (home && wh && Math.hypot(home.gx - wh.gx, home.gy - wh.gy) <= CONTAGION_NEIGHBOR_RADIUS) p = Math.max(p, c * HEALTH_TICK * CONTAGION_NEIGHBOR);
          if (!bedridden && sick.workplace && w.workplace && sick.workplace.kind === w.workplace.kind && sick.workplace.id === w.workplace.id) p = Math.max(p, c * HEALTH_TICK * CONTAGION_WORK);
          if (!bedridden && !w.inside && Math.hypot(sick.x - w.x, sick.y - w.y) <= CONTAGION_RADIUS) p = Math.max(p, c * HEALTH_TICK * 0.6);
        }
        if ((w.protect ?? 0) > 0) p *= PREVENT_CONTAGION;
        if (p > 0 && Math.random() < p && infect(w, il.kind)) ev.push({ type: "sick", worker: w, kind: il.kind, from: sick.name });
      }
    }
    // épidémie : une grippe se déclare chez un villageois
    if (healthy.length && Math.random() < HEALTH_RISK.epidemic && !s.workers.some((w) => w.illness?.kind === "flu")) {
      const w = healthy[Math.floor(Math.random() * healthy.length)];
      if (infect(w, "flu", 12)) ev.push({ type: "sick", worker: w, kind: "flu", epidemic: true });
    }
  }
  return ev;
}

// ---- Jour et nuit ----

// Heure du jour (0 à 24) : la journée de jeu commence à 6 h.
export const clockHour = (clock: number) => (((clock / DAY_SEC) * 24 + 6) % 24 + 24) % 24;
export const clockDay = (clock: number) => Math.floor((clock / DAY_SEC * 24 + 6) / 24) + 1;

// Obscurité de 0 (plein jour) à 1 (nuit noire) : le jour de 7 h à 18 h, le crépuscule jusqu'à 21 h, la nuit jusqu'à 5 h, l'aube jusqu'à 7 h.
export function darkness(hour: number): number {
  const smooth = (x: number) => x * x * (3 - 2 * x);
  if (hour >= 7 && hour <= 18) return 0;
  if (hour > 18 && hour < 21) return smooth((hour - 18) / 3);
  if (hour >= 21 || hour <= 5) return 1;
  return 1 - smooth((hour - 5) / 2);
}

// ---- Saisons ----

export interface SeasonNow {
  rules: SeasonRules;
  index: number; // 0 printemps, 1 été, 2 automne, 3 hiver
  prog: number; // avancement dans la saison, de 0 à 1
  next: SeasonRules; // la saison suivante
  dayInSeason: number; // 1 à SEASON_DAYS
  year: number; // numéro de l'année, à partir de 1
}

// La saison d'après l'horloge de jeu : SEASON_DAYS jours chacune, dans l'ordre, une nouvelle partie commence au printemps.
export function seasonAt(clock: number): SeasonNow {
  const dayPos = (clock / DAY_SEC * 24 + 6) / 24; // jours écoulés, en continu
  const sf = dayPos / SEASON_DAYS;
  const n = Math.floor(sf);
  const index = ((n % 4) + 4) % 4;
  const prog = sf - n;
  return { rules: SEASONS[index], index, prog, next: SEASONS[(index + 1) % 4], dayInSeason: Math.min(SEASON_DAYS, Math.floor(prog * SEASON_DAYS) + 1), year: Math.floor(n / 4) + 1 };
}

// ---- Contentement : ce qui dérange les habitants ----

export type NuisanceKey = keyof typeof MOOD.nuisance;

// Gêne causée à distance `dist` (en cases) par une nuisance : toute la gêne au contact, plus rien au bord du rayon.
export function nuisancePen(key: NuisanceKey, dist: number): number {
  const n = MOOD.nuisance[key];
  return dist >= n.radius ? 0 : Math.round(n.penalty * (1 - dist / n.radius));
}

// Les bâtiments qui dérangent, avec leur centre en cases.
export function nuisanceSources(s: Save): { key: NuisanceKey; x: number; y: number }[] {
  return [
    ...s.apiaries.map((m) => ({ key: "apiary" as const, x: m.gx + 1, y: m.gy + 1 })),
    ...s.sawmills.map((m) => ({ key: "sawmill" as const, x: m.gx + 1.5, y: m.gy + 1.5 })),
    ...s.ports.map((m) => ({ key: "port" as const, x: m.gx + 1.5, y: m.gy + 1.5 })),
    ...s.lodges.map((m) => ({ key: "lodge" as const, x: m.gx + 1, y: m.gy + 1 })),
    ...s.corpses.filter((c) => c.t > 20).map((c) => ({ key: "corpse" as const, x: c.x, y: c.y })), // un défunt pas enterré attriste le voisinage
  ];
}

export interface MoodCause {
  emoji: string;
  label: string;
  pen: number; // points de contentement perdus
}

// Contentement d'un logement dont le centre est en (x, y) (en cases), avec ce qui le diminue. Les besoins (eau, nourriture) comptent
// quand on les donne : c'est le cas des maisons existantes, pas d'un emplacement qu'on envisage.
export function moodAt(s: Save, x: number, y: number, needs?: { water: boolean; food: boolean }): { mood: number; causes: MoodCause[] } {
  const byKind = new Map<NuisanceKey, number>();
  for (const src of nuisanceSources(s)) {
    const pen = nuisancePen(src.key, Math.hypot(src.x - x, src.y - y));
    if (pen > 0) byKind.set(src.key, (byKind.get(src.key) ?? 0) + pen);
  }
  const causes: MoodCause[] = [...byKind.entries()].map(([key, pen]) => ({ emoji: MOOD.nuisance[key].emoji, label: MOOD.nuisance[key].label, pen }));
  if (needs?.water === false) causes.push({ emoji: "💧", label: "Soif", pen: MOOD.thirst });
  if (needs?.food === false) causes.push({ emoji: "🥩", label: "Faim", pen: MOOD.hunger });
  causes.sort((a, b) => b.pen - a.pen);
  const total = causes.reduce((a, c) => a + c.pen, 0);
  return { mood: Math.max(0, Math.min(100, 100 - total)), causes };
}

export function houseMood(s: Save, h: House) {
  return moodAt(s, h.gx + 1, h.gy + 1, { water: !houseThirsty(h), food: !houseHungry(h) });
}

// Maisons dans le rayon d'une nuisance (pour les compter, ou les surligner).
export function housesNear(s: Save, x: number, y: number, radius: number): House[] {
  return s.houses.filter((h) => Math.hypot(h.gx + 1 - x, h.gy + 1 - y) < radius);
}

// ---- Le mécontentement qui s'installe, la menace de partir, le départ ----

// Gêne totale des nuisances autour d'une maison, de 0 à 100 (sans compter l'eau ni la nourriture, qui ont leurs propres effets).
export function nuisanceLevel(s: Save, h: House): number {
  let n = 0;
  for (const src of nuisanceSources(s)) n += nuisancePen(src.key, Math.hypot(src.x - (h.gx + 1), src.y - (h.gy + 1)));
  return Math.min(100, n);
}

export interface DiscontentEvent {
  worker: WorkerSave;
  house: House | null;
  kind: "threat" | "calm" | "leave";
}

// Fait évoluer le mécontentement de chaque villageois : il monte tant que la gêne dépasse la tolérance (plus vite quand elle est forte),
// retombe quand elle diminue. À 100 %, il menace de partir (un délai court) ; s'il n'est pas calmé, il quitte sa maison.
// Renvoie les événements à annoncer ; le départ lui-même (sortir de la maison) est fait par le jeu.
export function tickDiscontent(s: Save, dt: number): DiscontentEvent[] {
  const events: DiscontentEvent[] = [];
  for (const w of s.workers) {
    const house = s.houses.find((h) => h.id === w.home) ?? null;
    const n = house ? nuisanceLevel(s, house) : 0;
    const d0 = w.discontent ?? 0;
    let rate = n > DISCONTENT_TOL ? (n - DISCONTENT_TOL) * DISCONTENT_RISE : -(DISCONTENT_FALL + (DISCONTENT_TOL - n) * DISCONTENT_FALL_K);
    // assoiffé ou affamé sans rien à la maison : le mécontentement monte
    if (house) {
      const lack = ((w.thirst ?? 0) >= NEED_BAD && (house.water ?? 0) <= 0 ? 1 : 0) + ((w.hunger ?? 0) >= NEED_BAD && (house.food ?? 0) <= 0 ? 1 : 0);
      if (lack) rate = Math.max(rate, 0) + lack * NEED_UNREST;
    }
    // rien nulle part pour remplir sa maison : le mécontentement monte, même s'il est retourné à son travail
    if (house && w.unsupplied) rate = Math.max(rate, 0) + NEED_NOSOURCE_UNREST;
    // soif ou faim à 100 % depuis plus de 5 minutes : il n'en peut plus
    w.thirstFull = (w.thirst ?? 0) >= 100 ? (w.thirstFull ?? 0) + dt : 0;
    w.hungerFull = (w.hunger ?? 0) >= 100 ? (w.hungerFull ?? 0) + dt : 0;
    const starving = (w.thirstFull >= NEED_FULL_SEC ? 1 : 0) + (w.hungerFull >= NEED_FULL_SEC ? 1 : 0);
    if (starving) rate = Math.max(rate, 0) + starving * NEED_UNREST;
    const d = Math.max(0, Math.min(100, d0 + rate * dt));
    w.discontent = d;
    if (d >= 100 && house) {
      if (w.threat === undefined) {
        w.threat = LEAVE_AFTER_SEC;
        events.push({ worker: w, house, kind: "threat" });
      } else {
        w.threat -= dt;
        if (w.threat <= 0) events.push({ worker: w, house, kind: "leave" });
      }
    } else if (w.threat !== undefined && d < THREAT_CALM) {
      w.threat = undefined;
      events.push({ worker: w, house, kind: "calm" });
    }
  }
  return events;
}
