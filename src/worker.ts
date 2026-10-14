// Un personnage de l'équipe : il marche case par case et, s'il a un métier, travaille tout seul.
//
// Bûcheron : il choisit l'arbre le plus proche dans sa zone, le coupe et charge le bois sur son dos.
//   Quand son sac est plein (ou qu'il n'y a plus d'arbre), il le porte à un camp de bûcheron.
// Porteur : il prend le bois d'un camp et le livre à un dépôt, en boucle.
// Bâtisseur : il va chercher le bois dans les camps et dépôts reliés au chantier par les chemins, le livre, puis construit.
//
// Un personnage ne traverse pas les bâtiments : il s'arrête à côté (les chemins sont calculés par le jeu).
import { isViking, vn } from "./theme";
import { furShade } from "./painted";
import { healSkill } from "./state";
import { C } from "./draw";
import { CARRY_MAX, CREW_COLORS, FEMALE_NAMES, FOOD_MAX, HAUL_MAX, HUNT_CARRY, HaulDest, WATER_MAX, WorkerSave, haulDest } from "./state";
import { objects, T, terrainAt } from "./world";
import { Zone } from "./zone";
import { RECIPES, HARVEST_MAX, HARVEST_MIN, HARVEST_SEC, TEND_BELOW, TEND_SEC } from "./balance";
import { NIGHT_DRAIN, NIGHT_IDLE_HOME, NIGHT_REST, SPEED, CHOP_SECONDS, LOAD_SECONDS, HUNT_RANGE, AIM_SECONDS, IDLE_HOME_SEC, DRAIN, REST_RATE, IDLE_RATE, TIRED, EXHAUSTED, WAKE_AT, NEED_GO, NEED_BAD, BERRY_CARRY, BERRY_PICK_SEC, BREW_SEC, ExportGood, ILLNESSES, SICK_BED, SICK_SLOW, AGE_ELDER, FARM_CROPS, FarmCrop, SOW_SEC, REAP_SEC } from "./balance";


type Cell = { gx: number; gy: number };

// Ce que le jeu fournit au personnage pour travailler.
// Une étape du travail du soigneur.
export type HealPlan =
  | { type: "grab"; target: Cell; patientId: number; prevent?: boolean } // prendre un remède au stock, pour ce malade
  | { type: "treat"; target: Cell; patientId: number; prevent?: boolean } // aller soigner ce malade
  | { type: "brew"; target: Cell } // préparer un remède sur place
  | { type: "fetch"; target: Cell; depotId: number; good: "berries" | "honey" } // aller chercher des ingrédients dans un dépôt
  | { type: "bush"; target: Cell; idx: number } // cueillir des baies sur un arbuste sauvage
  | { type: "stock"; target: Cell }; // ranger ce qu'on porte dans le stock de la maison

// Une étape du travail du fossoyeur.
export type BuryPlan =
  | { type: "pick"; target: Cell; corpseId: number } // aller prendre ce défunt devant sa maison
  | { type: "inter"; target: Cell }; // le porter à l'église et l'enterrer

// Une étape du travail du fermier.
export type FarmPlan =
  | { type: "sow"; target: Cell; plot: number } // semer cette parcelle
  | { type: "water"; target: Cell; plot: number } // l'arroser avec l'eau de la cuve
  | { type: "reap"; target: Cell; plot: number } // récolter cette parcelle
  | { type: "fetch"; target: Cell; wellId: number } // aller chercher de l'eau à ce puits
  | { type: "pour"; target: Cell } // vider l'eau dans la cuve de la ferme
  | { type: "deliver"; target: Cell; depotId: number }; // ranger la récolte dans ce dépôt

// Une étape du travail de l'éleveur.
export type StablePlan =
  | { type: "milk"; target: Cell } // traire les vaches et emporter le lait
  | { type: "deliver"; target: Cell; depotId: number } // ranger le lait au dépôt
  | { type: "fetchGrass"; target: Cell; depotId: number } // prendre de l'herbe au dépôt
  | { type: "feed"; target: Cell } // la verser dans l'auge
  | { type: "fetchWater"; target: Cell; wellId: number } // puiser de l'eau au puits
  | { type: "pour"; target: Cell }; // la verser dans l'abreuvoir

// Une étape du travail du porcher.
export type SwinePlan =
  | { type: "fetchCrop"; target: Cell; depotId: number } // prendre des légumes au dépôt
  | { type: "feed"; target: Cell } // les verser dans l'auge
  | { type: "fetchWater"; target: Cell; wellId: number } // puiser de l'eau au puits
  | { type: "pour"; target: Cell } // la verser dans l'abreuvoir
  | { type: "slaughter"; target: Cell } // abattre un cochon adulte
  | { type: "deliver"; target: Cell; depotId: number }; // ranger la viande au dépôt

// Une étape du travail du cuisinier.
export type CookPlan =
  | { type: "fetch"; target: Cell; depotId: number; good: ExportGood } // prendre des ingrédients au dépôt
  | { type: "stock"; target: Cell } // les ranger au garde-manger de la taverne
  | { type: "cook"; target: Cell; recipe: string } // préparer un plat (il entre en cuisine)
  | { type: "store"; target: Cell; depotId: number }; // porter le plat préparé au garde-manger

// Un villageois qui va manger à la taverne.
export type DinePlan = { type: "eat"; target: Cell; depotId?: number }; // depotId : il mange au garde-manger (sinon à la taverne)

export interface WorkerEnv {
  findPath(from: Cell, to: Cell, self: Worker): [number, number][] | null; // contourne les personnages immobiles
  taken(cell: Cell, self: Worker): boolean; // un autre personnage s'y tient ou vient de la réserver
  blockerAt(cell: Cell, self: Worker): Worker | null;
  isWalkable(gx: number, gy: number): boolean;
  treesIn(zone: Zone): number[]; // arbres debout dans la zone
  isFelled(idx: number): boolean;
  claimed: Set<number>; // arbres déjà visés par un autre
  chop(w: Worker, idx: number): number; // abat l'arbre et renvoie le bois qu'il donne (à porter)

  // camps : points d'accès (à côté du camp) de ceux qui ont encore de la place
  camps(from: Cell): Cell[];
  hasCamps(): boolean;
  deposit(n: number, w: Worker): number; // dépose au camp ; renvoie ce que le camp a pu prendre

  // porteur : il appartient à un dépôt et va chercher le bois des camps reliés à ce dépôt par les chemins
  depotInfo(id: number, dest?: HaulDest, good?: ExportGood): { free: number } | null; // good : pour un port, la place restante pour cette marchandise
  anyHaulTask(from: Cell, cargo?: string): { dest: HaulDest; id: number } | null; // porteur universel : la prochaine livraison utile (cargo : ce qu'il porte déjà)
  haulRoute(depotId: number, wantWood: boolean, dest?: HaulDest): HaulRoute; // wantWood : on cherche un camp qui a du bois à prendre
  roadPath(from: Cell, to: Cell, self: Worker): [number, number][] | null; // trajet par les chemins seulement
  depositDepot(depotId: number, n: number, w: Worker, dest?: HaulDest, plank?: boolean, cuts?: boolean, honey?: boolean, berries?: boolean, crop?: FarmCrop): number; // dépose à ce dépôt ; renvoie ce qu'il a pu prendre
  onRoad(gx: number, gy: number): boolean; // on marche plus vite sur un chemin
  night(): number; // obscurité de 0 (jour) à 1 (nuit)
  climate(): { drain: number; speed: number }; // la saison : fatigue et vitesse de marche
  houseStock(w: Worker, what: "water" | "food"): number; // ce que sa maison a en réserve
  satisfy(w: Worker): void; // il boit et mange chez lui
  thirsty(w: Worker): boolean; // sa maison n'a plus d'eau : il avance moins vite
  hungry(w: Worker): boolean; // sa maison n'a plus de nourriture : il avance un peu moins vite

  // ouvrier : la scierie ou la boucherie où il travaille sur place
  craftReady(kind: "sawmill" | "butcher", id: number): boolean; // de quoi transformer en ce moment ?
  craftInfo(kind: "sawmill" | "butcher", id: number): { entrance: Cell; center: { x: number; y: number } } | null; // null : le bâtiment n'existe plus

  // éleveur : nourrir et abreuver les vaches, traire, ranger le lait
  stableInfo(stableId: number): boolean; // false : l'étable n'existe plus
  stablePlan(stableId: number, from: Cell, w: Worker): StablePlan | null;
  stableDo(plan: StablePlan, w: Worker): void;

  // cuisinier : rapporter les ingrédients et préparer les plats ; convive : manger à la taverne
  tavernInfo(tavernId: number): boolean;
  tavernPlan(tavernId: number, from: Cell, w: Worker): CookPlan | null;
  tavernDo(plan: CookPlan, w: Worker): void;
  dinePlan(tavernId: number, from: Cell, w: Worker): DinePlan | null;
  dineDo(plan: DinePlan, w: Worker): void;

  // porcher : nourrir et abreuver les cochons, les abattre, ranger la viande
  pigInfo(pigpenId: number): boolean; // false : la porcherie n'existe plus
  pigPlan(pigpenId: number, from: Cell, w: Worker): SwinePlan | null;
  pigDo(plan: SwinePlan, w: Worker): void;

  // fermier : semer, récolter, ranger la récolte
  farmInfo(farmId: number): boolean; // false : la ferme n'existe plus
  farmPlan(farmId: number, from: Cell, w: Worker): FarmPlan | null;
  farmDo(plan: FarmPlan, w: Worker): void;

  // fossoyeur : aller chercher les défunts et les enterrer au cimetière de l'église
  churchInfo(churchId: number): boolean; // false : l'église n'existe plus
  buryPlan(churchId: number, from: Cell, w: Worker): BuryPlan | null;
  buryDo(plan: BuryPlan, w: Worker): void;

  // soigneur : ce qu'il y a à faire pour la maison du soigneur (diagnostic, remèdes, ingrédients, soins)
  clinicInfo(clinicId: number): boolean; // false : la maison du soigneur n'existe plus
  healPlan(clinicId: number, from: Cell, w: Worker): HealPlan | null;
  quarantined(w: Worker): boolean; // sa maison est en quarantaine
  healDo(plan: HealPlan, w: Worker): void; // l'action sur place (soigner, préparer, ranger, ramasser…)

  // cueilleur : les arbustes à baies autour d'un dépôt
  berryTarget(depotId: number, from: Cell, claim: boolean, skip: Set<number>): { idx: number; x: number; y: number } | null; // l'arbuste mûr non visé le plus proche, n'importe où sur la carte (réservé si claim) ; skip : ceux qu'il n'a pas pu atteindre
  pickBerries(idx: number): number; // cueille : renvoie les baies (0 si déjà cueilli)
  depositBerries(depotId: number, n: number, w: Worker): number;

  // apiculteur : un rucher à soigner, du miel à récolter et à porter à un dépôt
  apiaryInfo(id: number): { care: number; honey: number; entrance: Cell } | null; // null : le rucher n'existe plus
  tendApiary(id: number): void;
  harvestApiary(id: number, max: number): number;
  honeyDepot(from: Cell): { id: number; entrance: Cell } | null; // le dépôt le plus proche qui a de la place
  depositHoney(depotId: number, n: number, w: Worker): number;

  // chasseur : un camp à servir et du gibier à trouver
  lodgeInfo(id: number): { free: number; entrance: Cell } | null; // null : le camp n'existe plus
  preyNear(lodgeId: number, from: Cell): { id: number; x: number; y: number } | null; // le gibier libre le plus proche (il est alors réservé)
  preyPos(id: number): { x: number; y: number } | null; // null : il n'est plus là
  releasePrey(id: number): void;
  kill(id: number): number; // renvoie les portions de viande (0 s'il avait déjà disparu)
  depositMeat(lodgeId: number, n: number, w: Worker): number;

  // corvée d'eau : aller chercher de l'eau au puits pour sa maison
  waterTarget(houseId: number, needWater: boolean, food?: boolean): WaterRoute; // needWater : il faut une source qui a du stock ; food : la source est une boucherie
  takeWater(wellId: number, max: number, food?: boolean, kind?: "butcher" | "depot"): number;
  deliverWater(houseId: number, n: number, w: Worker, food?: boolean): number; // renvoie ce que la maison a pu prendre
  spawnSpot(self: Worker): Cell; // case libre où sortir de la maison : jamais celle d'un autre
  homeEntrance(w: Worker): Cell | null; // entrée de sa maison, s'il en a une

  // bâtisseur : un chantier à servir
  siteInfo(id: number): { missing: number; ready: boolean; entrance: Cell; plank: boolean } | null; // null : le chantier n'existe plus (terminé ou annulé)
  buildRoute(siteId: number, wantWood: boolean): BuildRoute;
  takeFromSource(src: { kind: "camp" | "depot" | "sawmill" | "lodge" | "butcher"; id: number }, max: number, plank?: boolean, cuts?: boolean, honey?: boolean, berries?: boolean): number;
  exportGood(src: { kind: "camp" | "depot" | "sawmill" | "lodge" | "butcher"; id: number }, portId: number): ExportGood | null; // la ressource que cette source a à offrir à ce port
  takeGood(src: { kind: "camp" | "depot" | "sawmill" | "lodge" | "butcher"; id: number }, good: ExportGood, max: number): number; // prend cette ressource à la source (pour l'export) // quelle marchandise exportable ce dépôt a à offrir // plank : on cherche des planches (dépôts)
  depositSite(siteId: number, n: number, w: Worker): number; // livre au chantier ; renvoie ce qu'il a pu prendre
  workCell(siteId: number, from: Cell): Cell | null; // case libre au bord du chantier où travailler
  work(siteId: number, dt: number): boolean; // fait avancer le chantier ; true quand le bâtiment est terminé

  changed(): void; // il faut sauvegarder
  notify(text: string): void;
}

// Itinéraire d'un porteur : de l'entrée d'un camp relié (avec du bois) jusqu'à l'entrée de son dépôt, par les chemins.
export type HaulRoute =
  | { ok: true; src: { kind: "camp" | "sawmill" | "lodge" | "butcher" | "depot"; id: number }; campAccess: Cell; route: [number, number][] } // src : camp (bûches), scierie (planches) ou camp de chasseur (viande)
  | { ok: false; reason: "noDepot" | "full" | "noCamp" | "noRoad" | "empty" };

// Itinéraire d'un bâtisseur : de l'entrée d'une source de bois (camp ou dépôt) jusqu'à l'entrée du chantier, par les chemins.
export type BuildRoute =
  | { ok: true; src: { kind: "camp" | "depot" | "sawmill"; id: number }; access: Cell; route: [number, number][] }
  | { ok: false; reason: "noSite" | "noRoad" | "noWood" };

// Où aller pour une corvée d'eau : le puits (relié à la maison par un chemin) le plus proche qui a de l'eau.
export type WaterRoute =
  | { ok: true; wellId: number; wellAccess: Cell; houseAccess: Cell; srcKind?: "butcher" | "depot" }
  | { ok: false; reason: "noHouse" | "noWell" | "noRoad" | "full" };

// Éclaircit ou fonce une couleur #rrggbb.
function tint(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

type State = "idle" | "toTree" | "chopping" | "toCamp" | "toPickup" | "loading" | "toDepot" | "unloading" | "toWork" | "building" | "toHome" | "toPrey" | "aiming" | "toHive" | "tending" | "harvesting" | "toCraft" | "crafting" | "toBerry" | "picking" | "toHeal" | "healing" | "toBury" | "burying" | "toField" | "farming" | "toStall" | "stalling";

export class Worker {
  private path: [number, number][] = [];
  private facing = Math.PI / 2;
  private phase = 0;
  private state: State = "idle";
  private target = -1; // arbre visé
  private timer = 0; // chronomètre de l'action en cours (coupe, chargement)
  private ignore = new Set<number>(); // arbres inaccessibles pour lui
  private finished = false; // il a déjà prévenu que sa zone est terminée
  private waiting = false; // il attend sur place
  private waitT = 0;
  private needCamp = false; // bûcheron : sac plein et aucun camp n'a de place
  private campFull = false; // ... parce que les camps sont pleins (et non absents)
  private mustDeposit = false; // bûcheron : il lui reste du bois après un dépôt partiel
  private needDepot = false; // porteur : il ne peut pas livrer
  private haulBlock: "noDepot" | "full" | "noCamp" | "noRoad" | null = null; // ... et pourquoi
  private craftT = 0; // ouvrier : délai entre deux vérifications de son bâtiment
  private beeTask: "tend" | "harvest" | null = null; // apiculteur : ce qu'il va faire au rucher
  private beeDepot = -1; // apiculteur : dépôt où il porte son miel
  private preyId = -1; // chasseur : gibier visé
  private huntT = 0; // délai entre deux vérifications de la position du gibier
  private waterKind: "butcher" | "depot" | undefined; // corvée de nourriture : d'où il prend la viande
  private waterWell = -1; // corvée d'eau : puits où il va remplir sa cruche
  private hungryNow = false; // sa maison n'a plus de nourriture
  private thirstyNow = false; // sa maison n'a plus d'eau
  private anyTarget: { dest: HaulDest; id: number } | null = null; // porteur universel : destination du voyage en cours
  private pickSrc: { kind: "camp" | "depot" | "sawmill" | "lodge" | "butcher"; id: number } | null = null; // bâtisseur : source où il va charger
  private buildBlock: "noRoad" | "noWood" | null = null;
  private blockT = 0; // depuis combien de temps une case occupée le bloque
  private repathT = 0; // délai avant de chercher un autre chemin
  private reserved: Cell | null = null; // case où il va entrer : personne d'autre n'y entre
  private resumeGoal: Cell | null = null; // destination à rejoindre après s'être écarté pour laisser passer
  private warned = false; // il a déjà prévenu pour ce blocage
  private idleT = 0; // depuis combien de temps il ne fait rien
  private healCheckT = 0; // le soigneur en route chercher des ingrédients regarde de temps en temps si un malade l'attend
  private cookSec = 5; // durée de la préparation en cours
  private stallTask: StablePlan | SwinePlan | CookPlan | DinePlan | null = null; // éleveur : l'étape en cours
  private farmTask: FarmPlan | null = null; // fermier : l'étape en cours
  private buryTask: BuryPlan | null = null; // fossoyeur : l'étape en cours
  private healTask: HealPlan | null = null; // soigneur : l'étape en cours
  private visiting = false; // chez lui pour boire ou manger
  private visitT = 0;
  private visitOnly = false; // il n'est pas rentré dormir : il ressort aussitôt après
  private wakeT = 0; // chez lui avec un travail en attente : prochain coup d'œil

  constructor(public data: WorkerSave) {}

  get x() {
    return this.data.x;
  }
  get y() {
    return this.data.y;
  }
  get name() {
    return vn(this.data.name); // le prénom affiché (viking ou classique) ; la sauvegarde garde le prénom d'origine
  }
  get cell(): Cell {
    return { gx: Math.floor(this.data.x), gy: Math.floor(this.data.y) };
  }
  // Il est dans sa maison : on ne le voit plus et il ne gêne personne.
  get inside() {
    return !!this.data.inside;
  }
  // Énergie de 0 à 100 ; la fatigue est son contraire.
  get energy() {
    return this.data.energy ?? 100;
  }
  get resting() {
    return !!this.data.resting;
  }

  get moving() {
    return this.path.length > 0;
  }
  // Case qu'il est sur le point d'occuper : réservée, pour que deux personnages ne se retrouvent jamais ensemble.
  get nextCell(): Cell | null {
    return this.reserved;
  }
  get destination(): [number, number] | null {
    return this.path.length ? this.path[this.path.length - 1] : null;
  }

  // Il est en plein travail (une tâche lui est confiée).
  get working() {
    return this.data.job !== null;
  }

  get role() {
    return this.data.role;
  }

  // Texte d'état pour l'interface.
  get status(): string {
    const d = this.data;
    const carry = (d.carry > 0 ? ` · porte ${d.carry} ${d.cargo === "plank" ? "🪚" : d.cargo === "water" ? "💧" : d.cargo === "meat" ? "🍖" : d.cargo === "cuts" ? "🥩" : d.cargo === "honey" ? "🍯" : "🪵"}` : "") + (this.thirstyNow ? " · a soif 💧" : "") + (this.hungryNow ? " · a faim 🥩" : "");
    if (d.inside) return d.job ? "Chez lui · attend du travail" : "Chez lui · se repose";
    if (d.role === "craft") {
      if (!d.job || d.job.type !== "haul" || !d.job.craft) return `Ouvrier · sans poste${carry}`;
      return `${d.job.dest === "sawmill" ? "Scieur" : "Boucher"} · ${this.state === "crafting" ? "au travail" : carry ? "apporte le stock" : "va chercher le stock"}${carry}`;
    }
    if (d.role === "bee") {
      if (!d.job || d.job.type !== "bee") return `Apiculteur · sans rucher${carry}`;
      if (this.state === "tending") return `Apiculteur · soigne les ruches${carry}`;
      if (this.waiting) return `Apiculteur · attend (ruches en forme, miel pas prêt) · ${d.job.harvested} 🍯${carry}`;
      return `Apiculteur · ${d.job.harvested} 🍯 récoltés${carry}`;
    }
    if (d.role === "hunt") {
      if (!d.job || d.job.type !== "hunt") return `Chasseur · sans camp${carry}`;
      const n = `${d.job.hunted} 🍖 rapportée${d.job.hunted > 1 ? "s" : ""}`;
      if (this.state === "aiming") return `Chasseur · vise · ${n}${carry}`;
      if (this.waiting) return `Chasseur · attend (pas de gibier ou camp plein) · ${n}${carry}`;
      return `Chasseur · ${n}${carry}`;
    }
    if (d.role === "water") {
      if (!d.job || d.job.type !== "water") return `Corvée d'eau${carry}`;
      if (this.buildBlock === "noRoad") return "Corvée d'eau · il faut un chemin entre le puits et sa maison";
      if (this.waiting) return `Corvée · attend (source vide) · ${d.job.hauled} livrées${carry}`;
      if (d.job.dine !== undefined) return this.state === "stalling" ? "Mange à la taverne" : "Va manger à la taverne";
      return `Va chercher ${d.job.food ? "à manger" : "de l'eau"} pour sa maison${d.resume ? ", puis reprendra son travail" : ""} · ${d.job.hauled} livrées${carry}`;
    }
    if (d.visit) return d.inside ? "Boit et mange chez lui" : "Rentre boire ou manger";
    if (d.resting) return d.inside ? "Se repose chez lui" : "Rentre se reposer";
    if (this.state === "toHome") return "Rentre chez lui";
    if (d.role === "wood") {
      if (!d.job || d.job.type !== "wood") return `Bûcheron · à toi de choisir la zone${carry}`;
      const n = `${d.job.chopped} arbre${d.job.chopped > 1 ? "s" : ""} coupé${d.job.chopped > 1 ? "s" : ""}`;
      if (this.needCamp) return this.campFull ? `Bûcheron · camp plein : il attend qu'on le vide${carry}` : `Bûcheron · sac plein : il lui faut un camp de bûcheron${carry}`;
      if (this.waiting) return `Bûcheron · attend sur place · ${n}${carry}`;
      return `Bûcheron · ${n}${carry}`;
    }
    if (d.role === "haul") {
      if (!d.job || d.job.type !== "haul") return `Porteur · sans dépôt à servir${carry}`;
      const n = `${d.job.hauled} livré${d.job.hauled > 1 ? "s" : ""}`;
      if (this.needDepot) {
        const why =
          this.haulBlock === "full"
            ? "dépôt plein"
            : this.haulBlock === "noRoad"
              ? "il lui faut un chemin jusqu'à l'entrée du dépôt et de ses camps"
              : this.haulBlock === "noCamp"
                ? this.data.job?.type !== "haul"
                  ? "il lui faut une destination"
                  : haulDest(this.data.job) === "sawmill"
                    ? "il lui faut un camp de bûcheron"
                    : haulDest(this.data.job) === "butcher"
                      ? "il lui faut un camp de chasseur"
                      : "il lui faut une scierie ou une boucherie"
                : "il lui faut un dépôt";
        return `Porteur · ${why}${carry}`;
      }
      if (this.waiting) return `Porteur · attend du stock à rapporter · ${n}${carry}`;
      return `Porteur · ${n}${carry}`;
    }
    if (d.role === "build") {
      if (!d.job || d.job.type !== "build") return `Bâtisseur · sans chantier${carry}`;
      if (this.state === "building") return `Bâtisseur · construit${carry}`;
      if (this.buildBlock === "noRoad") return "Bâtisseur · il faut un chemin entre l'entrée du chantier et une réserve de matériaux";
      if (this.buildBlock === "noWood") return "Bâtisseur · attend des matériaux dans les réserves reliées";
      return `Bâtisseur · ${d.job.delivered} 🪵 livré${d.job.delivered > 1 ? "s" : ""}${carry}`;
    }
    return this.moving ? "En route" : "Villageois · se repose";
  }

  // ---------- ordres du joueur ----------

  // Ordre de marche : annule le travail en cours (le bois porté reste sur son dos).
  moveTo(path: [number, number][], env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.job = null;
    this.resetWait();
    this.state = "idle";
    this.path = path;
    env.changed();
  }

  stop(env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.job = null;
    this.resetWait();
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Change de métier : la tenue change, et le travail en cours s'arrête.
  setRole(role: "none" | "wood" | "haul" | "build" | "water" | "hunt" | "bee" | "craft" | "gather" | "heal" | "bury" | "farm" | "tend" | "swine" | "cook", env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = role;
    this.data.job = null;
    this.resetWait();
    this.finished = false;
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  startWood(zone: Zone, env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = "wood";
    this.finished = false;
    this.resetWait();
    this.data.job = { type: "wood", zone, chopped: 0 };
    this.ignore.clear();
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Devient porteur de ce dépôt : il va chercher le bois des camps qui lui sont reliés et le livre ici.
  startHaul(depotId: number, env: WorkerEnv, dest: HaulDest | "any" = "depot") {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = "haul";
    this.resetWait();
    this.data.job = { type: "haul", depotId: dest === "any" ? 0 : depotId, hauled: 0, sawmill: dest === "sawmill", dest };
    this.anyTarget = null;
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Devient ouvrier de cette scierie ou boucherie : il va à son entrée et y travaille tant qu'on ne le renvoie pas.
  startCraft(kind: "sawmill" | "butcher", id: number, env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = "craft";
    this.resetWait();
    this.data.job = { type: "haul", depotId: id, hauled: 0, dest: kind, craft: true }; // il va chercher le stock (bûches, viande), le livre, puis entre travailler
    this.anyTarget = null;
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Il travaille sur place (c'est ce qui fait tourner la scierie ou la boucherie).
  get crafting() {
    return this.state === "crafting";
  }

  // Le soigneur prépare un remède : il est entré dans sa maison, on ne le voit plus.
  // Cet arbuste est-il à oublier (inaccessible pour lui) ?
  skipsBush(idx: number) {
    return this.ignore.has(idx);
  }

  get brewing() {
    return this.state === "healing" && this.healTask?.type === "brew";
  }

  // Devient éleveur de cette étable : il nourrit et abreuve les vaches, trait le lait et le range au dépôt.
  startTend(stableId: number, env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = "tend";
    this.resetWait();
    this.data.job = { type: "tend", stableId, milked: 0 };
    this.stallTask = null;
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Devient cuisinier de cette taverne : il rapporte les ingrédients des dépôts et prépare les plats.
  startCook(tavernId: number, env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = "cook";
    this.resetWait();
    this.data.job = { type: "cook", tavernId, cooked: 0 };
    this.stallTask = null;
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Il va manger à la taverne : il met son travail de côté (comme pour une corvée) et le reprendra ensuite.
  startDine(tavernId: number, env: WorkerEnv) {
    const before = this.data.job && this.data.job.type !== "water" ? { role: this.data.role, job: this.data.job } : this.data.resume;
    this.leave(env);
    this.releaseTree(env);
    this.data.role = "water";
    this.resetWait();
    this.data.job = { type: "water", houseId: this.data.home ?? 0, hauled: 0, dine: tavernId };
    this.data.resume = before;
    this.stallTask = null;
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Le cuisinier est entré en cuisine : on ne le voit plus.
  get cooking() {
    return this.state === "stalling" && this.data.job?.type === "cook" && this.stallTask?.type === "cook";
  }

  // Devient porcher de cette porcherie : il nourrit et abreuve les cochons, les abat sur ordre et range la viande au dépôt.
  startSwine(pigpenId: number, env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = "swine";
    this.resetWait();
    this.data.job = { type: "swine", pigpenId, slaughtered: 0 };
    this.stallTask = null;
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Devient fermier de cette ferme : il sème, récolte et range la récolte au dépôt.
  startFarm(farmId: number, env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = "farm";
    this.resetWait();
    this.data.job = { type: "farm", farmId, harvested: 0 };
    this.farmTask = null;
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Devient fossoyeur de cette église : il enterre les défunts.
  startBury(churchId: number, env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = "bury";
    this.resetWait();
    this.data.job = { type: "bury", churchId, buried: 0 };
    this.buryTask = null;
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Devient soigneur de cette maison : il prépare des remèdes et soigne les malades.
  startHeal(clinicId: number, env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = "heal";
    this.resetWait();
    this.data.job = { type: "heal", clinicId, treated: 0 };
    this.healTask = null;
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Devient cueilleur : il ramasse les baies des arbustes autour de ce dépôt et les y range.
  startGather(depotId: number, env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = "gather";
    this.resetWait();
    this.data.job = { type: "gather", depotId, gathered: 0 };
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Devient apiculteur de ce rucher : il soigne les ruches, récolte le miel et le porte à un dépôt.
  startBee(apiaryId: number, env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = "bee";
    this.resetWait();
    this.data.job = { type: "bee", apiaryId, harvested: 0 };
    this.state = "idle";
    this.path = [];
    this.beeTask = null;
    env.changed();
  }

  // Devient chasseur de ce camp : il traque le gibier autour du camp et rapporte la viande.
  startHunt(lodgeId: number, env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = "hunt";
    this.resetWait();
    this.data.job = { type: "hunt", lodgeId, hunted: 0 };
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Corvée d'eau : il va chercher de l'eau à un puits relié par un chemin et la rapporte à cette maison, jusqu'à ce qu'elle soit pleine.
  startWater(houseId: number, env: WorkerEnv, food = false) {
    const before = this.data.job && this.data.job.type !== "water" ? { role: this.data.role, job: this.data.job } : this.data.resume; // son activité d'avant
    this.leave(env);
    this.releaseTree(env);
    this.data.role = "water";
    this.resetWait();
    this.data.job = { type: "water", houseId, hauled: 0, food };
    this.data.resume = before;
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Devient bâtisseur de ce chantier.
  startBuild(siteId: number, env: WorkerEnv) {
    this.leave(env);
    this.data.resume = undefined;
    this.data.resting = false;
    this.releaseTree(env);
    this.data.role = "build";
    this.resetWait();
    this.data.job = { type: "build", siteId, delivered: 0 };
    this.state = "idle";
    this.path = [];
    env.changed();
  }

  // Il sort de sa maison sur une case libre.
  leave(env: WorkerEnv) {
    if (!this.data.inside) return;
    this.data.inside = false;
    const c = env.spawnSpot(this);
    this.data.x = c.gx + 0.5;
    this.data.y = c.gy + 0.5;
  }

  private resetWait() {
    this.buildBlock = null;
    this.waiting = false;
    this.needCamp = false;
    this.campFull = false;
    this.mustDeposit = false;
    this.needDepot = false;
    this.haulBlock = null;
    this.warned = false;
  }

  private releaseTree(env: WorkerEnv) {
    if (this.target >= 0) env.claimed.delete(this.target);
    this.target = -1;
    if (this.preyId >= 0) env.releasePrey(this.preyId);
    this.preyId = -1;
  }

  // ---------- boucle ----------

  update(dt: number, env: WorkerEnv) {
    if (this.data.inside) {
      this.data.energy = Math.min(100, this.energy + REST_RATE * (1 + (NIGHT_REST - 1) * env.night()) * dt); // on se repose mieux la nuit
      // chez lui, il se sert dans le garde-manger dès qu'il a soif ou faim (même s'il attend du travail ou dort)
      if (!this.data.visit && ((((this.data.thirst ?? 0) >= NEED_GO) && env.houseStock(this, "water") > 0) || (((this.data.hunger ?? 0) >= NEED_GO) && env.houseStock(this, "food") > 0))) env.satisfy(this);
      if (this.data.visit) {
        if (!this.visiting) {
          env.satisfy(this); // il boit et mange ce que sa maison a en réserve
          this.visiting = true;
          this.visitT = 2.5;
        }
        this.visitT -= dt;
        if (this.visitT <= 0) {
          this.visiting = false;
          this.data.visit = false;
          if (this.visitOnly) {
            this.visitOnly = false;
            this.wake(env);
          }
        }
        return;
      }
      if (this.data.resting) {
        const ill = this.data.illness;
        if (this.energy >= WAKE_AT && (!ill || (ill.sev < 20 && !env.quarantined(this)))) this.wake(env); // reposé (et remis, s'il était malade) : il ressort et reprend son activité
        return;
      }
      // chez lui : sans travail il attend un ordre ; avec un travail en attente, il ressort dès qu'il y a de quoi faire
      if (this.data.job) {
        this.wakeT -= dt;
        if (this.wakeT <= 0) {
          this.wakeT = 3;
          if (this.hasWork(env)) {
            this.leave(env);
            this.waiting = false;
            this.waitT = 0;
            this.warned = false;
          }
        }
      }
      return;
    }
    // la fatigue : on s'épuise en marchant et en travaillant, on récupère à l'arrêt (un peu) et chez soi (vite)
    const busy = this.path.length > 0 || this.state !== "idle";
    const night = env.night();
    this.data.energy = Math.max(0, Math.min(100, this.energy + (busy ? -DRAIN * (1 + (NIGHT_DRAIN - 1) * night) * env.climate().drain * (this.data.illness ? 1.4 : 1) * ((this.data.age ?? 25) >= AGE_ELDER ? 1.25 : 1) : IDLE_RATE) * dt)); // la nuit et l'hiver, on se fatigue plus vite
    const homeSec = IDLE_HOME_SEC * (1 - (1 - NIGHT_IDLE_HOME) * night); // la nuit on rentre plus vite
    if (this.energy <= EXHAUSTED && !this.data.resting) this.rest(env);
    // très malade : il garde le lit chez lui (sans maison, il reste là où il est)
    if (this.data.illness && (this.data.illness.sev >= SICK_BED || env.quarantined(this)) && !this.data.resting && this.data.home != null) {
      // un soigneur malade ne va pas au lit tant qu'il a un remède pour se soigner (voir healPlan)
      const job = this.data.job;
      if (!(job?.type === "heal" && !env.quarantined(this) && env.healPlan(job.clinicId, this.cell, this) !== null)) this.rest(env);
    }
    // soif ou faim : il rentre boire ou manger si sa maison a de quoi (sinon il reste comme il est, et finit par s'énerver)
    if (!this.data.resting && !this.data.visit && this.data.home != null && this.data.job?.type !== "water") {
      const thirst = this.data.thirst ?? 0;
      const hunger = this.data.hunger ?? 0;
      const wantsDrink = thirst >= NEED_GO && env.houseStock(this, "water") > 0;
      const wantsEat = hunger >= NEED_GO && env.houseStock(this, "food") > 0;
      if ((wantsDrink || wantsEat) && this.rest(env)) {
        this.data.visit = true;
        this.visitOnly = true;
      }
    }
    // il est inactif s'il n'a pas de travail, ou s'il attend (du bois, des arbres…) : au bout d'un moment il rentre
    if (this.path.length || this.state !== "idle" || (this.data.job && !this.waiting)) this.idleT = 0;
    // le soigneur en route chercher des baies ou du miel : un malade qu'il peut soigner avec ce qu'il a déjà prêt passe avant
    if (this.state === "toHeal" && this.path.length && (this.healTask?.type === "fetch" || this.healTask?.type === "bush") && this.data.job?.type === "heal") {
      this.healCheckT -= dt;
      if (this.healCheckT <= 0) {
        this.healCheckT = 1;
        const next = env.healPlan(this.data.job.clinicId, this.cell, this);
        if (next && (next.type === "grab" || next.type === "treat")) {
          this.healTask = null;
          this.path = [];
          this.state = "idle"; // il abandonne la course : il repart soigner
          env.changed();
        }
      }
    }
    if (this.state === "toPrey") this.trackPrey(dt, env);
    if (this.path.length) {
      this.repathT = Math.max(0, this.repathT - dt);
      if (this.blocked(dt, env)) return;
      this.walk(dt, env);
      if (!this.path.length) {
        this.reserved = null;
        env.changed(); // arrivé : on sauvegarde la position
        if (this.resumeGoal) this.resumeAfterAside(env);
        else this.arrive(env);
      }
      return;
    }
    // actions qui durent un moment : couper, charger, décharger, construire
    if (this.state === "aiming") {
      this.timer += dt;
      const pos = this.preyId >= 0 ? env.preyPos(this.preyId) : null;
      if (!pos) {
        this.releaseTree(env);
        this.state = "idle";
        return;
      }
      this.facing = Math.atan2(pos.y - this.y, pos.x - this.x);
      if (this.timer < AIM_SECONDS) return;
      const id = this.preyId;
      this.state = "idle";
      if (Math.hypot(pos.x - this.x, pos.y - this.y) > HUNT_RANGE + 1.2) {
        this.releaseTree(env); // il a filé : raté, on reprend la traque
        return;
      }
      const meat = env.kill(id);
      this.preyId = -1;
      env.releasePrey(id);
      if (meat > 0) {
        this.data.cargo = "meat";
        this.data.carry += meat;
        if (this.data.job?.type === "hunt") this.data.job.hunted += meat;
      }
      env.changed();
      return;
    }
    if (this.state === "crafting") {
      this.timer += dt; // l'ouvrier frappe, scie, découpe : le bâtiment tourne tant qu'il est là
      this.craftT += dt;
      if (this.craftT > 0.5) {
        this.craftT = 0;
        const c = this.data.job;
        const k = c && c.type === "haul" && c.craft && c.dest !== "any" ? (c.dest as "sawmill" | "butcher") : null;
        if (!c || c.type !== "haul" || !k || !env.craftInfo(k, c.depotId)) {
          this.state = "idle"; // le bâtiment n'existe plus
          this.data.job = null;
          this.data.role = "none";
          env.changed();
        } else if (!env.craftReady(k, c.depotId)) {
          this.state = "idle"; // plus rien à transformer : il ressort chercher du stock
          env.changed();
        }
      }
      return;
    }
    if (this.state === "stalling") {
      this.timer += dt;
      const plan = this.stallTask;
      if (this.timer < (plan?.type === "milk" ? 2.6 : plan?.type === "slaughter" ? 3 : plan?.type === "eat" ? 3.5 : plan?.type === "cook" ? this.cookSec : 1.8)) return;
      this.state = "idle";
      this.stallTask = null;
      const sj = this.data.job;
      if (plan) {
        if (sj?.type === "swine") env.pigDo(plan as SwinePlan, this);
        else if (sj?.type === "cook") env.tavernDo(plan as CookPlan, this);
        else if (sj?.type === "water" && sj.dine !== undefined) env.dineDo(plan as DinePlan, this);
        else env.stableDo(plan as StablePlan, this);
      }
      if (sj?.type === "water" && sj.dine !== undefined) this.endErrand(env); // il a mangé : il reprend son travail
      env.changed();
      return;
    }
    if (this.state === "farming") {
      this.timer += dt;
      const plan = this.farmTask;
      if (this.timer < (plan?.type === "sow" ? SOW_SEC : plan?.type === "reap" ? REAP_SEC : plan?.type === "water" ? 1.2 : 1.8)) return;
      this.state = "idle";
      this.farmTask = null;
      if (plan) env.farmDo(plan, this);
      env.changed();
      return;
    }
    if (this.state === "burying") {
      this.timer += dt;
      if (this.timer < (this.buryTask?.type === "inter" ? 3.2 : 2.2)) return;
      this.state = "idle";
      const plan = this.buryTask;
      this.buryTask = null;
      if (plan) env.buryDo(plan, this);
      env.changed();
      return;
    }
    if (this.state === "healing") {
      this.timer += dt;
      const plan = this.healTask;
      if (this.timer < (plan?.type === "brew" ? BREW_SEC * healSkill(this.data.xp ?? 0).brew : plan?.type === "bush" ? BERRY_PICK_SEC : 2.2)) return;
      this.state = "idle";
      this.healTask = null;
      if (plan) env.healDo(plan, this);
      env.changed();
      return;
    }
    if (this.state === "picking") {
      this.timer += dt;
      if (this.timer < BERRY_PICK_SEC) return;
      this.state = "idle";
      const gj = this.data.job;
      if (gj?.type === "gather" && this.target >= 0) {
        const got = env.pickBerries(this.target);
        env.claimed.delete(this.target);
        this.target = -1;
        if (got > 0) {
          this.data.cargo = "berries";
          this.data.carry += got;
          gj.gathered += got;
        }
      }
      env.changed();
      return;
    }
    if (this.state === "tending" || this.state === "harvesting") {
      this.timer += dt;
      if (this.timer < (this.state === "tending" ? TEND_SEC : HARVEST_SEC)) return;
      const tended = this.state === "tending";
      this.state = "idle";
      const bee = this.data.job;
      if (bee?.type === "bee") {
        if (tended) env.tendApiary(bee.apiaryId);
        else {
          const got = env.harvestApiary(bee.apiaryId, HARVEST_MAX - this.data.carry);
          if (got > 0) {
            this.data.cargo = "honey";
            this.data.carry += got;
            bee.harvested += got;
          }
        }
      }
      env.changed();
      return;
    }
    if (this.state === "building") {
      const job = this.data.job;
      this.timer += dt;
      if (job?.type !== "build") {
        this.state = "idle";
        return;
      }
      if (env.work(job.siteId, dt)) {
        this.state = "idle";
        env.notify(`${this.name} a terminé la construction.`);
        env.changed();
      }
      return;
    }
    if (this.state === "chopping") {
      this.timer += dt;
      if (this.timer >= CHOP_SECONDS) {
        const idx = this.target;
        this.state = "idle";
        this.target = -1;
        env.claimed.delete(idx);
        if (!env.isFelled(idx)) {
          this.data.cargo = "wood";
          this.data.carry += env.chop(this, idx); // le bois est chargé sur son dos
          if (this.data.job?.type === "wood") this.data.job.chopped++;
          env.changed();
        }
      }
      return;
    }
    if (this.state === "loading" || this.state === "unloading") {
      this.timer += dt;
      if (this.timer < LOAD_SECONDS) return;
      if (this.state === "loading") this.finishLoading(env);
      else this.finishUnloading(env);
      return;
    }
    const job = this.data.job;
    if (!job) {
      // il ne fait rien : au bout d'un moment il rentre chez lui
      this.idleT += dt;
      if (this.idleT > homeSec) {
        this.idleT = 0;
        this.goHome(env);
      }
      return;
    }
    this.idleT += dt;
    if (this.waiting && this.idleT > homeSec) {
      this.idleT = 0;
      this.goHome(env);
      if (this.state === "toHome") return;
    }
    if (this.waiting) {
      this.waitT -= dt;
      if (this.waitT > 0) return;
    }
    if (job.type === "wood") this.woodStep(env);
    else if (job.type === "haul") this.haulStep(env);
    else if (job.type === "build") this.buildStep(env);
    else if (job.type === "hunt") this.huntStep(env);
    else if (job.type === "bee") this.beeStep(env);
    else if (job.type === "gather") this.gatherStep(env);
    else if (job.type === "heal") this.healStep(env);
    else if (job.type === "bury") this.buryStep(env);
    else if (job.type === "farm") this.farmStep(env);
    else if (job.type === "tend") this.tendStep(env);
    else if (job.type === "swine") this.swineStep(env);
    else if (job.type === "cook") this.cookStep(env);
    else this.waterStep(env);
  }

  // Un personnage n'entre pas dans une case où un autre se tient ou qu'il a réservée : il attend, puis cherche un
  // autre chemin, et finit par demander à celui qui bloque de s'écarter.
  private blocked(dt: number, env: WorkerEnv): boolean {
    const [tx, ty] = this.path[0];
    const next = { gx: Math.floor(tx), gy: Math.floor(ty) };
    const here = this.cell;
    if ((next.gx === here.gx && next.gy === here.gy) || !env.taken(next, this)) {
      this.blockT = 0;
      this.reserved = next;
      return false;
    }
    this.reserved = null;
    this.blockT += dt;
    if (this.blockT > 0.5 && this.repathT <= 0) {
      this.repathT = 1;
      const g = this.path[this.path.length - 1];
      const p = env.findPath(here, { gx: Math.floor(g[0]), gy: Math.floor(g[1]) }, this);
      if (p && p.length) this.path = p;
    }
    if (this.blockT > 3) {
      env.blockerAt(next, this)?.stepAside(env);
      this.blockT = 1.5;
    }
    return true;
  }

  // On lui demande de laisser passer : s'il est au repos (ou lui-même coincé), il fait un pas de côté.
  stepAside(env: WorkerEnv) {
    if (!this.path.length && this.state !== "idle") return; // en pleine action (couper, charger) : il ne bouge pas
    if (this.path.length && this.blockT < 1) return; // il avance : ça se débloquera tout seul
    const here = this.cell;
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
      const c = { gx: here.gx + dx, gy: here.gy + dy };
      if (!env.isWalkable(c.gx, c.gy) || env.taken(c, this)) continue;
      if (this.path.length && !this.resumeGoal) {
        const g = this.path[this.path.length - 1];
        this.resumeGoal = { gx: Math.floor(g[0]), gy: Math.floor(g[1]) };
      }
      this.path = [[c.gx + 0.5, c.gy + 0.5]];
      this.blockT = 0;
      this.reserved = c;
      return;
    }
  }

  // Après s'être écarté, il reprend sa route vers sa destination.
  private resumeAfterAside(env: WorkerEnv) {
    const goal = this.resumeGoal!;
    this.resumeGoal = null;
    const p = env.findPath(this.cell, goal, this);
    if (p && p.length) {
      this.path = p;
      return;
    }
    if (p) {
      this.arrive(env); // déjà arrivé
      return;
    }
    this.state = "idle";
    this.releaseTree(env);
  }

  // Y a-t-il de nouveau de quoi travailler ? (il le vérifie de chez lui, de temps en temps)
  private hasWork(env: WorkerEnv): boolean {
    const job = this.data.job;
    if (!job) return false;
    if (job.type === "wood") {
      if (this.data.carry > 0) return env.camps(this.cell).length > 0;
      return env.treesIn(job.zone).some((i) => !env.claimed.has(i) && !this.ignore.has(i));
    }
    if (job.type === "haul" && job.dest === "any") return env.anyHaulTask(this.cell, this.data.carry > 0 ? this.data.cargo : undefined) !== null;
    if (job.type === "haul" && job.craft && env.craftReady(job.dest as "sawmill" | "butcher", job.depotId)) return true;
    if (job.type === "haul") {
      const depot = env.depotInfo(job.depotId, haulDest(job));
      if (!depot) return true; // il n'a plus de dépôt : il sort le constater
      return depot.free > 0 && env.haulRoute(job.depotId, this.data.carry === 0, haulDest(job)).ok;
    }
    if (job.type === "water" && job.dine !== undefined) return env.dinePlan(job.dine, this.cell, this) !== null;
    if (job.type === "water") return env.waterTarget(job.houseId, this.data.carry === 0, job.food).ok;
    if (job.type === "cook") return env.tavernInfo(job.tavernId) ? env.tavernPlan(job.tavernId, this.cell, this) !== null : true;
    if (job.type === "swine") return env.pigInfo(job.pigpenId) ? env.pigPlan(job.pigpenId, this.cell, this) !== null : true;
    if (job.type === "tend") return env.stableInfo(job.stableId) ? env.stablePlan(job.stableId, this.cell, this) !== null : true;
    if (job.type === "farm") return env.farmInfo(job.farmId) ? env.farmPlan(job.farmId, this.cell, this) !== null : true;
    if (job.type === "bury") return env.churchInfo(job.churchId) ? env.buryPlan(job.churchId, this.cell, this) !== null : true;
    if (job.type === "heal") return env.clinicInfo(job.clinicId) ? env.healPlan(job.clinicId, this.cell, this) !== null : true;
    if (job.type === "gather") return this.data.carry > 0 ? env.honeyDepot(this.cell) !== null : env.berryTarget(job.depotId, this.cell, false, this.ignore) !== null;
    if (job.type === "bee") {
      const ap = env.apiaryInfo(job.apiaryId);
      if (!ap) return true;
      if (this.data.carry > 0) return env.honeyDepot(this.cell) !== null;
      return ap.care < TEND_BELOW || ap.honey >= HARVEST_MIN;
    }
    if (job.type === "hunt") {
      const lodge = env.lodgeInfo(job.lodgeId);
      if (!lodge) return true;
      if (this.data.carry > 0) return lodge.free > 0;
      const prey = env.preyNear(job.lodgeId, this.cell);
      if (prey) env.releasePrey(prey.id);
      return !!prey;
    }
    const site = env.siteInfo(job.siteId);
    if (!site || site.ready) return true;
    return env.buildRoute(job.siteId, this.data.carry === 0).ok;
  }

  // Ce qu'il fait en ce moment, en une courte phrase (affichée dans le menu des bâtiments où il travaille).
  get activity(): string {
    const t = this.activityRaw;
    return this.fem ? t.replace(/chez lui/g, "chez elle").replace(/Chez lui/g, "Chez elle") : t;
  }

  get fem(): boolean {
    return FEMALE_NAMES.includes(this.data.name);
  }

  private get activityRaw(): string {
    const d = this.data;
    if (d.visit) return d.inside ? "Boit et mange chez lui" : "Rentre boire ou manger";
    if (d.inside) return d.resting ? "Se repose chez lui" : "Chez lui";
    if (d.resting) return "Rentre se reposer";
    const job = d.job;
    if (!job) return this.moving ? "En route" : "Disponible";
    if (this.waiting && !this.moving) return "Rien à faire pour le moment";
    const what = d.cargo === "plank" ? "🪚" : d.cargo === "water" ? "💧" : d.cargo === "meat" ? "🍖" : d.cargo === "cuts" ? "🥩" : d.cargo === "honey" ? "🍯" : d.cargo === "berries" ? "🫐" : d.cargo === "tisane" ? "🍵" : d.cargo === "syrup" ? "🧪" : d.cargo === "body" ? "⚰️" : d.cargo === "milk" ? "🥛" : d.cargo === "meal" ? "🍲" : d.cargo && d.cargo in FARM_CROPS ? FARM_CROPS[d.cargo as FarmCrop].emoji : "🪵";
    const load = d.carry > 0 ? ` · ${d.carry} ${what}` : "";
    switch (job.type) {
      case "cook":
        return this.state === "stalling" ? (this.stallTask?.type === "cook" ? "Prépare un plat" : this.stallTask?.type === "fetch" ? "Prend des ingrédients" : this.stallTask?.type === "store" ? "Range le plat au cellier" : "Range les ingrédients") : d.carry > 0 ? (d.cargo === "meal" ? "Porte le plat au cellier" : "Rapporte des ingrédients") : this.moving ? "Va chercher des ingrédients" : "Veille sur les fourneaux";
      case "swine":
        return this.state === "stalling" ? (this.stallTask?.type === "slaughter" ? "Abat un cochon" : this.stallTask?.type === "feed" ? "Remplit l'auge" : this.stallTask?.type === "pour" ? "Remplit l'abreuvoir" : this.stallTask?.type === "deliver" ? "Range la viande" : "Charge") : d.carry > 0 ? (d.cargo === "meat" ? `Porte la viande${load}` : d.cargo === "water" ? "Rapporte de l'eau" : "Rapporte des légumes") : this.moving ? "En tournée" : "Veille sur les cochons";
      case "tend":
        return this.state === "stalling" ? (this.stallTask?.type === "milk" ? "Trait les vaches" : this.stallTask?.type === "feed" ? "Remplit l'auge" : this.stallTask?.type === "pour" ? "Remplit l'abreuvoir" : this.stallTask?.type === "deliver" ? "Range le lait" : "Charge") : d.carry > 0 ? (d.cargo === "milk" ? `Porte le lait${load}` : d.cargo === "water" ? "Rapporte de l'eau" : "Rapporte de l'herbe") : this.moving ? "En tournée" : "Veille sur les vaches";
      case "farm":
        return this.state === "farming" ? (this.farmTask?.type === "sow" ? "Sème" : this.farmTask?.type === "reap" ? "Récolte" : this.farmTask?.type === "water" ? "Arrose" : this.farmTask?.type === "fetch" ? "Puise de l'eau" : this.farmTask?.type === "pour" ? "Remplit la cuve" : "Range la récolte") : d.carry > 0 && d.cargo === "water" ? "Rapporte de l'eau" : d.carry > 0 ? `Porte la récolte${load}` : this.moving ? "Va aux champs" : "Surveille les cultures";
      case "bury":
        return this.state === "burying" ? (this.buryTask?.type === "inter" ? "Enterre un défunt" : "Prend un défunt") : d.carry > 0 ? "Porte un défunt à l'église" : this.moving ? "Va chercher un défunt" : "Veille sur le cimetière";
      case "heal":
        return this.state === "healing" ? (this.healTask?.type === "brew" ? "Prépare un remède" : this.healTask?.type === "treat" ? (this.healTask.prevent ? "Donne une tisane préventive" : "Soigne un malade") : this.healTask?.type === "bush" ? "Cueille des baies" : "S'occupe du stock") : d.carry > 0 ? (d.cargo === "tisane" || d.cargo === "syrup" ? "Porte un remède" : "Rapporte des ingrédients") : this.moving ? (this.healTask?.type === "bush" ? "Va cueillir des baies" : "En tournée") : "Attend un malade";
      case "gather":
        return this.state === "picking" ? "Cueille des baies" : d.carry > 0 ? `Rapporte des baies${load}` : this.moving ? "Va aux arbustes" : "Cherche des baies";
      case "bee":
        return this.state === "tending" ? "Soigne les ruches" : this.state === "harvesting" ? "Récolte le miel" : d.carry > 0 ? `Porte le miel${load}` : this.moving ? "Va aux ruches" : "Surveille les ruches";
      case "hunt":
        return this.state === "aiming" ? "Vise sa proie" : this.state === "toPrey" ? "Traque le gibier" : d.carry > 0 ? `Rapporte la viande${load}` : "Cherche du gibier";
      case "build":
        return this.state === "building" ? "Construit" : d.carry > 0 ? `Apporte des matériaux${load}` : this.moving ? "Va chercher des matériaux" : "Se prépare";
      case "haul":
        if (job.craft) return this.state === "crafting" ? (job.dest === "sawmill" ? "Scie des planches" : "Prépare la viande") : this.state === "loading" ? "Charge" : this.state === "unloading" ? "Décharge" : d.carry > 0 ? `Apporte le stock${load}` : this.moving ? "Va chercher le stock" : "Attend du stock";
        return this.state === "loading" ? "Charge" : this.state === "unloading" ? "Décharge" : d.carry > 0 ? `Transporte${load}` : this.moving ? "Va chercher du stock" : "Cherche un transport";
      case "wood":
        return this.state === "chopping" ? "Coupe un arbre" : this.state === "toCamp" ? `Porte le bois au camp${load}` : this.state === "toTree" ? "Va vers un arbre" : "Cherche un arbre";
      case "water":
        return job.dine !== undefined ? (this.state === "stalling" ? "Mange à la taverne" : "Va manger à la taverne") : job.food ? "Va chercher à manger" : "Va chercher de l'eau";
    }
  }

  // Les bâtiments auxquels il est lié en ce moment (le menu d'un bâtiment liste ceux qui y travaillent).
  involvedIn(): { kind: "camp" | "depot" | "sawmill" | "lodge" | "butcher" | "port" | "apiary" | "site" | "well" | "clinic" | "church" | "farm" | "stable" | "pigpen" | "tavern"; id: number }[] {
    const job = this.data.job;
    if (!job) return [];
    if (job.type === "hunt") return [{ kind: "lodge", id: job.lodgeId }];
    if (job.type === "bee") return [{ kind: "apiary", id: job.apiaryId }];
    if (job.type === "gather") return [{ kind: "depot", id: job.depotId }];
    if (job.type === "heal") return [{ kind: "clinic", id: job.clinicId }];
    if (job.type === "bury") return [{ kind: "church", id: job.churchId }];
    if (job.type === "farm") return [{ kind: "farm", id: job.farmId }];
    if (job.type === "tend") return [{ kind: "stable", id: job.stableId }];
    if (job.type === "swine") return [{ kind: "pigpen", id: job.pigpenId }];
    if (job.type === "cook") return [{ kind: "tavern", id: job.tavernId }];
    if (job.type === "water" && job.dine !== undefined) return [{ kind: "tavern", id: job.dine }];
    if (job.type === "build") return [{ kind: "site", id: job.siteId }];
    if (job.type === "water") {
      if (this.waterWell < 0) return [];
      return [{ kind: job.food ? (this.waterKind ?? "butcher") : "well", id: this.waterWell }];
    }
    if (job.type === "haul") {
      const out: { kind: "camp" | "depot" | "sawmill" | "lodge" | "butcher" | "port"; id: number }[] = [];
      if (job.dest === "any") {
        if (this.anyTarget) out.push({ kind: this.anyTarget.dest, id: this.anyTarget.id });
        if (this.pickSrc && (this.state === "toPickup" || this.state === "loading") && this.pickSrc.kind !== "depot") out.push({ kind: this.pickSrc.kind, id: this.pickSrc.id });
      } else out.push({ kind: haulDest(job), id: job.depotId });
      return out;
    }
    return [];
  }

  // Il rentre se reposer : il met son travail de côté (il le reprendra une fois reposé) et rejoint sa maison.
  // Renvoie false s'il n'a pas de maison où se reposer.
  rest(env: WorkerEnv): boolean {
    if (this.data.resting) return true;
    if (!env.homeEntrance(this)) return false;
    const j = this.data.job;
    const before = j && j.type !== "water" ? { role: this.data.role, job: j } : this.data.resume;
    this.releaseTree(env);
    this.data.job = null;
    this.data.role = "none";
    this.data.resume = before;
    this.data.resting = true;
    this.resetWait();
    this.state = "idle";
    this.path = [];
    this.goHome(env);
    env.changed();
    return true;
  }

  // Reposé, il sort de sa maison et reprend ce qu'il faisait.
  private wake(env: WorkerEnv) {
    const back = this.data.resume;
    this.data.resting = false;
    this.leave(env);
    this.data.resume = undefined;
    this.data.job = back?.job ?? null;
    this.data.role = back?.role ?? "none";
    this.finished = false;
    this.ignore.clear();
    this.resetWait();
    env.changed();
  }

  // Il rejoint tout de suite sa maison (un nouvel arrivant, par exemple).
  sendHome(env: WorkerEnv) {
    this.goHome(env);
  }

  private goHome(env: WorkerEnv) {
    const door = env.homeEntrance(this);
    if (!door) return;
    const path = env.findPath(this.cell, door, this);
    if (!path) return;
    this.state = "toHome";
    if (path.length) this.path = path;
    else this.arrive(env);
  }

  private arrive(env: WorkerEnv) {
    switch (this.state) {
      case "toTree":
        this.arriveAtTree(env);
        break;
      case "toCamp":
        this.arriveAtCamp(env);
        break;
      case "toPickup":
        this.state = "loading";
        this.timer = 0;
        break;
      case "toDepot":
        this.state = "unloading";
        this.timer = 0;
        break;
      case "toCraft": {
        const c = this.data.job;
        const info = c?.type === "haul" && c.craft ? env.craftInfo(c.dest as "sawmill" | "butcher", c.depotId) : null;
        if (info) this.facing = Math.atan2(info.center.y - (this.cell.gy + 0.5), info.center.x - (this.cell.gx + 0.5));
        this.state = "crafting";
        this.timer = 0;
        break;
      }
      case "toStall":
        this.state = "stalling";
        this.timer = 0;
        break;
      case "toField":
        this.state = "farming";
        this.timer = 0;
        break;
      case "toBury":
        this.state = "burying";
        this.timer = 0;
        break;
      case "toHeal":
        this.state = "healing";
        this.timer = 0;
        break;
      case "toBerry":
        this.state = "picking";
        this.timer = 0;
        break;
      case "toHive":
        this.state = this.beeTask === "tend" ? "tending" : "harvesting";
        this.timer = 0;
        break;
      case "toPrey":
        this.state = "idle"; // arrivé là où il était : trackPrey a déjà décidé de viser, sinon on cherche à nouveau
        break;
      case "toHome":
        this.state = "idle";
        this.data.inside = true;
        this.releaseTree(env);
        env.changed();
        break;
      case "toWork":
        this.state = "building";
        this.timer = 0;
        break;
    }
  }

  // ---------- bûcheron ----------

  // Prochaine action : vider son sac s'il est plein, sinon couper un arbre.
  private woodStep(env: WorkerEnv) {
    if (this.data.carry >= CARRY_MAX || this.mustDeposit) {
      this.startDeposit(env);
      return;
    }
    this.nextTree(env);
  }

  // Choisit l'arbre le plus proche de la zone qu'il peut atteindre.
  private nextTree(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "wood") return;
    const here = this.cell;
    const trees = env
      .treesIn(job.zone)
      .filter((i) => !env.claimed.has(i) && !this.ignore.has(i))
      .sort((a, b) => Math.hypot(objects[a].x - this.x, objects[a].y - this.y) - Math.hypot(objects[b].x - this.x, objects[b].y - this.y));
    for (const idx of trees.slice(0, 6)) {
      const o = objects[idx];
      const stand = this.standCell(o.x, o.y, env);
      if (!stand) {
        this.ignore.add(idx);
        continue;
      }
      const path = env.findPath(here, stand, this);
      if (!path) {
        this.ignore.add(idx);
        continue;
      }
      this.target = idx;
      env.claimed.add(idx);
      this.waiting = false;
      this.state = "toTree";
      if (path.length) this.path = path;
      else this.arriveAtTree(env);
      return;
    }
    // plus rien à couper : s'il porte du bois, il va le déposer
    if (this.data.carry > 0) {
      this.startDeposit(env);
      return;
    }
    // sinon il garde sa zone, reste là où il est et revérifie de temps en temps (les arbres d'une forêt repoussent)
    this.waiting = true;
    this.waitT = 5;
    this.state = "idle";
    if (!this.finished) {
      this.finished = true;
      env.notify(`${this.name} a fini la zone : ${this.fem ? "elle" : "il"} attend sur place.`);
      env.changed();
    }
  }

  // Va déposer le bois au camp le plus proche qui a de la place ; sinon il attend.
  private startDeposit(env: WorkerEnv) {
    const here = this.cell;
    const camps = env.camps(here).sort((a, b) => Math.hypot(a.gx - here.gx, a.gy - here.gy) - Math.hypot(b.gx - here.gx, b.gy - here.gy));
    for (const camp of camps) {
      const path = env.findPath(here, camp, this);
      if (!path) continue;
      this.needCamp = false;
      this.warned = false;
      this.waiting = false;
      this.state = "toCamp";
      if (path.length) this.path = path;
      else this.arriveAtCamp(env);
      return;
    }
    this.needCamp = true;
    this.campFull = env.hasCamps();
    this.waiting = true;
    this.waitT = 2;
    this.state = "idle";
    if (!this.warned) {
      this.warned = true;
      env.notify(
        this.campFull
          ? `${this.name} ne peut plus déposer : les camps sont pleins. Envoie un porteur chercher leur bois.`
          : `${this.name} ne peut plus rien porter : construis un camp de bûcheron (🔨 Construire).`,
      );
    }
  }

  private arriveAtCamp(env: WorkerEnv) {
    const n = this.data.carry;
    this.state = "idle";
    const taken = n > 0 ? env.deposit(n, this) : 0;
    this.data.carry = n - taken;
    this.mustDeposit = this.data.carry > 0; // le camp s'est rempli : il lui reste du bois, à placer ailleurs ou plus tard
    if (this.mustDeposit) {
      this.waiting = true;
      this.waitT = 2;
    }
    env.changed();
  }

  // Case où se tenir pour couper : celle de l'arbre, ou une voisine libre (un arbre isolé bloque sa case).
  private standCell(ox: number, oy: number, env: WorkerEnv): Cell | null {
    const gx = Math.floor(ox);
    const gy = Math.floor(oy);
    if (env.isWalkable(gx, gy)) return { gx, gy };
    let best: Cell | null = null;
    let bestD = Infinity;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!env.isWalkable(gx + dx, gy + dy)) continue;
        const d = Math.hypot(gx + dx + 0.5 - this.x, gy + dy + 0.5 - this.y);
        if (d < bestD) {
          bestD = d;
          best = { gx: gx + dx, gy: gy + dy };
        }
      }
    }
    return best;
  }

  private arriveAtTree(env: WorkerEnv) {
    const idx = this.target;
    if (idx < 0 || env.isFelled(idx)) {
      this.releaseTree(env);
      this.state = "idle";
      return;
    }
    const o = objects[idx];
    this.facing = Math.atan2(o.y - this.y, o.x - this.x);
    this.state = "chopping";
    this.timer = 0;
  }

  // ---------- porteur ----------

  // Boucle du porteur : livrer ce qu'il porte, sinon aller chercher du bois dans un camp relié à son dépôt.
  // Tout passe par les chemins, d'entrée à entrée : sans route continue, il attend.
  // Où va son chargement : sa destination fixe, ou celle qu'a choisie le porteur universel pour ce voyage.
  private haulTarget(job: { depotId: number; sawmill?: boolean; dest?: HaulDest | "any" }): { id: number; kind: HaulDest } {
    if (job.dest === "any") return this.anyTarget ? { id: this.anyTarget.id, kind: this.anyTarget.dest } : { id: -1, kind: "depot" };
    return { id: job.depotId, kind: haulDest(job) };
  }

  private haulStep(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "haul") return;
    const here = this.cell;
    const wait = (secs: number) => {
      this.waiting = true;
      this.waitT = secs;
      this.state = "idle";
    };
    const block = (why: "noDepot" | "full" | "noCamp" | "noRoad", message: string) => {
      this.needDepot = true;
      this.haulBlock = why;
      wait(2);
      if (!this.warned) {
        this.warned = true;
        env.notify(message);
      }
    };

    // ouvrier (scieur, boucher) : s'il y a de quoi travailler et rien dans les mains, il entre dans son bâtiment ; sinon il va chercher le stock
    if (job.craft && this.data.carry === 0) {
      const k = job.dest as "sawmill" | "butcher";
      const info = env.craftInfo(k, job.depotId);
      if (!info) {
        this.data.job = null; // le bâtiment a disparu
        this.data.role = "none";
        this.state = "idle";
        env.changed();
        return;
      }
      if (env.craftReady(k, job.depotId)) {
        const path = here.gx === info.entrance.gx && here.gy === info.entrance.gy ? [] : env.findPath(here, info.entrance, this);
        if (!path) {
          wait(3);
          return;
        }
        this.waiting = false;
        this.needDepot = false;
        this.haulBlock = null;
        this.state = "toCraft";
        if (path.length) this.path = path;
        else this.arrive(env);
        return;
      }
    }

    // porteur universel : à chaque voyage il choisit lui-même quoi transporter et où (bûches → scierie, viande → boucherie, planches et viande préparée → dépôt)
    if (job.dest === "any") {
      const cur = this.anyTarget ? env.depotInfo(this.anyTarget.id, this.anyTarget.dest) : null;
      if (this.data.carry === 0 || !cur || cur.free <= 0) {
        const t = env.anyHaulTask(here, this.data.carry > 0 ? this.data.cargo : undefined);
        if (!t) {
          this.anyTarget = null;
          this.needDepot = false;
          this.haulBlock = null;
          wait(3); // rien à transporter pour l'instant
          return;
        }
        this.anyTarget = t;
      }
    }
    const target = this.haulTarget(job);
    const depot = env.depotInfo(target.id, target.kind);
    if (!depot) {
      this.data.job = null;
      this.state = "idle";
      env.notify(`${this.name} n'a plus de dépôt à servir.`);
      env.changed();
      return;
    }
    if (depot.free <= 0) {
      block("full", `${this.name} attend : ce dépôt est plein.`);
      return;
    }
    const loaded = this.data.carry > 0;
    const route = env.haulRoute(target.id, !loaded, target.kind);
    if (!route.ok) {
      if (route.reason === "empty") {
        this.needDepot = false;
        this.haulBlock = null;
        wait(3); // les camps reliés n'ont pas de bois : il attend
      } else if (route.reason === "noCamp") block("noCamp", target.kind === "sawmill" ? `${this.name} n'a aucun camp à servir : construis un camp de bûcheron (🔨 Construire).` : target.kind === "butcher" ? `${this.name} n'a aucun camp de chasseur à servir : construis-en un (🔨 Construire).` : `${this.name} n'a ni scierie ni boucherie à servir : construis-en une (🔨 Construire).`);
      else if (route.reason === "noRoad") block("noRoad", `${this.name} ne trouve aucun chemin entre l'entrée du dépôt et celle d'un camp : relie-les (🔨 Construire › Chemin).`);
      else block(route.reason, `${this.name} ne peut pas livrer.`);
      return;
    }
    this.needDepot = false;
    this.haulBlock = null;
    this.warned = false;
    this.waiting = false;
    this.pickSrc = route.src;

    // jusqu'à l'entrée du camp : par les chemins si on est dessus, sinon à travers champs
    const toCamp = env.roadPath(here, route.campAccess, this) ?? env.findPath(here, route.campAccess, this);
    if (!toCamp) {
      wait(3);
      return;
    }
    if (loaded) {
      // il livre : jusqu'à l'entrée du camp si besoin, puis par les chemins jusqu'à l'entrée du dépôt
      this.path = [...toCamp, ...route.route];
      this.state = "toDepot";
      if (!this.path.length) {
        this.state = "unloading";
        this.timer = 0;
      }
      return;
    }
    // sac vide : il va charger au camp
    this.state = "toPickup";
    if (toCamp.length) this.path = toCamp;
    else {
      this.state = "loading";
      this.timer = 0;
    }
  }

  // ---------- apiculteur ----------

  // Boucle de l'apiculteur : porter le miel au dépôt, soigner les ruches quand le soin baisse, récolter quand il y a assez de pots.
  private beeStep(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "bee") return;
    const here = this.cell;
    const wait = (secs: number) => {
      this.waiting = true;
      this.waitT = secs;
      this.state = "idle";
    };
    const ap = env.apiaryInfo(job.apiaryId);
    if (!ap) {
      this.data.job = null; // le rucher a disparu
      this.data.role = "none";
      this.state = "idle";
      env.notify(`${this.name} n'a plus de rucher à soigner.`);
      env.changed();
      return;
    }
    // il porte du miel : il le dépose au dépôt le plus proche qui a de la place
    if (this.data.carry > 0) {
      const depot = env.honeyDepot(here);
      if (!depot) {
        wait(3);
        if (!this.warned) {
          this.warned = true;
          env.notify(`${this.name} ne sait pas où ranger le miel : construis un dépôt qui ait de la place.`);
        }
        return;
      }
      this.warned = false;
      this.beeDepot = depot.id;
      const path = env.findPath(here, depot.entrance, this);
      if (!path) {
        wait(3);
        return;
      }
      this.waiting = false;
      this.state = "toDepot";
      if (path.length) this.path = path;
      else {
        this.state = "unloading";
        this.timer = 0;
      }
      return;
    }
    const task = ap.care < TEND_BELOW ? "tend" : ap.honey >= HARVEST_MIN ? "harvest" : null;
    if (!task) {
      wait(4); // les ruches vont bien et le miel n'est pas prêt : rien à faire pour le moment
      return;
    }
    const path = env.findPath(here, ap.entrance, this);
    if (!path) {
      wait(3);
      return;
    }
    this.waiting = false;
    this.beeTask = task;
    this.state = "toHive";
    if (path.length) this.path = path;
    else {
      this.state = task === "tend" ? "tending" : "harvesting";
      this.timer = 0;
    }
  }

  // ---------- éleveur ----------

  // Boucle de l'éleveur : le jeu choisit l'étape (ranger le lait, traire, remplir l'auge ou l'abreuvoir).
  private tendStep(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "tend") return;
    const here = this.cell;
    const wait = (secs: number) => {
      this.waiting = true;
      this.waitT = secs;
      this.state = "idle";
    };
    if (!env.stableInfo(job.stableId)) {
      this.data.job = null; // l'étable a disparu
      this.data.role = "none";
      this.state = "idle";
      env.notify(`${this.name} n'a plus d'étable.`);
      env.changed();
      return;
    }
    const plan = env.stablePlan(job.stableId, here, this);
    if (!plan) {
      wait(4); // rien à faire pour l'instant
      return;
    }
    const path = here.gx === plan.target.gx && here.gy === plan.target.gy ? [] : env.findPath(here, plan.target, this);
    if (!path) {
      wait(3);
      return;
    }
    this.waiting = false;
    this.stallTask = plan;
    this.state = "toStall";
    if (path.length) this.path = path;
    else {
      this.state = "stalling";
      this.timer = 0;
    }
  }

  // ---------- cuisinier et convives ----------

  // Boucle du cuisinier : le jeu choisit l'étape (rapporter un ingrédient, le ranger, préparer un plat).
  private cookStep(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "cook") return;
    const here = this.cell;
    const wait = (secs: number) => {
      this.waiting = true;
      this.waitT = secs;
      this.state = "idle";
    };
    if (!env.tavernInfo(job.tavernId)) {
      this.data.job = null; // la taverne a disparu
      this.data.role = "none";
      this.state = "idle";
      env.notify(`${this.name} n'a plus de taverne.`);
      env.changed();
      return;
    }
    const plan = env.tavernPlan(job.tavernId, here, this);
    if (!plan) {
      wait(4);
      return;
    }
    const path = here.gx === plan.target.gx && here.gy === plan.target.gy ? [] : env.findPath(here, plan.target, this);
    if (!path) {
      wait(3);
      return;
    }
    this.waiting = false;
    this.stallTask = plan;
    if (plan.type === "cook") this.cookSec = RECIPES.find((r) => r.id === plan.recipe)?.cookSec ?? 5;
    this.state = "toStall";
    if (path.length) this.path = path;
    else {
      this.state = "stalling";
      this.timer = 0;
    }
  }

  // Boucle d'un villageois qui va manger à la taverne.
  private dineStep(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "water" || job.dine === undefined) return;
    const here = this.cell;
    const plan = env.dinePlan(job.dine, here, this);
    if (!plan) {
      this.endErrand(env);
      return;
    }
    const path = here.gx === plan.target.gx && here.gy === plan.target.gy ? [] : env.findPath(here, plan.target, this);
    if (!path) {
      this.endErrand(env);
      return;
    }
    this.waiting = false;
    this.stallTask = plan;
    this.state = "toStall";
    if (path.length) this.path = path;
    else {
      this.state = "stalling";
      this.timer = 0;
    }
  }

  // Fin d'une course : il reprend ce qu'il faisait avant, sinon il redevient simple villageois.
  private endErrand(env: WorkerEnv) {
    const back = this.data.resume;
    this.data.resume = undefined;
    this.data.job = back?.job ?? null;
    this.data.role = back?.role ?? "none";
    this.finished = false;
    this.ignore.clear();
    this.resetWait();
    this.stallTask = null;
    this.state = "idle";
    this.buildBlock = null;
    env.changed();
  }

  // ---------- porcher ----------

  // Boucle du porcher : le jeu choisit l'étape (ranger la viande, abattre, remplir l'auge ou l'abreuvoir).
  private swineStep(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "swine") return;
    const here = this.cell;
    const wait = (secs: number) => {
      this.waiting = true;
      this.waitT = secs;
      this.state = "idle";
    };
    if (!env.pigInfo(job.pigpenId)) {
      this.data.job = null; // la porcherie a disparu
      this.data.role = "none";
      this.state = "idle";
      env.notify(`${this.name} n'a plus de porcherie.`);
      env.changed();
      return;
    }
    const plan = env.pigPlan(job.pigpenId, here, this);
    if (!plan) {
      wait(4);
      return;
    }
    const path = here.gx === plan.target.gx && here.gy === plan.target.gy ? [] : env.findPath(here, plan.target, this);
    if (!path) {
      wait(3);
      return;
    }
    this.waiting = false;
    this.stallTask = plan;
    this.state = "toStall";
    if (path.length) this.path = path;
    else {
      this.state = "stalling";
      this.timer = 0;
    }
  }

  // ---------- fermier ----------

  // Boucle du fermier : le jeu choisit l'étape (récolter une parcelle mûre, ranger la récolte, semer une parcelle vide).
  private farmStep(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "farm") return;
    const here = this.cell;
    const wait = (secs: number) => {
      this.waiting = true;
      this.waitT = secs;
      this.state = "idle";
    };
    if (!env.farmInfo(job.farmId)) {
      this.data.job = null; // la ferme a disparu
      this.data.role = "none";
      this.state = "idle";
      env.notify(`${this.name} n'a plus de ferme.`);
      env.changed();
      return;
    }
    const plan = env.farmPlan(job.farmId, here, this);
    if (!plan) {
      wait(4); // rien à faire : ça pousse, ou plus de dépôt pour ranger la récolte
      return;
    }
    const path = here.gx === plan.target.gx && here.gy === plan.target.gy ? [] : env.findPath(here, plan.target, this);
    if (!path) {
      wait(3);
      return;
    }
    this.waiting = false;
    this.farmTask = plan;
    this.state = "toField";
    if (path.length) this.path = path;
    else {
      this.state = "farming";
      this.timer = 0;
    }
  }

  // ---------- fossoyeur ----------

  // Boucle du fossoyeur : prendre le défunt le plus proche devant sa maison, le porter à l'église, l'enterrer.
  private buryStep(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "bury") return;
    const here = this.cell;
    const wait = (secs: number) => {
      this.waiting = true;
      this.waitT = secs;
      this.state = "idle";
    };
    if (!env.churchInfo(job.churchId)) {
      this.data.job = null; // l'église a disparu
      this.data.role = "none";
      this.state = "idle";
      env.notify(`${this.name} n'a plus d'église où servir.`);
      env.changed();
      return;
    }
    const plan = env.buryPlan(job.churchId, here, this);
    if (!plan) {
      wait(4); // personne à enterrer (ou cimetière plein)
      return;
    }
    const path = here.gx === plan.target.gx && here.gy === plan.target.gy ? [] : env.findPath(here, plan.target, this);
    if (!path) {
      wait(3);
      return;
    }
    this.waiting = false;
    this.buryTask = plan;
    this.state = "toBury";
    if (path.length) this.path = path;
    else {
      this.state = "burying";
      this.timer = 0;
    }
  }

  // ---------- soigneur ----------

  // Boucle du soigneur : l'étape suivante est choisie par le jeu (soigner un malade, préparer un remède, aller chercher des ingrédients…).
  private healStep(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "heal") return;
    const here = this.cell;
    const wait = (secs: number) => {
      this.waiting = true;
      this.waitT = secs;
      this.state = "idle";
    };
    if (!env.clinicInfo(job.clinicId)) {
      this.data.job = null; // la maison du soigneur a disparu
      this.data.role = "none";
      this.state = "idle";
      env.notify(`${this.name} n'a plus de maison du soigneur.`);
      env.changed();
      return;
    }
    const plan = env.healPlan(job.clinicId, here, this);
    if (!plan) {
      wait(4); // personne à soigner, rien à préparer
      return;
    }
    const path = here.gx === plan.target.gx && here.gy === plan.target.gy ? [] : env.findPath(here, plan.target, this);
    if (!path) {
      if (plan.type === "bush") {
        env.claimed.delete(plan.idx);
        this.ignore.add(plan.idx); // arbuste inaccessible : il l'oublie
      }
      wait(3);
      return;
    }
    this.waiting = false;
    this.healTask = plan;
    this.state = "toHeal";
    if (path.length) this.path = path;
    else {
      this.state = "healing";
      this.timer = 0;
    }
  }

  // ---------- cueilleur ----------

  // Boucle du cueilleur : cueillir l'arbuste mûr le plus proche du dépôt, et aller ranger les baies quand le sac est plein (ou qu'il n'y en a plus).
  private gatherStep(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "gather") return;
    const here = this.cell;
    const wait = (secs: number) => {
      this.waiting = true;
      this.waitT = secs;
      this.state = "idle";
    };
    if (!env.depotInfo(job.depotId, "depot")) {
      this.data.job = null; // le dépôt a disparu
      this.data.role = "none";
      this.state = "idle";
      env.notify(`${this.name} n'a plus de dépôt où ranger les baies.`);
      env.changed();
      return;
    }
    const bush = this.data.carry < BERRY_CARRY ? env.berryTarget(job.depotId, here, true, this.ignore) : null;
    if (!bush) {
      if (this.data.carry <= 0) {
        wait(5); // aucun arbuste mûr à portée : il attend qu'ils repoussent
        return;
      }
      const depot = env.honeyDepot(here);
      if (!depot) {
        wait(3);
        if (!this.warned) {
          this.warned = true;
          env.notify(`${this.name} ne sait pas où ranger les baies : construis un dépôt qui ait de la place.`);
        }
        return;
      }
      this.warned = false;
      this.beeDepot = depot.id;
      const path = env.findPath(here, depot.entrance, this);
      if (!path) {
        wait(3);
        return;
      }
      this.waiting = false;
      this.state = "toDepot";
      if (path.length) this.path = path;
      else {
        this.state = "unloading";
        this.timer = 0;
      }
      return;
    }
    const path = env.findPath(here, { gx: Math.floor(bush.x), gy: Math.floor(bush.y) }, this);
    if (!path) {
      env.claimed.delete(bush.idx);
      this.ignore.add(bush.idx); // inaccessible (île, enclos…) : il l'oublie et cherche ailleurs
      wait(1);
      return;
    }
    this.waiting = false;
    this.target = bush.idx;
    this.state = "toBerry";
    if (path.length) this.path = path;
    else {
      this.state = "picking";
      this.timer = 0;
    }
  }

  // ---------- chasseur ----------

  // Boucle du chasseur : traquer le gibier le plus proche du camp, le tirer, et rentrer déposer la viande quand le sac est plein.
  private huntStep(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "hunt") return;
    const here = this.cell;
    const wait = (secs: number) => {
      this.waiting = true;
      this.waitT = secs;
      this.state = "idle";
    };
    const lodge = env.lodgeInfo(job.lodgeId);
    if (!lodge) {
      this.data.job = null; // le camp a disparu
      this.data.role = "none";
      this.state = "idle";
      env.notify(`${this.name} n'a plus de camp de chasseur.`);
      env.changed();
      return;
    }
    if (this.preyId >= 0) this.releaseTree(env); // sa proie précédente (manquée ou déjà atteinte) est libérée
    const deliver = () => {
      if (lodge.free <= 0) {
        wait(3);
        if (!this.warned) {
          this.warned = true;
          env.notify(`${this.name} attend : le camp de chasseur est plein de viande.`);
        }
        return;
      }
      this.warned = false;
      const path = env.findPath(here, lodge.entrance, this);
      if (!path) {
        wait(3);
        return;
      }
      this.waiting = false;
      this.state = "toDepot";
      if (path.length) this.path = path;
      else {
        this.state = "unloading";
        this.timer = 0;
      }
    };
    if (this.data.carry >= HUNT_CARRY) {
      deliver();
      return;
    }
    const prey = env.preyNear(job.lodgeId, here);
    if (!prey) {
      if (this.data.carry > 0) deliver();
      else wait(4); // pas de gibier dans les environs : il attend qu'il en revienne
      return;
    }
    const path = env.findPath(here, { gx: Math.floor(prey.x), gy: Math.floor(prey.y) }, this);
    if (!path) {
      env.releasePrey(prey.id);
      wait(2);
      return;
    }
    this.preyId = prey.id;
    this.waiting = false;
    this.state = "toPrey";
    this.huntT = 0;
    this.path = path;
    if (!path.length) this.state = "aiming", (this.timer = 0);
  }

  // En chemin, il surveille sa proie : elle bouge. À portée de tir, il s'arrête et vise ; si elle s'est trop éloignée, il refait son chemin.
  private trackPrey(dt: number, env: WorkerEnv) {
    this.huntT += dt;
    if (this.huntT < 0.3) return;
    this.huntT = 0;
    const pos = this.preyId >= 0 ? env.preyPos(this.preyId) : null;
    if (!pos) {
      this.releaseTree(env);
      this.path = [];
      this.reserved = null;
      this.state = "idle";
      return;
    }
    if (Math.hypot(pos.x - this.x, pos.y - this.y) <= HUNT_RANGE) {
      this.path = [];
      this.reserved = null;
      this.state = "aiming";
      this.timer = 0;
      return;
    }
    const end = this.path[this.path.length - 1];
    if (!end || Math.hypot(end[0] - pos.x, end[1] - pos.y) > 2.5) {
      const p = env.findPath(this.cell, { gx: Math.floor(pos.x), gy: Math.floor(pos.y) }, this);
      if (p && p.length) this.path = p;
    }
  }

  // ---------- porteur d'eau ----------

  // Corvée d'eau : remplir sa cruche au puits, la vider dans sa maison, et recommencer jusqu'à ce qu'elle soit pleine.
  private waterStep(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "water") return;
    if (job.dine !== undefined) {
      this.dineStep(env);
      return;
    }
    const here = this.cell;
    const wait = (secs: number) => {
      this.waiting = true;
      this.waitT = secs;
      this.state = "idle";
    };
    // fini : on ne rapporte plus d'eau, il reprend sa vie de villageois
    const done = (message: string) => {
      // il reprend ce qu'il faisait avant (bûcheron, porteur, bâtisseur…), sinon il redevient simple villageois
      const back = this.data.resume;
      this.data.resume = undefined;
      this.data.job = back?.job ?? null;
      this.data.role = back?.role ?? "none";
      this.finished = false;
      this.ignore.clear();
      this.resetWait();
      if (this.data.cargo === "water" || job.food) this.data.carry = 0; // le reste de la cruche est versé
      this.state = "idle";
      this.buildBlock = null;
      if (message) env.notify(message);
      env.changed();
    };
    const target = env.waterTarget(job.houseId, this.data.carry === 0, job.food);
    if (!target.ok) {
      if (target.reason === "full" || target.reason === "noHouse") {
        done(target.reason === "full" && job.hauled > 0 ? `${this.name} a rempli sa maison d'eau.` : "");
        return;
      }
      if (this.data.carry > 0 && target.reason === "noWell") {
        // il lui reste de l'eau et le puits est à sec : il la rapporte quand même
        const home = env.waterTarget(job.houseId, false, job.food);
        if (!home.ok) {
          done("");
          return;
        }
      } else {
        this.buildBlock = target.reason === "noRoad" ? "noRoad" : null;
        if (!this.warned) {
          this.warned = true;
          env.notify(
            target.reason === "noRoad"
              ? `${this.name} ne trouve aucun chemin entre sa maison et ${job.food ? "une boucherie" : "un puits"} : relie-les (🔨 Construire › Chemin).`
              : `${this.name} ne trouve ${job.food ? "aucune boucherie qui ait de la viande préparée" : "aucun puits"} : ${job.food ? "construis-en une" : "construis-en un"} (🔨 Construire).`,
          );
        }
        if (target.reason === "noWell" && this.data.carry === 0) wait(3);
        else done("");
        return;
      }
    }
    const route = target.ok ? target : env.waterTarget(job.houseId, false, job.food);
    if (!route.ok) {
      done("");
      return;
    }
    this.buildBlock = null;
    this.warned = false;
    this.waiting = false;
    this.waterWell = route.wellId;
    this.waterKind = route.srcKind;
    if (this.data.carry > 0) {
      // il rentre livrer : jusqu'à la porte de sa maison
      const path = env.roadPath(here, route.houseAccess, this) ?? env.findPath(here, route.houseAccess, this);
      if (!path) {
        wait(3);
        return;
      }
      this.state = "toDepot";
      if (path.length) this.path = path;
      else {
        this.state = "unloading";
        this.timer = 0;
      }
      return;
    }
    // sac vide : il va remplir sa cruche au puits
    const path = env.roadPath(here, route.wellAccess, this) ?? env.findPath(here, route.wellAccess, this);
    if (!path) {
      wait(3);
      return;
    }
    this.state = "toPickup";
    if (path.length) this.path = path;
    else {
      this.state = "loading";
      this.timer = 0;
    }
  }

  // ---------- bâtisseur ----------

  // Boucle du bâtisseur : livrer au chantier le bois qu'il porte, aller en chercher, puis construire quand tout est réuni.
  private buildStep(env: WorkerEnv) {
    const job = this.data.job;
    if (!job || job.type !== "build") return;
    const here = this.cell;
    const wait = (secs: number) => {
      this.waiting = true;
      this.waitT = secs;
      this.state = "idle";
    };
    const site = env.siteInfo(job.siteId);
    if (!site) {
      this.data.job = null; // chantier terminé ou annulé
      this.state = "idle";
      this.buildBlock = null;
      env.changed();
      return;
    }
    // tout est là : il se place au bord du chantier et construit
    if (site.ready) {
      this.buildBlock = null;
      this.waiting = false;
      const spot = env.workCell(job.siteId, here);
      if (!spot) {
        wait(2);
        return;
      }
      const path = spot.gx === here.gx && spot.gy === here.gy ? [] : env.findPath(here, spot, this);
      if (!path) {
        wait(2);
        return;
      }
      this.facing = Math.atan2(site.entrance.gy - spot.gy, site.entrance.gx - spot.gx);
      this.state = "toWork";
      if (path.length) this.path = path;
      else this.arrive(env);
      return;
    }
    const loaded = this.data.carry > 0;
    const route = env.buildRoute(job.siteId, !loaded);
    if (!route.ok) {
      this.buildBlock = route.reason === "noRoad" ? "noRoad" : "noWood";
      if (!this.warned && route.reason === "noRoad") {
        this.warned = true;
        env.notify(`${this.name} ne trouve aucun chemin entre le chantier et une réserve de matériaux (camp, dépôt ou scierie) : relie-les (🔨 Construire › Chemin).`);
      }
      wait(3);
      return;
    }
    this.buildBlock = null;
    this.warned = false;
    this.waiting = false;
    this.pickSrc = route.src;
    const toSrc = env.roadPath(here, route.access, this) ?? env.findPath(here, route.access, this);
    if (!toSrc) {
      wait(3);
      return;
    }
    if (loaded) {
      // il livre : jusqu'à la source si besoin, puis par les chemins jusqu'à l'entrée du chantier
      this.path = [...toSrc, ...route.route];
      this.state = "toDepot";
      if (!this.path.length) {
        this.state = "unloading";
        this.timer = 0;
      }
      return;
    }
    this.state = "toPickup";
    if (toSrc.length) this.path = toSrc;
    else {
      this.state = "loading";
      this.timer = 0;
    }
  }

  private finishLoading(env: WorkerEnv) {
    const job = this.data.job;
    this.state = "idle";
    if (job?.type === "water") {
      const got = env.takeWater(this.waterWell, (job.food ? FOOD_MAX : WATER_MAX) - this.data.carry, job.food, this.waterKind);
      if (got > 0) this.data.cargo = job.food ? "cuts" : "water";
      this.data.carry += got;
      env.changed();
      return;
    }
    if (job?.type === "build") {
      const site = env.siteInfo(job.siteId);
      if (site && this.pickSrc) {
        const got = env.takeFromSource(this.pickSrc, Math.min(HAUL_MAX - this.data.carry, site.missing), site.plank);
        if (got > 0) this.data.cargo = site.plank ? "plank" : "wood";
        this.data.carry += got;
      }
      env.changed();
      return;
    }
    if (!job || job.type !== "haul") return;
    const tgt = this.haulTarget(job);
    if (this.pickSrc) {
      // chargement dans un dépôt (pour le port) : planches ou viande préparée, selon ce que le quota du port laisse encore passer
      const good = tgt.kind === "port" ? env.exportGood(this.pickSrc, tgt.id) : null; // n'importe quelle ressource que le port attend
      const depot = env.depotInfo(tgt.id, tgt.kind, good ?? undefined);
      const room = depot ? depot.free : 0; // on ne charge pas plus que la destination ne peut recevoir
      if (good) {
        const n = env.takeGood(this.pickSrc, good, Math.min(HAUL_MAX - this.data.carry, room));
        if (n > 0) {
          this.data.cargo = good; // les identifiants des ressources exportables sont ceux de ce qu'on porte
          this.data.carry += n;
        }
        env.changed();
        return;
      }
      if (this.pickSrc.kind === "depot" && tgt.kind === "butcher") {
        // le boucher prend la viande brute en réserve dans les dépôts, pas seulement dans les camps de chasseur
        const n = env.takeGood(this.pickSrc, "meat", Math.min(HAUL_MAX - this.data.carry, room));
        if (n > 0) {
          this.data.cargo = "meat";
          this.data.carry += n;
        }
        env.changed();
        return;
      }
      const got = env.takeFromSource(this.pickSrc, Math.min(HAUL_MAX - this.data.carry, room), good === "plank", good === "cuts", good === "honey", good === "berries");
      if (got > 0 && good) this.data.cargo = good === "plank" ? "plank" : good === "honey" ? "honey" : good === "berries" ? "berries" : "cuts";
      else if (got > 0) this.data.cargo = this.pickSrc.kind === "sawmill" ? "plank" : this.pickSrc.kind === "lodge" ? "meat" : this.pickSrc.kind === "butcher" ? "cuts" : "wood";
      this.data.carry += got;
    }
    env.changed();
  }

  private finishUnloading(env: WorkerEnv) {
    const job = this.data.job;
    this.state = "idle";
    if (job?.type === "bee") {
      const n = this.data.carry;
      const taken = n > 0 ? env.depositHoney(this.beeDepot, n, this) : 0;
      this.data.carry = n - taken;
      if (this.data.carry > 0) {
        this.waiting = true; // le dépôt est plein : il garde le reste
        this.waitT = 3;
      }
      env.changed();
      return;
    }
    if (job?.type === "gather") {
      const n = this.data.carry;
      const taken = n > 0 ? env.depositBerries(this.beeDepot, n, this) : 0;
      this.data.carry = n - taken;
      if (this.data.carry > 0) {
        this.waiting = true; // le dépôt est plein : il garde le reste
        this.waitT = 3;
      }
      env.changed();
      return;
    }
    if (job?.type === "hunt") {
      const n = this.data.carry;
      const taken = n > 0 ? env.depositMeat(job.lodgeId, n, this) : 0;
      this.data.carry = n - taken;
      if (this.data.carry > 0) {
        this.waiting = true; // le camp est plein : il garde le reste
        this.waitT = 3;
      }
      env.changed();
      return;
    }
    if (job?.type === "water") {
      const n = this.data.carry;
      const taken = n > 0 ? env.deliverWater(job.houseId, n, this, job.food) : 0;
      this.data.carry = n - taken;
      job.hauled += taken;
      if (this.data.carry > 0) {
        this.waiting = true; // la maison est pleine : il garde le reste pour une autre
        this.waitT = 1;
      }
      env.changed();
      return;
    }
    if (job?.type === "build") {
      const n = this.data.carry;
      const taken = n > 0 ? env.depositSite(job.siteId, n, this) : 0;
      this.data.carry = n - taken;
      job.delivered += taken;
      if (this.data.carry > 0) {
        this.waiting = true; // le chantier n'en veut plus : il garde le reste
        this.waitT = 2;
      }
      env.changed();
      return;
    }
    if (!job || job.type !== "haul") return;
    const n = this.data.carry;
    const tgt = this.haulTarget(job);
    const taken = n > 0 ? env.depositDepot(tgt.id, n, this, tgt.kind, this.data.cargo === "plank", this.data.cargo === "cuts", this.data.cargo === "honey", this.data.cargo === "berries", this.data.cargo && this.data.cargo in FARM_CROPS ? (this.data.cargo as FarmCrop) : undefined) : 0;
    this.data.carry = n - taken;
    job.hauled += taken;
    if (this.data.carry > 0) {
      this.waiting = true; // le dépôt s'est rempli : il garde le reste et réessaie
      this.waitT = 2;
    }
    env.changed();
  }

  // ---------- déplacement ----------

  private walk(dt: number, env: WorkerEnv) {
    const gx = Math.floor(this.data.x);
    const gy = Math.floor(this.data.y);
    this.thirstyNow = env.thirsty(this);
    this.hungryNow = env.hungry(this);
    const slow = ((this.data.age ?? 25) >= 65 ? 0.8 : (this.data.age ?? 25) >= AGE_ELDER - 5 ? 0.9 : 1) * (this.data.illness && this.data.illness.sev >= SICK_SLOW ? 0.7 : 1) * (this.thirstyNow ? 0.7 : 1) * (this.hungryNow ? 0.85 : 1) * (this.energy <= 0 ? 0.6 : this.energy < TIRED ? 0.8 : 1) * (env.onRoad(gx, gy) ? 1.3 : terrainAt(gx, gy) === T.Forest ? 0.7 : 1); // chemin : plus vite ; sous-bois : on ralentit ; soif : on traîne
    const load = this.data.carry >= CARRY_MAX ? 0.85 : 1; // un sac plein ralentit un peu
    let budget = SPEED * slow * load * env.climate().speed * dt; // l'hiver, on avance moins vite
    while (budget > 0 && this.path.length) {
      const [tx, ty] = this.path[0];
      const dx = tx - this.data.x;
      const dy = ty - this.data.y;
      const d = Math.hypot(dx, dy);
      if (d > 1e-4) {
        // le regard tourne doucement vers la direction de marche
        let diff = Math.atan2(dy, dx) - this.facing;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.facing += diff * Math.min(1, dt * 14);
      }
      if (d <= budget) {
        this.data.x = tx;
        this.data.y = ty;
        this.path.shift();
        budget -= d;
        this.phase += d * 5;
      } else {
        this.data.x += (dx / d) * budget;
        this.data.y += (dy / d) * budget;
        this.phase += budget * 5;
        budget = 0;
      }
    }
  }

  // ---------- dessin ----------

  draw(g: CanvasRenderingContext2D, selected: boolean, t: number) {
    const px = this.data.x * C;
    const py = this.data.y * C;
    const r = 0.29 * C;
    const walking = this.moving;
    const chopping = this.state === "chopping";
    const swing = walking ? Math.sin(this.phase) : 0;
    const bob = walking ? Math.abs(Math.cos(this.phase)) * 1.6 : 0;
    const shirt = CREW_COLORS[this.data.color % CREW_COLORS.length];
    const role = this.data.role;
    const lumberjack = role === "wood";
    const hauler = role === "haul";
    const carrier = role === "water";
    const hunter = role === "hunt";
    const keeper = role === "bee";
    const gatherer = role === "gather";
    const healer = role === "heal";
    const sexton = role === "bury";
    const farmer = role === "farm";
    const herder = role === "tend" || role === "swine";
    const builder = role === "build";
    const crafter = role === "craft";
    const hammering = this.state === "building" || this.state === "crafting" || (this.state === "farming" && (this.farmTask?.type === "sow" || this.farmTask?.type === "reap")); // la houe qui frappe la terre

    if (selected) {
      g.strokeStyle = `rgba(255,214,64,${0.75 + 0.25 * Math.sin(t / 200)})`;
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(px, py + 2, r * 1.35, r * 1.1, 0, 0, Math.PI * 2);
      g.stroke();
    }
    // ombre
    g.fillStyle = "rgba(20,40,10,0.3)";
    g.beginPath();
    g.ellipse(px + 3, py + 5, r * 1.05, r * 0.7, 0, 0, Math.PI * 2);
    g.fill();

    g.save();
    g.translate(px, py - bob);
    g.rotate(this.facing); // dans ce repère, +x est la direction du regard

    // pieds, en alternance
    g.fillStyle = "#4a3320";
    for (const side of [-1, 1]) {
      g.beginPath();
      g.ellipse(side * swing * r * 0.7, side * r * 0.42, r * 0.34, r * 0.24, 0, 0, Math.PI * 2);
      g.fill();
    }
    // hache : se balance en avant quand il coupe
    if (lumberjack) {
      const hit = chopping ? Math.max(0, Math.sin(this.timer * 9)) : 0;
      g.save();
      g.translate(r * 0.2, r * 0.95);
      g.rotate(-0.9 + hit * 1.5);
      g.strokeStyle = "#7a4e2a";
      g.lineWidth = 3;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(r * 1.3, 0);
      g.stroke();
      g.fillStyle = "#b9bdc4";
      g.beginPath();
      g.moveTo(r * 1.05, -r * 0.34);
      g.lineTo(r * 1.4, -r * 0.2);
      g.lineTo(r * 1.4, r * 0.2);
      g.lineTo(r * 1.05, r * 0.14);
      g.closePath();
      g.fill();
      g.restore();
    }
    // arc : bandé quand il vise
    if (hunter) {
      const pull = this.state === "aiming" ? Math.min(1, this.timer / AIM_SECONDS) : 0;
      g.save();
      g.translate(r * 0.9, 0);
      g.strokeStyle = "#6b4a28";
      g.lineWidth = 3;
      g.lineCap = "round";
      g.beginPath();
      g.arc(-r * 0.2, 0, r * 1.05, -1.0, 1.0);
      g.stroke();
      g.strokeStyle = "#e8dcc0";
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(-r * 0.2 + Math.cos(-1.0) * r * 1.05, Math.sin(-1.0) * r * 1.05);
      g.lineTo(-r * 0.2 - pull * r * 0.7, 0);
      g.lineTo(-r * 0.2 + Math.cos(1.0) * r * 1.05, Math.sin(1.0) * r * 1.05);
      g.stroke();
      if (pull > 0) {
        g.strokeStyle = "#8a6a3a";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(-r * 0.2 - pull * r * 0.7, 0);
        g.lineTo(r * 1.1, 0);
        g.stroke();
      }
      g.restore();
    }
    // enfumoir de l'apiculteur : il fume les ruches quand il les soigne
    if (keeper) {
      g.save();
      g.translate(r * 0.95, r * 0.85);
      g.fillStyle = "#6f7480";
      g.beginPath();
      g.roundRect(-r * 0.22, -r * 0.2, r * 0.44, r * 0.4, 3);
      g.fill();
      g.fillStyle = "#8a5a2e";
      g.beginPath();
      g.arc(r * 0.28, 0, r * 0.13, 0, Math.PI * 2);
      g.fill();
      if (this.state === "tending") {
        for (let i = 0; i < 4; i++) {
          const p = ((this.timer * 1.2 + i / 4) % 1);
          g.fillStyle = `rgba(225,225,225,${0.7 * (1 - p)})`;
          g.beginPath();
          g.arc(r * 0.45 + p * r * 1.1, Math.sin(p * 6 + i) * r * 0.2, r * (0.12 + 0.16 * p), 0, Math.PI * 2);
          g.fill();
        }
      }
      g.restore();
    }
    // marteau : il frappe en avant quand il construit ou travaille à l'atelier
    if (builder || crafter || farmer) {
      const hit = hammering ? Math.max(0, Math.sin(this.timer * 10)) : 0;
      g.save();
      g.translate(r * 0.2, r * 0.95);
      g.rotate(-0.9 + hit * 1.6);
      g.strokeStyle = "#7a4e2a";
      g.lineWidth = 3;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(r * 1.1, 0);
      g.stroke();
      g.fillStyle = "#6f7480";
      g.fillRect(r * 0.9, -r * 0.3, r * 0.4, r * 0.6);
      g.restore();
    }
    // corps : chemise de la couleur du personnage, flanelle rouge à carreaux (bûcheron) ou chemise claire à bretelles (porteur)
    g.fillStyle = lumberjack ? "#b5372b" : hauler ? "#e8dcc0" : builder ? "#c9772e" : crafter ? "#8a5a3a" : carrier ? "#4a90c8" : hunter ? "#7a5a34" : keeper ? "#efe6c8" : gatherer ? "#7a5aa8" : healer ? "#f1ece0" : sexton ? "#33343c" : farmer ? "#4c7ab8" : herder ? "#7fa6c9" : shirt;
    g.beginPath();
    g.ellipse(0, 0, r * 0.62, r * 0.98, 0, 0, Math.PI * 2);
    g.fill();
    if (lumberjack) {
      g.save();
      g.beginPath();
      g.ellipse(0, 0, r * 0.62, r * 0.98, 0, 0, Math.PI * 2);
      g.clip();
      g.strokeStyle = "rgba(30,15,12,0.5)";
      g.lineWidth = 2.2;
      for (let k = -3; k <= 3; k++) {
        g.beginPath();
        g.moveTo(k * r * 0.34, -r);
        g.lineTo(k * r * 0.34, r);
        g.moveTo(-r, k * r * 0.34);
        g.lineTo(r, k * r * 0.34);
        g.stroke();
      }
      g.restore();
    } else if (herder) {
      // tablier blanc sur une chemise bleue
      g.fillStyle = "#f4f0e4";
      g.fillRect(-r * 0.32, -r * 0.45, r * 0.64, r * 1.1);
      g.strokeStyle = "#8a9bb0";
      g.lineWidth = 2;
      g.strokeRect(-r * 0.32, -r * 0.45, r * 0.64, r * 1.1);
    } else if (farmer) {
      // salopette de toile sur une chemise à carreaux
      g.fillStyle = "#e8d9b4";
      g.fillRect(-r * 0.5, -r * 0.55, r * 1.0, r * 0.3);
      g.strokeStyle = "#35588a";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-r * 0.3, -r * 0.55);
      g.lineTo(-r * 0.3, r * 0.6);
      g.moveTo(r * 0.3, -r * 0.55);
      g.lineTo(r * 0.3, r * 0.6);
      g.stroke();
    } else if (sexton) {
      // grande robe noire avec un col blanc
      g.fillStyle = "#f2efe6";
      g.fillRect(-r * 0.28, -r * 0.55, r * 0.56, r * 0.22);
    } else if (healer) {
      // blouse blanche avec une croix verte
      g.fillStyle = "#3e8257";
      g.fillRect(-r * 0.09, -r * 0.5, r * 0.18, r * 1.0);
      g.fillRect(-r * 0.4, -r * 0.1, r * 0.8, r * 0.2);
    } else if (gatherer) {
      // tablier clair sur une robe violette
      g.fillStyle = "#efe6c8";
      g.fillRect(-r * 0.3, -r * 0.65, r * 0.6, r * 1.3);
      g.strokeStyle = "#5a3f86";
      g.lineWidth = 2;
      g.strokeRect(-r * 0.3, -r * 0.65, r * 0.6, r * 1.3);
    } else if (keeper) {
      // combinaison claire avec une ceinture brune
      g.fillStyle = "#8a5a2e";
      g.fillRect(-r * 0.5, -r * 0.1, r * 1.0, r * 0.2);
      g.strokeStyle = "#cbbf9c";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(-r * 0.5, -r * 0.6);
      g.lineTo(r * 0.5, -r * 0.6);
      g.moveTo(-r * 0.5, r * 0.6);
      g.lineTo(r * 0.5, r * 0.6);
      g.stroke();
    } else if (hunter) {
      // gilet de cuir avec une bandoulière claire
      g.fillStyle = "#5e4426";
      g.fillRect(-r * 0.5, -r * 0.2, r * 1.0, r * 0.4);
      g.strokeStyle = "#d9c394";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(-r * 0.5, -r * 0.8);
      g.lineTo(r * 0.5, r * 0.8);
      g.stroke();
    } else if (carrier) {
      // tablier clair par-dessus la chemise bleue
      g.fillStyle = "#e8f0f8";
      g.fillRect(-r * 0.32, -r * 0.7, r * 0.64, r * 1.4);
    } else if (crafter) {
      // tablier de cuir clair sur la chemise brune
      g.fillStyle = "#d9c394";
      g.fillRect(-r * 0.36, -r * 0.7, r * 0.72, r * 1.4);
      g.strokeStyle = "#6b4a28";
      g.lineWidth = 2;
      g.strokeRect(-r * 0.36, -r * 0.7, r * 0.72, r * 1.4);
    } else if (builder) {
      // gilet de chantier : deux bandes claires
      g.fillStyle = "#f2e6c4";
      g.fillRect(-r * 0.5, -r * 0.5, r * 1.0, r * 0.18);
      g.fillRect(-r * 0.5, r * 0.32, r * 1.0, r * 0.18);
    } else if (hauler) {
      // deux bretelles brunes et une ceinture
      g.fillStyle = "#7a4e2a";
      g.fillRect(-r * 0.5, -r * 0.88, r * 1.0, r * 0.2);
      g.fillRect(-r * 0.5, r * 0.68, r * 1.0, r * 0.2);
      g.fillRect(-r * 0.12, -r * 0.95, r * 0.24, r * 1.9);
    } else {
      g.fillStyle = tint(shirt, 1.25);
      g.beginPath();
      g.ellipse(-r * 0.1, -r * 0.2, r * 0.38, r * 0.52, 0, 0, Math.PI * 2);
      g.fill();
    }
    // charge sur le dos : de 1 à 4 bûches posées en travers, ou une pile de planches, selon la quantité
    if (this.data.carry > 0) {
      const n = Math.min(4, Math.ceil(this.data.carry / 2));
      const plank = this.data.cargo === "plank";
      for (let i = 0; i < n; i++) {
        const ly = (i - (n - 1) / 2) * r * 0.36;
        g.fillStyle = "rgba(30,20,10,0.3)";
        g.fillRect(-r * 1.28, ly - r * 0.12, r * 0.6, r * 0.32);
        if (this.data.cargo === "honey") {
          // pots de miel
          g.fillStyle = "#d9962b";
          g.beginPath();
          g.arc(-r * 1.0, ly, r * 0.2, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#f2c35a";
          g.beginPath();
          g.arc(-r * 1.04, ly - r * 0.05, r * 0.09, 0, Math.PI * 2);
          g.fill();
          continue;
        }
        if (this.data.cargo === "milk") {
          // une bouteille de lait
          g.fillStyle = "#f6f4ee";
          g.beginPath();
          g.roundRect(-r * 1.12, ly - r * 0.2, r * 0.26, r * 0.4, r * 0.06);
          g.fill();
          g.strokeStyle = "#8a97a8";
          g.lineWidth = 1.5;
          g.stroke();
          g.fillStyle = "#5a86c0";
          g.fillRect(-r * 1.12, ly - r * 0.28, r * 0.26, r * 0.1);
          continue;
        }
        if (this.data.cargo && this.data.cargo in FARM_CROPS) {
          // un panier de récolte, de la couleur de la culture
          g.fillStyle = "#8a5a2e";
          g.beginPath();
          g.arc(-r * 1.0, ly, r * 0.22, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = { wheat: "#e8c24e", corn: "#f2d03a", tomato: "#d93b2b", carrot: "#f08a24", grass: "#5fbf4a" }[this.data.cargo as FarmCrop];
          g.beginPath();
          g.arc(-r * 1.0, ly, r * 0.15, 0, Math.PI * 2);
          g.fill();
          continue;
        }
        if (this.data.cargo === "body") {
          // le défunt, enroulé dans son linceul, porté en travers
          g.fillStyle = "#efece4";
          g.beginPath();
          g.roundRect(-r * 1.35, ly - r * 0.12, r * 0.95, r * 0.4, r * 0.18);
          g.fill();
          g.strokeStyle = "#a9a699";
          g.lineWidth = 1.5;
          g.stroke();
          g.fillStyle = "#e9b98c";
          g.beginPath();
          g.arc(-r * 1.38, ly + r * 0.08, r * 0.14, 0, Math.PI * 2);
          g.fill();
          continue;
        }
        if (this.data.cargo === "tisane" || this.data.cargo === "syrup") {
          // un petit pot : vert pour la tisane, rouge pour le sirop
          g.fillStyle = "#e9e2cc";
          g.beginPath();
          g.arc(-r * 1.0, ly, r * 0.2, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = this.data.cargo === "tisane" ? "#5aa860" : "#c0394a";
          g.beginPath();
          g.arc(-r * 1.0, ly, r * 0.12, 0, Math.PI * 2);
          g.fill();
          continue;
        }
        if (this.data.cargo === "berries") {
          // paniers de baies
          g.fillStyle = "#8a5a2e";
          g.beginPath();
          g.arc(-r * 1.0, ly, r * 0.2, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#c0243c";
          g.beginPath();
          g.arc(-r * 1.04, ly - r * 0.04, r * 0.09, 0, Math.PI * 2);
          g.arc(-r * 0.94, ly + r * 0.03, r * 0.08, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#6b4fb0";
          g.beginPath();
          g.arc(-r * 0.98, ly - r * 0.08, r * 0.07, 0, Math.PI * 2);
          g.fill();
          continue;
        }
        if (this.data.cargo === "meat" || this.data.cargo === "cuts") {
          // quartier de viande
          g.fillStyle = "#b5443a";
          g.beginPath();
          g.ellipse(-r * 1.0, ly, r * 0.32, r * 0.2, 0, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#f2ead8";
          g.beginPath();
          g.arc(-r * 0.62, ly, r * 0.08, 0, Math.PI * 2);
          g.fill();
          continue;
        }
        if (this.data.cargo === "meal") {
          // un bol de plat fumant
          g.fillStyle = "#6a4a2a";
          g.beginPath();
          g.arc(-r * 1.0, ly, r * 0.24, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#c9782a";
          g.beginPath();
          g.arc(-r * 1.0, ly, r * 0.16, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "rgba(255,255,255,0.5)";
          g.beginPath();
          g.arc(-r * 1.05, ly - r * 0.06, r * 0.05, 0, Math.PI * 2);
          g.fill();
          continue;
        }
        if (this.data.cargo === "water") {
          // seaux d'eau
          g.fillStyle = "#7a4e2a";
          g.beginPath();
          g.arc(-r * 1.0, ly, r * 0.2, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#5aa9e6";
          g.beginPath();
          g.arc(-r * 1.0, ly, r * 0.13, 0, Math.PI * 2);
          g.fill();
          continue;
        }
        if (plank) {
          g.fillStyle = i % 2 ? "#d2ae72" : "#e0c08a";
          g.beginPath();
          g.roundRect(-r * 1.4, ly - r * 0.17, r * 0.75, r * 0.34, r * 0.05);
          g.fill();
          g.strokeStyle = "#9c7a44";
          g.lineWidth = 1;
          g.stroke();
          continue;
        }
        g.fillStyle = i % 2 ? "#8a5a2e" : "#9a6a3a";
        g.beginPath();
        g.roundRect(-r * 1.32, ly - r * 0.17, r * 0.62, r * 0.34, r * 0.16);
        g.fill();
        g.fillStyle = "#d9b27a";
        g.beginPath();
        g.arc(-r * 0.7, ly, r * 0.16, 0, Math.PI * 2);
        g.fill();
      }
    }
    // bras
    g.fillStyle = "#f0c8a0";
    for (const side of [-1, 1]) {
      const reach = chopping || this.state === "loading" || this.state === "unloading" ? r * 0.55 : 0;
      g.beginPath();
      g.arc(-side * swing * r * 0.5 + reach, side * r * 0.98, r * 0.24, 0, Math.PI * 2);
      g.fill();
    }
    if (lumberjack) {
      // bonnet de laine vert avec revers et pompon
      g.fillStyle = "rgba(20,40,10,0.25)";
      g.beginPath();
      g.arc(r * 0.05, r * 0.07, r * 0.64, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#2f6a3f";
      g.beginPath();
      g.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#245232";
      g.lineWidth = 4;
      g.beginPath();
      g.arc(0, 0, r * 0.48, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = "#5a9a62";
      g.beginPath();
      g.arc(-r * 0.12, -r * 0.12, r * 0.26, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#efe9d8";
      g.beginPath();
      g.arc(-r * 0.02, 0, r * 0.15, 0, Math.PI * 2);
      g.fill();
    } else if (herder) {
      // casquette plate marron
      g.fillStyle = "rgba(40,30,10,0.25)";
      g.beginPath();
      g.arc(r * 0.05, r * 0.08, r * 0.64, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#7a5a3a";
      g.beginPath();
      g.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#5a3f26";
      g.beginPath();
      g.arc(r * 0.22, 0, r * 0.34, 0, Math.PI * 2);
      g.fill();
    } else if (farmer) {
      // grand chapeau de paille à ruban bleu
      g.fillStyle = "rgba(40,30,10,0.25)";
      g.beginPath();
      g.arc(r * 0.05, r * 0.08, r * 0.86, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#ecc96a";
      g.beginPath();
      g.arc(0, 0, r * 0.84, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#b08a3a";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(0, 0, r * 0.84, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = "#d9b150";
      g.beginPath();
      g.arc(0, 0, r * 0.44, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#35588a";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(0, 0, r * 0.46, 0, Math.PI * 2);
      g.stroke();
    } else if (sexton) {
      // chapeau noir à bord plat
      g.fillStyle = "rgba(40,30,10,0.25)";
      g.beginPath();
      g.arc(r * 0.05, r * 0.08, r * 0.75, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#2a2b32";
      g.beginPath();
      g.arc(0, 0, r * 0.72, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#3b3c46";
      g.beginPath();
      g.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      g.fill();
    } else if (healer) {
      // calot blanc à croix verte
      g.fillStyle = "rgba(40,30,10,0.22)";
      g.beginPath();
      g.arc(r * 0.05, r * 0.07, r * 0.62, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#f6f2e6";
      g.beginPath();
      g.arc(0, 0, r * 0.6, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#3e8257";
      g.fillRect(-r * 0.07, -r * 0.3, r * 0.14, r * 0.6);
      g.fillRect(-r * 0.3, -r * 0.07, r * 0.6, r * 0.14);
    } else if (gatherer) {
      // chapeau de paille
      g.fillStyle = "rgba(40,30,10,0.25)";
      g.beginPath();
      g.arc(r * 0.05, r * 0.08, r * 0.8, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#e3c06a";
      g.beginPath();
      g.arc(0, 0, r * 0.78, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#b08a3a";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(0, 0, r * 0.78, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = "#d1a94c";
      g.beginPath();
      g.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#b5373f";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(0, 0, r * 0.42, 0.3, 1.9);
      g.stroke();
    } else if (keeper) {
      // chapeau à large bord avec sa voilette
      g.fillStyle = "rgba(40,30,10,0.25)";
      g.beginPath();
      g.arc(r * 0.05, r * 0.08, r * 0.92, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#f4efe0";
      g.beginPath();
      g.arc(0, 0, r * 0.88, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#8a7a5a";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(0, 0, r * 0.88, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = "#e1d5b3";
      g.beginPath();
      g.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "rgba(60,60,60,0.35)";
      g.lineWidth = 1;
      for (let k = -2; k <= 2; k++) {
        g.beginPath();
        g.moveTo(r * 0.55, k * r * 0.2);
        g.lineTo(r * 0.85, k * r * 0.26);
        g.stroke();
      }
    } else if (hunter) {
      // capuche verte avec une plume rouge
      g.fillStyle = "rgba(10,30,10,0.25)";
      g.beginPath();
      g.arc(r * 0.05, r * 0.07, r * 0.64, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#4f7a3a";
      g.beginPath();
      g.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#6a9a50";
      g.beginPath();
      g.arc(-r * 0.12, -r * 0.1, r * 0.34, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#c4402e";
      g.beginPath();
      g.ellipse(-r * 0.3, r * 0.3, r * 0.4, r * 0.1, -0.6, 0, Math.PI * 2);
      g.fill();
    } else if (carrier) {
      // bandana bleu noué
      g.fillStyle = "rgba(10,30,60,0.25)";
      g.beginPath();
      g.arc(r * 0.05, r * 0.07, r * 0.64, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#2f6fb0";
      g.beginPath();
      g.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#e8f0f8";
      for (const [dx, dy] of [[-0.25, -0.2], [0.15, -0.3], [-0.1, 0.25], [0.3, 0.15]]) {
        g.beginPath();
        g.arc(r * dx, r * dy, r * 0.07, 0, Math.PI * 2);
        g.fill();
      }
    } else if (crafter) {
      // calot de laine brun
      g.fillStyle = "rgba(40,25,10,0.25)";
      g.beginPath();
      g.arc(r * 0.05, r * 0.07, r * 0.62, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#7a5a3a";
      g.beginPath();
      g.arc(0, 0, r * 0.6, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#5a3f26";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(0, 0, r * 0.44, 0, Math.PI * 2);
      g.stroke();
    } else if (builder) {
      // casque de chantier jaune avec une arête
      g.fillStyle = "rgba(40,30,0,0.25)";
      g.beginPath();
      g.arc(r * 0.05, r * 0.07, r * 0.64, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#f2c230";
      g.beginPath();
      g.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#ffe07a";
      g.beginPath();
      g.arc(-r * 0.12, -r * 0.1, r * 0.34, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#c99a1e";
      g.fillRect(-r * 0.62, -r * 0.1, r * 1.24, r * 0.2);
    } else if (hauler) {
      // casquette plate grise avec une visière devant
      g.fillStyle = "rgba(20,20,30,0.25)";
      g.beginPath();
      g.arc(r * 0.05, r * 0.07, r * 0.62, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#6f7480";
      g.beginPath();
      g.arc(0, 0, r * 0.6, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#8b909c";
      g.beginPath();
      g.arc(-r * 0.1, -r * 0.08, r * 0.38, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#4e525c";
      g.beginPath();
      g.ellipse(r * 0.55, 0, r * 0.3, r * 0.42, 0, 0, Math.PI * 2);
      g.fill();
    } else {
      // chapeau de paille
      g.fillStyle = "rgba(60,40,10,0.25)";
      g.beginPath();
      g.arc(r * 0.05, r * 0.07, r * 0.72, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#e6c264";
      g.beginPath();
      g.arc(0, 0, r * 0.7, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#c9a14a";
      g.lineWidth = 1.2;
      g.beginPath();
      g.arc(0, 0, r * 0.6, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = "#d8ac45";
      g.beginPath();
      g.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#a8452e"; // ruban
      g.lineWidth = 2.2;
      g.beginPath();
      g.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      g.stroke();
    }
    // réalisme : le tissu du vêtement (trame, lumière, ombre) et le feutre ou les cheveux de la tête
    if (isViking()) {
      furShade(g, 0, 0, r * 0.62, r * 0.98, this.data.id * 31 + 1, false, 0.9);
      furShade(g, 0, 0, r * 0.6, r * 0.6, this.data.id * 31 + 2, true, 0.8);
    }
    // thème viking : un bouclier rond dans le dos, et une barbe pour les hommes
    if (isViking()) {
      g.fillStyle = "#a8322d";
      g.beginPath();
      g.arc(-r * 0.78, 0, r * 0.46, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#2a1a10";
      g.lineWidth = 2;
      g.stroke();
      g.fillStyle = "#c9a23c";
      g.beginPath();
      g.arc(-r * 0.78, 0, r * 0.17, 0, Math.PI * 2);
      g.fill();
      if (!this.fem) {
        g.fillStyle = "#c28a42";
        g.beginPath();
        g.ellipse(r * 0.66, 0, r * 0.2, r * 0.3, 0, 0, Math.PI * 2);
        g.fill();
      } else {
        g.strokeStyle = "#d8a84a"; // une longue tresse dans le dos
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(-r * 0.3, 0);
        g.quadraticCurveTo(-r * 1.1, r * 0.35, -r * 1.35, r * 0.1);
        g.stroke();
      }
    }
    // un petit nez dépasse du chapeau pour montrer où il regarde
    g.fillStyle = "#e9b98c";
    g.beginPath();
    g.arc(r * 0.76, 0, r * 0.13, 0, Math.PI * 2);
    g.fill();
    g.restore();

    // malade : une bulle avec sa maladie au-dessus de la tête (plus grosse et plus verte quand c'est grave)
    const il = this.data.illness;
    if (il) {
      const pulse = 1 + 0.08 * Math.sin(t / 220);
      g.font = `${Math.round((il.sev >= SICK_BED ? 28 : 22) * pulse)}px sans-serif`;
      g.textAlign = "center";
      g.fillText(ILLNESSES[il.kind].emoji, px - r * 1.1, py - r * 1.9);
    }
    // il menace de partir : une bulle de colère qui bat au-dessus de sa tête
    if (this.data.threat !== undefined) {
      const beat = 1 + 0.12 * Math.sin(t / 120);
      g.font = `${Math.round(26 * beat)}px sans-serif`;
      g.textAlign = "center";
      g.fillText("💢", px + r * 1.1, py - r * 1.9);
    }
    // métier au-dessus de la tête et nom du personnage sélectionné
    if (role !== "none") {
      g.font = "20px sans-serif";
      g.textAlign = "center";
      g.fillText(lumberjack ? "🪓" : builder ? "🔨" : crafter ? "🛠️" : carrier ? "💧" : hunter ? "🏹" : keeper ? "🐝" : gatherer ? "🫐" : healer ? "🩺" : sexton ? "⚰️" : farmer ? "🌾" : herder ? "🥛" : "📦", px, py - r * 1.5);
    }
    if (selected) {
      g.font = "bold 15px 'Trebuchet MS', sans-serif";
      g.textAlign = "center";
      g.lineWidth = 4;
      g.strokeStyle = "#4a3b2a";
      g.fillStyle = "#fff6e0";
      const ty = py - r * (role !== "none" ? 2.3 : 1.6);
      g.strokeText(this.name, px, ty);
      g.fillText(this.name, px, ty);
    }
  }
}
