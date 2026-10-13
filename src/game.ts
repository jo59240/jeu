import { Animal, POPULATION, Species } from "./animals";
import { RECIPES, DISH_CAP, PANTRY_CAP, COOK_CARRY, DINE_HUNGER, DINE_ENERGY, DINE_COOLDOWN, SHIPYARD_SIZE, DRAKKAR_STAGES, COLONY_GOAL, MARKET_STAY_SEC, PIGPEN_SIZE, PIGS_MAX, PIG_PRICE, PIG_SELL, PIG_FEED_CAP, PIG_WATER_CAP, PIG_MEAT, PIG_KEEP, SWINE_CARRY, STABLE_SIZE, STABLE_COWS_MAX, STABLE_FEED_CAP, STABLE_WATER_CAP, STABLE_MILK_CAP, COW_PRICE, COW_SELL, HERDER_CARRY, EXPORT_GOODS, ExportGood, FARM_CARRY, FARM_CROPS, FARM_PLOTS, FARM_SIZE, FARM_FETCH, FARM_TANK_CAP, FarmCrop } from "./balance";
import { HELP_TOPICS } from "./help";
import { ROAD_STYLES, cycleRoadStyle, getRoadStyle, THEME, ThemeId, isViking, saveTheme, themeContext, tl, vn } from "./theme";
import { drawVikingDeco } from "./viking";
import { play, Cue, getVolume, isSoundOff, setSoundOff, setVolume } from "./sound";
import { CHURCH_GRAVES, AGE_ELDER, HEAL_LEVELS, PREVENT_RESERVE, XP_BREW, XP_CURE, XP_PREVENT, XP_TREAT, CLINIC_BERRY_CAP, CLINIC_HONEY_CAP, CLINIC_REMEDY_CAP, ILLNESSES, REMEDIES, RemedyKind, SICK_BED, DEPOT_LEVELS, JOBS, LUMBER_RADIUS, NEED_BAD, WorkplaceKind } from "./balance";
import { DAY_SEC, DEPARTURE_RETURN_SEC, HOME_OK_NUISANCE, HOME_RETURN_OK, LEAVE_AFTER_SEC, MOOD, REPOP_SEC, SEASON_DAYS, TEND_BELOW } from "./balance";
import { DEMO, FISH_COOLDOWN_MS, GRID, SAVE_KEY } from "./config";
import { CROPS, CROP_BY_ID } from "./crops";
import { C, drawCamp, drawDepot, drawSawmill, drawWell, drawLodge, drawButcher, drawPort, drawShip, drawApiary, drawClinic, drawChurch, drawFarm, drawStable, drawPigpen, drawMarket, drawCaravan, drawShipyard, drawTavern, drawCorpse, drawEntrance, drawHouse, drawRoadCell, drawRoads, drawSite, drawTile, drawStructureThumb } from "./draw";
import { GOOD_EMOJIS } from "./goods";
import { TerrainRenderer } from "./mapdraw";
import { findPath, roadRoute } from "./path";
import { STRUCTURES } from "./structures";
import { TERRAIN_LABELS, isWater, objects, terrainAt } from "./world";
import { BuildRoute, HaulRoute, HealPlan, BuryPlan, FarmPlan, StablePlan, SwinePlan, CookPlan, DinePlan, WaterRoute, Worker, WorkerEnv } from "./worker";
import { Zone, zoneBounds } from "./zone";
import {
  Action, BuildResult, CAMP_CAPACITY, Camp, CREW_COLORS, FEMALE_NAMES, DEPOT_CAPACITY, Depot, MAX_CREW, ARRIVAL_SEC, addVillager, Pos, Save, addToDepot, campAt, campEntrance, depotEntrance, depotFree, depotCapacity, depotLevel, upgradeDepot, woodStock,
  clockHour, clockDay, darkness, seasonAt, tickDiscontent, DiscontentEvent, nuisanceLevel, houseMood, moodAt, nuisancePen, nuisanceSources, housesNear, NuisanceKey,
  consolidateFood, placePantry, Tavern, tavernAt, tavernEntrance, placeTavern, removeTavern, canPlaceTavern, dishCount,
  Shipyard, shipyardAt, shipyardEntrance, shipyardRot, shipyardSpot, placeShipyard, removeShipyard, canPlaceShipyard, shipyardNeeds, deliverToShipyard, shipyardDone, sail, goals,
  Market, marketAt, marketEntrance, placeMarket, removeMarket, canPlaceMarket, tickMarkets, arriveCaravan, buyFromCaravan, sellToCaravan, depotGoodTotal, marketBuyPrice, marketSellPrice,
  Pigpen, pigpenAt, pigpenEntrance, placePigpen, removePigpen, canPlacePigpen, buyPig, slaughterPig, tickPigpens, pigpenSlaughterCell, pigpenTroughCell, pigAdult, pigFed, pigWatered, adultsOf,
  Stable, stableAt, stableEntrance, placeStable, removeStable, canPlaceStable, buyCow, sellCow, tickStables, stableMilkCell, stableTroughCell, cowFed, cowWatered,
  Farm, farmAt, farmEntrance, placeFarm, removeFarm, canPlaceFarm, farmCounts, farmPlotCell, farmTankCell, walkableByPeople, waterPlot, plotDry, tickFarms, cropStock, addCropToDepot, takeCropFromDepot, cropTotal, cropSeasonFactor,
  Church, churchAt, churchEntrance, placeChurch, removeChurch, canPlaceChurch, gravesFree, tickCorpses, spawnCorpse,
  Clinic, clinicAt, clinicEntrance, placeClinic, removeClinic, canPlaceClinic, addClinicStock, brewable, brew, bestRemedy, applyRemedy, infect, tickHealth, HealthEvent, healSkill, protectVillager, clearBerries, isBerryGone, tickAging, AgeEvent, WorkerSave,
  houseHungry, tickHunger, takeCuts, addFood, HOUSE_FOOD_CAP, isPicked, pickBush, addBerriesToDepot, berryStock,
  Apiary, apiaryAt, apiaryEntrance, placeApiary, removeApiary, canPlaceApiary, tickApiaries, tendApiary, harvestApiary, addHoneyToDepot, honeyStock, apiaryBusy, HONEY_CAP, PRICE_HONEY, PRICE_BERRIES,
  Port, portAt, portEntrance, portRot, placePort, removePort, canPlacePort, addToPort, portFree, portSpace, portAccepts, tickPorts, goodsOf, takeGood, exportableOf, exportableTotal, portReserve, exportable, villageStock, portStock, portQuota, EXPORT_LIST, PORT_CAP, PORT_QUOTA_DEFAULT, PRICE_PLANK, PRICE_CUTS, SHIP_CYCLE, SHIP_ARRIVE, SHIP_DOCKED, SHIP_DEPART,
  Butcher, butcherAt, butcherEntrance, placeButcher, removeButcher, canPlaceButcher, addRawMeat, takeMeat, butcherWorking, tickButchers, cutsStock, HaulDest, haulDest,
  BUTCHER_MEAT_CAP, BUTCHER_CUTS_CAP, CUT_SEC,
  Lodge, lodgeAt, lodgeEntrance, placeLodge, removeLodge, canPlaceLodge, addMeat, lodgeFree, meatStock, HUNT_RADIUS, LODGE_CAP,
  WELL_CAP, Well, wellAt, wellEntrance, placeWell, removeWell, canPlaceWell, tickWells, tickThirst, takeWater, addWater, houseThirsty, HOUSE_WATER_CAP,
  Sawmill, sawmillAt, sawmillEntrance, placeSawmill, removeSawmill, canPlaceSawmill, addLogs, takePlanks, sawmillWorking, tickSawmills, planksStock,
  SAWMILL_LOGS_CAP, SAWMILL_PLANKS_CAP, LOGS_PER_PLANK, PLANK_SEC, siteRefund, refundPlanks,
  rotateBuilding, dismantleGain, startDismantle, tickDismantle, CAMP_COST, DEPOT_WOOD, HOUSE_COST, HOUSE_WOOD,
  House, HOUSE_CAPACITY, houseAt, houseEntrance, placeHouse, removeHouse, canPlaceHouse,
  Site, addToSite, removeSite, siteAt, siteEntrance, siteMissing, siteReady, siteSize, workCell, workOnSite,
  canBuild, canPlaceCamp, canPlaceDepot, canPlaceRoad, catchFish, chopTree, depositAtCamp, depotAt, felTree, growth, interact,
  isEntrance, isFelled, load, newSave, persist, placeCamp, placeDepot, placeRoad, recruit, recruitCost, removeCamp, removeDepot, removeRoad,
  roadAt, storageCapacity, storageFree, addPlanksToDepot, addCutsToDepot, walkable,
} from "./state";
import { BuildUI, BuildView, ERASE, toast } from "./ui";

const BUILD_MESSAGES: Record<Exclude<BuildResult, "ok">, string> = {
  poor: "Pas assez de pièces",
  blocked: "Emplacement occupé (culture, structure ou chemin)",
  terrain: "Terrain impropre : eau, forêt, rocher ou sable",
};

const ACTION_MESSAGES: Record<Action, string> = {
  plow: "Labouré !",
  plant: "Semé !",
  harvest: "Récolté !",
  growing: "Ça pousse…",
  poor: "Pas assez de pièces",
  blocked: "Terrain impropre : eau, forêt, rocher, structure ou chemin",
};

const WOOD_RADIUS = 5; // rayon des zones rondes des paramètres de test (?assign, ?wood)
const MINI = 180; // côté de la minicarte, en pixels
const notNull = <T,>(v: T | null): v is T => v !== null;
const sameCell = (a: Pos, b: Pos) => a.gx === b.gx && a.gy === b.gy;

interface Press {
  sx: number;
  sy: number;
  camX: number;
  camY: number;
  moved: boolean;
  button: number;
}

// Cases traversées par le segment a → b (a exclue, b incluse) : on trace un chemin au glisser sans trou.
function cellsBetween(a: Pos, b: Pos): Pos[] {
  const out: Pos[] = [];
  let x = a.gx;
  let y = a.gy;
  const dx = Math.abs(b.gx - a.gx);
  const dy = Math.abs(b.gy - a.gy);
  const sx = a.gx < b.gx ? 1 : -1;
  const sy = a.gy < b.gy ? 1 : -1;
  let err = dx - dy;
  while (x !== b.gx || y !== b.gy) {
    const e2 = 2 * err;
    // on avance d'un seul axe à la fois : le chemin reste « en escalier », sans coupe en diagonale
    if (e2 > -dy && (e2 < dx || dx >= dy)) {
      err -= dy;
      x += sx;
    } else {
      err += dx;
      y += sy;
    }
    out.push({ gx: x, gy: y });
  }
  return out;
}

export class Game {
  private g: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 1;
  private h = 1;
  private cam = { x: (GRID * C) / 2, y: (GRID * C) / 2, zoom: 1 };
  private terrain!: TerrainRenderer;
  private mini!: HTMLCanvasElement;
  private splashes: { x: number; y: number; t0: number }[] = []; // éclaboussures de pêche
  private lastFish = 0;

  private save!: Save;
  private workers: Worker[] = [];
  private animals: Animal[] = []; // animaux sauvages qui se promènent (pas sauvegardés)
  private selected: Worker | null = null;
  private berryList: number[] | null = null; // indices des arbustes à baies (tous, pour la cueillette)
  private autoPort: { x: number; y: number } | null = null; // essai : où ?autoport a posé le port
  private claimed = new Set<number>(); // arbres déjà visés par un bûcheron
  private env!: WorkerEnv;
  private campSel: Camp | null = null; // camp sélectionné : son menu est ouvert
  private depotSel: Depot | null = null; // dépôt sélectionné : son menu est ouvert
  private recruitOpen = false; // menu d'un bâtiment : la liste des villageois sans emploi est dépliée
  private jobMenuOpen = false; // menu du villageois : la liste des travaux possibles est dépliée
  private farmPick: number | null = null; // parcelle dont on est en train de choisir la culture (menu de la ferme)
  private tavernSel: Tavern | null = null; // taverne sélectionnée : son menu est ouvert
  private dineCool = new Map<number, number>(); // villageois → heure de jeu avant laquelle il ne retourne pas manger
  private shipSel: Shipyard | null = null; // chantier naval sélectionné : son menu est ouvert
  private goalT = 0;
  private pantryT = 0;
  private marketSel: Market | null = null; // marché sélectionné : son menu est ouvert
  private pigpenSel: Pigpen | null = null; // porcherie sélectionnée : son menu est ouvert
  private stableSel: Stable | null = null; // étable sélectionnée : son menu est ouvert
  private farmSel: Farm | null = null; // ferme sélectionnée : son menu est ouvert
  private churchSel: Church | null = null; // église sélectionnée : son menu est ouvert
  private buryClaims = new Map<number, number>(); // fossoyeur → défunt qu'il va chercher
  private clinicSel: Clinic | null = null; // maison du soigneur sélectionnée : son menu est ouvert
  private healClaims = new Map<number, number>(); // soigneur → malade dont il s'occupe
  private apiarySel: Apiary | null = null; // rucher sélectionné : son menu est ouvert
  private portOpen: Port | null = null; // le port dont la fenêtre est ouverte
  private portRefresh = 0;
  private portSel: Port | null = null; // port sélectionné : son menu est ouvert
  private butcherSel: Butcher | null = null; // boucherie sélectionnée : son menu est ouvert
  private lodgeSel: Lodge | null = null; // camp de chasseur sélectionné : son menu est ouvert
  private animalK = 1; // multiplicateur de faune (?animals=)
  private popT = REPOP_SEC; // prochain renouvellement de la faune
  private preyClaimed = new Set<number>(); // gibier déjà visé par un chasseur
  private wellSel: Well | null = null; // puits sélectionné : son menu est ouvert
  private sawmillSel: Sawmill | null = null; // scierie sélectionnée : son menu est ouvert
  private houseSel: House | null = null; // maison sélectionnée : son menu est ouvert
  private buildRot = 0; // orientation de la structure qu'on s'apprête à poser (quarts de tour)
  private errandT = 0; // prochain coup d'œil aux réserves des maisons
  private leavers: { w: Worker; t: number }[] = []; // villageois qui quittent le village : ils s'éloignent puis s'effacent
  private arrivalT = 0; // temps écoulé avec une place libre en maison
  private arrivalSec = ARRIVAL_SEC;
  private homeT = 0; // prochaine répartition des logements
  private siteSel: Site | null = null; // chantier sélectionné : son menu est ouvert
  private menuSig = "";
  private crewSig = "";
  private goodsSig = "";
  private seasonSeen = -1; // dernière saison annoncée (message à chaque changement)
  private clockStep = -1; // dernier palier de 5 s de l'horloge sauvegardé
  private goodsPrev: string[] = []; // pastilles de l'en-tête au dernier affichage : celles qui changent rebondissent
  private menuKey = ""; // quel menu est affiché : un autre bâtiment rejoue l'animation d'entrée
  private menuHideT = 0;
  private menuInT = 0;
  private dirtyAt = 0; // l'équipe a changé : sauvegarde différée

  private tool = "walk"; // outil actif : "walk" (sélection et déplacements) ou une graine à semer
  private crop = "carrot";
  private build: BuildView = { open: false, selected: null };
  private ui!: BuildUI;
  private roadPaint: { mode: "road" | "erase"; last: Pos } | null = null; // chemin en cours de tracé au glisser
  private zoneDrag: { x0: number; y0: number; x1: number; y1: number; sx: number; sy: number } | null = null; // zone tracée au clic droit maintenu
  private follow = false; // la caméra suit le personnage pendant qu'il marche
  private lastT = 0;
  private update: UpdateInfo | null = null; // application de bureau : état de la mise à jour
  private lastLoss = ""; // pourquoi le dernier villageois a disparu (pour l'écran de défaite)
  private helpTopic = "start"; // la fiche ouverte dans le guide
  private paused = false; // le tableau des villageois est ouvert : le temps s'arrête
  private folkSort: { key: string; dir: 1 | -1 } = { key: "name", dir: 1 };
  private timeScale = 1; // essais : ?speed=n fait tourner la simulation n fois plus vite
  private userCam = false; // caméra imposée par l'adresse (tests) : on ne la recadre pas

  private press: Press | null = null;
  private mouse: { x: number; y: number; inside: boolean } = { x: 0, y: 0, inside: false };

  constructor(private canvas: HTMLCanvasElement) {
    this.g = canvas.getContext("2d")!;
    themeContext(this.g); // thème viking : la palette nordique s'applique à tout ce qu'on dessine
  }

  start() {
    this.save = load();
    const q = new URLSearchParams(location.search);
    // Test : ?demo=crops sème les 4 cultures à 3 stades de croissance.
    if (DEMO === "crops") {
      const now = Date.now();
      CROPS.forEach((c, r) =>
        [0.1, 0.6, 1].forEach((p, k) => {
          this.save.cells[(GRID / 2 + 4 + r * 2) * GRID + (GRID / 2 + 4 + k * 2)] = { kind: "crop", crop: c.id, plantedAt: now - p * c.growMs, readyAt: now + (1 - p) * c.growMs };
        }),
      );
    }

    this.workers = this.save.workers.map((d) => new Worker(d));
    this.migrateEmployment();
    this.spawnAnimals(q);
    // Au départ rien n'est sélectionné. Les paramètres de test (?goto, ?role, ?wood, ?assign, ?sel, ?haul) sélectionnent le premier personnage.
    const testKeys = ["goto", "role", "wood", "assign", "sel", "haul", "haulsaw", "waterjob", "hunt", "haulbutcher", "haulany", "lumber", "bee", "foodjob", "builder", "gather", "heal", "bury", "farmer", "herder", "swineherd", "cook"];
    this.selected = testKeys.some((k) => q.has(k)) ? this.workers[0] : null;
    this.env = this.makeEnv();
    this.cam.x = (this.workers[0]?.x ?? GRID / 2) * C;
    this.cam.y = (this.workers[0]?.y ?? GRID / 2) * C;
    this.terrain = new TerrainRenderer();
    this.mini = this.terrain.minimap(MINI);
    this.bindMinimap();
    this.ui = new BuildUI(
      {
        onToggle: (open) => {
          this.build.open = open;
          if (!open) this.build.selected = null;
        },
        onSelect: (id) => {
          this.build.selected = id;
        },
      },
      () => this.build,
    );
    this.bindInput();
    window.addEventListener("resize", () => this.resize(true));
    this.resize(true);
    this.applyTestParams(q);
    document.getElementById("loading")?.remove();
    if (this.save.lost) setTimeout(() => this.showLost(), 300);
    else if (this.save.arrival) setTimeout(() => this.showArrival(), 600);
    document.getElementById("lostBanner")?.addEventListener("click", () => this.showLost());
    if (q.get("lose")) setTimeout(() => this.killAll(), 500); // essai : ?lose=1 fait mourir tous les villageois
    requestAnimationFrame((t) => this.frame(t));
  }

  // La faune du départ : lapins dans les prés, cerfs à la lisière, sangliers en forêt. ?animals=0 les retire, ?animals=2 les double ;
  // ?zoo=x,y en pose un de chaque près de cette case.
  private spawnAnimals(q: URLSearchParams) {
    const k = Number(q.get("animals") ?? (GRID / 128) ** 2); // la faune grandit avec la carte (192 × 192 : 2,25 fois plus d'animaux)
    this.animalK = k;
    for (const kind of Object.keys(POPULATION) as Species[]) {
      for (let i = 0; i < Math.round(POPULATION[kind] * k); i++) {
        const a = Animal.spawn(this.save, kind);
        if (a) this.animals.push(a);
      }
    }
    const zoo = q.get("zoo")?.split(",").map(Number);

    if (zoo?.length === 2) {
      for (const kind of Object.keys(POPULATION) as Species[]) {
        const a = Animal.spawn(this.save, kind, { x: zoo[0], y: zoo[1], r: 2.5 });
        if (a) this.animals.push(a);
      }
    }
  }

  // La faune se renouvelle : toutes les 12 s, une espèce qui manque d'individus en gagne un, loin des villageois.
  private repopulate() {
    for (const kind of Object.keys(POPULATION) as Species[]) {
      if (this.animals.filter((a) => a.kind === kind).length >= Math.round(POPULATION[kind] * this.animalK)) continue;
      for (let t = 0; t < 12; t++) {
        const a = Animal.spawn(this.save, kind);
        if (!a) continue;
        if (this.workers.some((w) => !w.inside && Math.hypot(w.x - a.x, w.y - a.y) < 12)) continue;
        this.animals.push(a);
        break;
      }
    }
  }

  // Paramètres d'adresse pour les essais : on y pose des structures, on place la caméra, etc.
  private applyTestParams(q: URLSearchParams) {
    const nums = (k: string) => q.get(k)?.split(",").map(Number);
    this.timeScale = Math.max(1, Number(q.get("speed") ?? 1));
    this.arrivalSec = Number(q.get("arrival") ?? ARRIVAL_SEC); // essais : ?arrival=5
    if (q.get("season")) this.save.clock = ((Number(q.get("season")) * SEASON_DAYS + 0.4) * 24 - 6) / 24 * DAY_SEC; // essais : ?season=0 printemps, 1 été, 2 automne, 3 hiver
    if (q.get("time")) {
      // essais : ?time=22 pour 22 h, dans le jour (et la saison) en cours
      const days = Math.floor((this.save.clock / DAY_SEC * 24 + 6) / 24);
      this.save.clock = ((days * 24 + ((Number(q.get("time")) - 6 + 24) % 24)) / 24) * DAY_SEC;
    }
    this.recruitOpen = !!q.get("recruitmenu"); // essais : ?recruitmenu=1 déplie la liste de recrutement
    if (q.get("energy")) for (const w of this.workers) w.data.energy = Number(q.get("energy")); // essais : ?energy=10
    if (q.get("discontent")) for (const w of this.workers) w.data.discontent = Number(q.get("discontent")); // essais : ?discontent=99
    this.jobMenuOpen = !!q.get("jobmenu"); // essais : ?jobmenu=1 déplie la liste des travaux
    const cam = nums("cam");
    if (cam && cam.length === 3) {
      this.cam = { x: cam[0] * C, y: cam[1] * C, zoom: Math.max(this.minZoom(), cam[2]) };
      this.userCam = true;
    }
    for (let i = this.workers.length; i < Number(q.get("crew") ?? 0); i++) {
      const d = recruit(this.save);
      if (d) this.workers.push(new Worker(d));
    }
    this.save.coins = ["camp", "depot", "road", "sitecamp", "sitedepot", "house", "sitehouse", "sawmill", "sitesawmill", "well", "sitewell", "lodge", "sitelodge", "butcher", "sitebutcher", "port", "siteport", "apiary", "siteapiary", "clinic", "siteclinic", "church", "sitechurch", "farm", "sitefarm", "stable", "sitestable", "pigpen", "sitepigpen", "market", "sitemarket", "shipyard", "siteshipyard", "autoyard", "tavern", "sitetavern", "larder"].some((k) => q.has(k)) ? Math.max(this.save.coins, 300) : this.save.coins;
    // ?camp / ?depot : bâtiment déjà construit ; ?sitecamp / ?sitedepot : seulement les fondations
    const rot = Number(q.get("rot") ?? 0);
    const camp = nums("camp");
    if (camp?.length === 2) placeCamp(this.save, camp[0], camp[1], true, rot);
    const depot = nums("depot");
    if (depot?.length === 2) placeDepot(this.save, depot[0], depot[1], true, rot);
    const sawmill = nums("sawmill");
    if (sawmill?.length === 2) placeSawmill(this.save, sawmill[0], sawmill[1], true, rot);
    const sitesawmill = nums("sitesawmill");
    if (sitesawmill?.length === 2) placeSawmill(this.save, sitesawmill[0], sitesawmill[1], false, rot);
    if (q.get("logs") && this.save.sawmills[0]) this.save.sawmills[0].logs = Number(q.get("logs"));
    if (q.get("planks") && this.save.sawmills[0]) this.save.sawmills[0].planks = Number(q.get("planks"));
    if (q.get("sawmenu")) this.sawmillSel = this.save.sawmills[0] ?? null;
    const apiary = nums("apiary");
    if (apiary?.length === 2) placeApiary(this.save, apiary[0], apiary[1], true, rot);
    const clinicAtXY = nums("clinic");
    if (clinicAtXY?.length === 2) placeClinic(this.save, clinicAtXY[0], clinicAtXY[1], true, rot);
    const churchAtXY = nums("church");
    if (churchAtXY?.length === 2) placeChurch(this.save, churchAtXY[0], churchAtXY[1], true, rot);
    const larderXY = nums("larder"); // ?larder=x,y : un garde-manger tout de suite
    if (larderXY?.length === 2) placePantry(this.save, larderXY[0], larderXY[1], true, rot);
    const tavernAtXY = nums("tavern");
    if (tavernAtXY?.length === 2) placeTavern(this.save, tavernAtXY[0], tavernAtXY[1], true, rot);
    const sitetavern = nums("sitetavern");
    if (sitetavern?.length === 2) placeTavern(this.save, sitetavern[0], sitetavern[1], false, rot);
    if (this.save.taverns[0]) {
      const tv0 = this.save.taverns[0];
      const dn = Number(q.get("dishes") ?? 0); // ?dishes=n : n plats de chaque recette
      if (dn) for (const r of RECIPES) tv0.dishes[r.id] = Math.min(DISH_CAP, dn);
      const pn = Number(q.get("pantry") ?? 0); // ?pantry=n : n de chaque ingrédient au garde-manger
      if (pn) for (const r of RECIPES) for (const g of Object.keys(r.needs) as (keyof typeof tv0.pantry)[]) tv0.pantry[g] = Math.min(PANTRY_CAP, pn);
    }
    if (q.get("tavernmenu")) this.tavernSel = this.save.taverns[0] ?? null;
    if (q.get("hunger")) for (const w of this.save.workers) w.hunger = Number(q.get("hunger")); // ?hunger=n : la faim de tous les villageois
    if (q.get("tired")) for (const w of this.save.workers) w.energy = 100 - Number(q.get("tired")); // ?tired=n : la fatigue de tous les villageois
    const shipAtXY = nums("shipyard");
    if (shipAtXY?.length === 2) placeShipyard(this.save, shipAtXY[0], shipAtXY[1], true);
    if (q.get("autoyard")) {
      // ?autoyard=1 : un chantier à la première côte valide, en spirale depuis le centre de la carte (essai)
      search: for (let r = 4; r < 80; r++) for (let dx = -r; dx <= r; dx++) for (const dy of [-r, r]) for (const [x, y] of [[96 + dx, 96 + dy], [96 + dy, 96 + dx]]) if (canPlaceShipyard(this.save, x, y)) { placeShipyard(this.save, x, y, true); this.cam.x = (x + 3) * C; this.cam.y = (y + 3) * C; break search; }
    }
    const siteship = nums("siteshipyard");
    if (siteship?.length === 2) placeShipyard(this.save, siteship[0], siteship[1], false);
    if (this.save.shipyards[0] && q.get("stage")) this.save.shipyards[0].stage = Math.min(DRAKKAR_STAGES.length, Number(q.get("stage"))); // ?stage=n : l'étape du drakkar
    if (q.get("shipmenu")) this.shipSel = this.save.shipyards[0] ?? null;
    const marketAtXY = nums("market");
    if (marketAtXY?.length === 2) placeMarket(this.save, marketAtXY[0], marketAtXY[1], true, rot);
    const sitemarket = nums("sitemarket");
    if (sitemarket?.length === 2) placeMarket(this.save, sitemarket[0], sitemarket[1], false, rot);
    const pigpenAtXY = nums("pigpen");
    if (pigpenAtXY?.length === 2) placePigpen(this.save, pigpenAtXY[0], pigpenAtXY[1], true, rot);
    const sitepigpen = nums("sitepigpen");
    if (sitepigpen?.length === 2) placePigpen(this.save, sitepigpen[0], sitepigpen[1], false, rot);
    const stableAtXY = nums("stable");
    if (stableAtXY?.length === 2) placeStable(this.save, stableAtXY[0], stableAtXY[1], true, rot);
    const sitestable = nums("sitestable");
    if (sitestable?.length === 2) placeStable(this.save, sitestable[0], sitestable[1], false, rot);
    const farmAtXY = nums("farm");
    if (farmAtXY?.length === 2) placeFarm(this.save, farmAtXY[0], farmAtXY[1], true, rot);
    const sitefarm = nums("sitefarm");
    if (sitefarm?.length === 2) placeFarm(this.save, sitefarm[0], sitefarm[1], false, rot);
    const sitechurch = nums("sitechurch");
    if (sitechurch?.length === 2) placeChurch(this.save, sitechurch[0], sitechurch[1], false, rot);
    const siteclinic = nums("siteclinic");
    if (siteclinic?.length === 2) placeClinic(this.save, siteclinic[0], siteclinic[1], false, rot);
    const cs = (q.get("clinicstock") ?? "").split(",").map(Number); // ?clinicstock=baies,miel,tisanes,sirops
    if (this.save.clinics[0] && cs.length >= 2) Object.assign(this.save.clinics[0], { berries: cs[0] || 0, honey: cs[1] || 0, tisane: cs[2] || 0, syrup: cs[3] || 0 });
    for (let i = 0; i < Number(q.get("corpse") ?? 0); i++) spawnCorpse(this.save, { ...this.save.workers[0], home: this.save.houses[0]?.id ?? null, x: 96 + i, y: 100 }, i % 2 ? "fièvre" : "vieillesse"); // ?corpse=n : des défunts devant la première maison
    for (let i = 0; i < Number(q.get("graves") ?? 0) && this.save.churches[0]; i++) this.save.churches[0].graves.push({ name: ["Anne", "Paul", "Zoé", "Luc"][i % 4], age: 60 + i, cause: i % 2 ? "fièvre" : "vieillesse", color: i % 6 });
    if (this.save.farms[0]) {
      const f0 = this.save.farms[0];
      const cq = q.get("crop") as FarmCrop | null; // ?crop=corn : la culture de la première ferme
      if (cq && FARM_CROPS[cq]) f0.crop = cq;
      const pq = q.get("plots"); // ?plots=ripe|grow|mix : l'état des parcelles
      if (pq) f0.plots.forEach((pl, i) => ((pl.c = f0.crop), (pl.t = f0.crop), (pl.p = pq === "ripe" ? 1 : pq === "grow" ? 0.45 : [1, 0.2, -1, 0.7, 1, -1, 0.9, 0.05, 0.5, -1, 1, 0.35][i % 12]), (pl.wet = i % 3 === 0 ? 0 : 0.8)));
      if (q.get("mixcrops")) f0.plots.forEach((pl, i) => (pl.t = (["wheat", "corn", "tomato", "carrot"] as FarmCrop[])[i % 4])); // ?mixcrops=1 : une culture différente par parcelle
      if (q.get("tank")) f0.water = Number(q.get("tank")); // ?tank=n : l'eau de la cuve
    }
    if (this.save.pigpens[0]) {
      const pg0 = this.save.pigpens[0];
      for (let i = 0; i < Number(q.get("pigs") ?? 0) && pg0.pigs.length < PIGS_MAX; i++) pg0.pigs.push({ age: i % 2 ? 300 : 80, eat: 0, drink: 0 }); // ?pigs=n : n cochons de plus (adultes et porcelets)
      const pk = q.get("pigstock")?.split(",").map(Number); // ?pigstock=légumes,eau : les réserves de la première porcherie
      if (pk && pk.length >= 2) Object.assign(pg0, { feed: pk[0], water: pk[1] });
    }
    if (this.save.stables[0]) {
      const st0 = this.save.stables[0];
      for (let i = 0; i < Number(q.get("cows") ?? 0) && st0.cows.length < STABLE_COWS_MAX; i++) st0.cows.push({ eat: 0, drink: 0, acc: 0 }); // ?cows=n : n vaches de plus
      const sk = q.get("stock")?.split(",").map(Number); // ?stock=herbe,eau,lait : les réserves de la première étable
      if (sk && sk.length >= 3) Object.assign(st0, { feed: sk[0], water: sk[1], milk: sk[2] });
    }
    if (q.get("grass") && this.save.depots[0]) this.save.depots[0].crops = { ...(this.save.depots[0].crops ?? {}), grass: Number(q.get("grass")) }; // ?grass=n : de l'herbe dans le premier dépôt
    if (q.get("depotmeat") && this.save.depots[0]) this.save.depots[0].meat = Number(q.get("depotmeat")); // ?depotmeat=n : de la viande brute dans le premier dépôt
    if (this.save.markets[0] && q.get("caravan")) {
      arriveCaravan(this.save.markets[0]); // ?caravan=1 : la caravane est déjà là
      if (q.get("caravan") === "leave") this.save.markets[0].clock = 4;
    }
    if (q.get("marketmenu")) this.marketSel = this.save.markets[0] ?? null;
    if (q.get("pigmenu")) this.pigpenSel = this.save.pigpens[0] ?? null;
    if (q.get("stablemenu")) this.stableSel = this.save.stables[0] ?? null;
    if (q.get("farmmenu")) this.farmSel = this.save.farms[0] ?? null;
    if (q.get("pick")) this.farmPick = Number(q.get("pick")); // ?pick=n : la parcelle dont le choix est ouvert (essai)
    if (q.get("churchmenu")) this.churchSel = this.save.churches[0] ?? null;
    if (q.get("clinicmenu")) this.clinicSel = this.save.clinics[0] ?? null;
    const sickKind = q.get("sick") as keyof typeof ILLNESSES | null; // ?sick=cold|poison|fever|flu&sickn=2&sev=40
    if (sickKind && ILLNESSES[sickKind]) for (let i = 0; i < Number(q.get("sickn") ?? 1) && i < this.save.workers.length - 1; i++) infect(this.save.workers[this.save.workers.length - 1 - i], sickKind, Number(q.get("sev") ?? 20)); // les derniers arrivés : le premier peut être le soigneur
    if (q.get("sickself") && this.save.workers[0]) infect(this.save.workers[0], (q.get("sickself") as keyof typeof ILLNESSES) in ILLNESSES ? (q.get("sickself") as keyof typeof ILLNESSES) : "fever", Number(q.get("sev") ?? 60)); // ?sickself=fever : le premier villageois (le soigneur) est malade
    if (q.get("autoport")) {
      // ?autoport=1 : un port à la première côte valide, en spirale depuis le centre de la carte (essai)
      search: for (let r = 4; r < 70; r++) for (let dx = -r; dx <= r; dx++) for (const dy of [-r, r]) for (const [x, y] of [[96 + dx, 96 + dy], [96 + dy, 96 + dx]]) if (canPlacePort(this.save, x, y)) { this.autoPort = { x, y }; placePort(this.save, x, y, true); this.cam.x = (x + 1.5) * C; this.cam.y = (y + 1.5) * C; break search; }
    }
    if (q.get("exporttest") && this.save.ports[0]) {
      // ?exporttest=1 (avec ?autoport=1) : un dépôt garni relié au port par un chemin, des quotas à 6 : de quoi voir un porteur exporter (essai)
      const pt = this.save.ports[0];
      const door = portEntrance(pt);
      search2: for (let r = 3; r < 12; r++) for (let dx = -r; dx <= r; dx++) for (const dy of [-r, r]) {
        const x = door.gx + dx;
        const y = door.gy + dy;
        if (!canPlaceDepot(this.save, x, y)) continue;
        placeDepot(this.save, x, y, true);
        const dd = this.save.depots[this.save.depots.length - 1];
        const de = depotEntrance(dd);
        for (let cx = Math.min(de.gx, door.gx); cx <= Math.max(de.gx, door.gx); cx++) placeRoad(this.save, cx, de.gy);
        for (let cy = Math.min(de.gy, door.gy); cy <= Math.max(de.gy, door.gy); cy++) placeRoad(this.save, door.gx, cy);
        dd.planks = 10;
        dd.cuts = 6;
        dd.berries = 5;
        dd.crops = { wheat: 7, tomato: 3 };
        for (const g of EXPORT_LIST) pt.quota[g] = 6;
        break search2;
      }
    }
    const siteapiary = nums("siteapiary");
    if (siteapiary?.length === 2) placeApiary(this.save, siteapiary[0], siteapiary[1], false, rot);
    if (q.get("honey") && this.save.apiaries[0]) this.save.apiaries[0].honey = Number(q.get("honey"));
    if (q.get("care") && this.save.apiaries[0]) this.save.apiaries[0].care = Number(q.get("care"));
    if (q.get("apiarymenu")) this.apiarySel = this.save.apiaries[0] ?? null;
    const port = nums("port");
    if (port?.length === 2) placePort(this.save, port[0], port[1], true);
    const siteport = nums("siteport");
    if (siteport?.length === 2) placePort(this.save, siteport[0], siteport[1]);
    if (q.get("portstock") && this.save.ports[0]) Object.assign(this.save.ports[0], { planks: Number(q.get("portstock")), cuts: Number(q.get("portstock")) });
    if (q.get("shipt") && this.save.ports[0]) this.save.ports[0].t = Number(q.get("shipt")) * SHIP_CYCLE;
    if (q.get("quota") && this.save.ports[0]) for (const g of EXPORT_LIST) this.save.ports[0].quota[g] = Number(q.get("quota")); // ?quota=n : le même réglage partout
    if (q.get("portmenu")) setTimeout(() => this.save.ports[0] && this.openPort(this.save.ports[0]), 500); // essai : la fenêtre du port
    const butcher = nums("butcher");
    if (butcher?.length === 2) placeButcher(this.save, butcher[0], butcher[1], true, rot);
    const sitebutcher = nums("sitebutcher");
    if (sitebutcher?.length === 2) placeButcher(this.save, sitebutcher[0], sitebutcher[1], false, rot);
    if (q.get("rawmeat") && this.save.butchers[0]) this.save.butchers[0].meat = Number(q.get("rawmeat"));
    if (q.get("cuts") && this.save.butchers[0]) this.save.butchers[0].cuts = Number(q.get("cuts"));
    if (q.get("butchermenu")) this.butcherSel = this.save.butchers[0] ?? null;
    const lodge = nums("lodge");
    if (lodge?.length === 2) placeLodge(this.save, lodge[0], lodge[1], true, rot);
    const sitelodge = nums("sitelodge");
    if (sitelodge?.length === 2) placeLodge(this.save, sitelodge[0], sitelodge[1], false, rot);
    if (q.get("lodgemeat") && this.save.lodges[0]) this.save.lodges[0].meat = Number(q.get("lodgemeat"));
    if (q.get("lodgemenu")) this.lodgeSel = this.save.lodges[0] ?? null;
    const well = nums("well");
    if (well?.length === 2) placeWell(this.save, well[0], well[1], true, rot);
    const sitewell = nums("sitewell");
    if (sitewell?.length === 2) placeWell(this.save, sitewell[0], sitewell[1], false, rot);
    if (q.get("wellmenu")) this.wellSel = this.save.wells[0] ?? null;
    const house = nums("house");
    if (house?.length === 2) placeHouse(this.save, house[0], house[1], true, rot);
    const sitehouse = nums("sitehouse");
    if (sitehouse?.length === 2) placeHouse(this.save, sitehouse[0], sitehouse[1], false, rot);
    if (q.get("housemenu")) this.houseSel = this.save.houses[0] ?? null;
    if (q.get("depotlevel") && this.save.depots[0]) this.save.depots[0].level = Number(q.get("depotlevel"));
    if (q.get("depotfull") && this.save.depots[0]) this.save.depots[0].planks = depotCapacity(this.save.depots[0]);
    if (q.get("berries") && this.save.depots[0]) this.save.depots[0].berries = Number(q.get("berries"));
    if (q.get("quarantine") && this.save.houses[0]) this.save.houses[0].quarantine = true;
    if (q.get("xp") && this.save.workers[0]) this.save.workers[0].xp = Number(q.get("xp"));
    if (q.get("protect") && this.save.workers[0]) this.save.workers[0].protect = Number(q.get("protect"));
    if (q.get("age") && this.save.workers[0]) this.save.workers[0].age = Number(q.get("age"));
    if (q.get("coins")) this.save.coins = Number(q.get("coins")); // ?coins=n : fixe les pièces
    if (q.get("thirst") && this.save.workers[0]) this.save.workers[0].thirst = Number(q.get("thirst"));
    if (q.get("hunger") && this.save.workers[0]) this.save.workers[0].hunger = Number(q.get("hunger"));
    if (q.get("housewater") && this.save.houses[0]) this.save.houses[0].water = Number(q.get("housewater"));
    if (q.get("housefood") && this.save.houses[0]) this.save.houses[0].food = Number(q.get("housefood"));
    // ?inside=1 : tous les villageois sont dans la première maison ; ?dismantle=1 : on la démonte
    const home = this.save.houses[0];
    if (home && q.get("inside")) for (const w of this.workers) Object.assign(w.data, { home: home.id, inside: true, x: houseEntrance(home).gx + 0.5, y: houseEntrance(home).gy + 0.5 });
    if (q.get("dismantle")) {
      const b = this.save.houses[0] ?? this.save.camps[0] ?? this.save.depots[0];
      if (b) this.dismantle(b);
    }
    const sitecamp = nums("sitecamp");
    if (sitecamp?.length === 2) placeCamp(this.save, sitecamp[0], sitecamp[1], false, rot);
    const sitedepot = nums("sitedepot");
    if (sitedepot?.length === 2) placeDepot(this.save, sitedepot[0], sitedepot[1], false, rot);
    if (q.get("sitewood") && this.save.sites[0]) this.save.sites[0].have = Math.min(this.save.sites[0].need, Number(q.get("sitewood")));
    if (q.get("siteprogress") && this.save.sites[0]) this.save.sites[0].progress = Number(q.get("siteprogress"));
    if (q.get("sitemenu")) this.siteSel = this.save.sites[0] ?? null;
    // ?road=x0,y0,x1,y1 : un chemin horizontal puis vertical
    const road = nums("road");
    if (road?.length === 4) {
      const [x0, y0, x1, y1] = road;
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) placeRoad(this.save, x, y0);
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) placeRoad(this.save, x1, y);
    }
    if (q.get("campwood") && this.save.camps[0]) this.save.camps[0].wood = Number(q.get("campwood"));
    if (q.get("stock") && this.save.depots[0]) this.save.depots[0].wood = Number(q.get("stock"));
    if (q.get("depotplanks") && this.save.depots[0]) this.save.depots[0].planks = Number(q.get("depotplanks"));
    if (q.get("depotcuts") && this.save.depots[0]) this.save.depots[0].cuts = Number(q.get("depotcuts"));
    if (q.get("campmenu")) this.campSel = this.save.camps[0] ?? null;
    if (q.get("depotmenu")) this.depotSel = this.save.depots[0] ?? null;
    if (q.get("build")) {
      this.build.open = true;
      this.build.selected = q.get("build");
      this.mouse = { x: this.w / 2, y: this.h / 2, inside: true };
    }
    const sel = this.selected;
    if (sel) {
      if (q.get("role") === "wood") sel.setRole("wood", this.env);
      const goto = nums("goto");
      if (goto?.length === 2) {
        const path = findPath(this.save, sel.cell, { gx: goto[0], gy: goto[1] }, false, this.avoidFor(sel));
        if (path) {
          sel.moveTo(path, this.env);
          this.follow = true;
        }
      }
      const assign = nums("assign");
      if (assign && assign.length >= 2) sel.startWood({ kind: "circle", cx: assign[0], cy: assign[1], r: assign[2] || WOOD_RADIUS }, this.env);
      const wood = nums("wood");
      if (wood?.length === 2) sel.startWood({ kind: "circle", cx: wood[0], cy: wood[1], r: WOOD_RADIUS }, this.env);
      // essais : ?haul / ?haulany (porteur au premier dépôt ou port), ?haulsaw (scieur), ?haulbutcher (boucher), ?bee, ?hunt, ?lumber, ?builder
      if ((q.get("haul") || q.get("haulany")) && (this.save.depots[0] || this.save.ports[0])) this.hire(sel, this.save.depots[0] ? "depot" : "port", (this.save.depots[0] ?? this.save.ports[0]).id);
      if (q.get("haulsaw") && this.save.sawmills[0]) this.hire(sel, "sawmill", this.save.sawmills[0].id);
      if (q.get("cook") && this.save.taverns[0]) this.hire(sel, "tavern", this.save.taverns[0].id);
      if (q.get("swineherd") && this.save.pigpens[0]) this.hire(sel, "pigpen", this.save.pigpens[0].id);
      if (q.get("herder") && this.save.stables[0]) this.hire(sel, "stable", this.save.stables[0].id);
      if (q.get("farmer") && this.save.farms[0]) this.hire(sel, "farm", this.save.farms[0].id);
      if (q.get("bury") && this.save.churches[0]) this.hire(sel, "church", this.save.churches[0].id);
      if (q.get("heal") && this.save.clinics[0]) this.hire(sel, "clinic", this.save.clinics[0].id);
      if (q.get("bee") && this.save.apiaries[0]) this.hire(sel, "apiary", this.save.apiaries[0].id);
      if (q.get("haulbutcher") && this.save.butchers[0]) this.hire(sel, "butcher", this.save.butchers[0].id);
      if (q.get("gather") && this.save.depots[0]) this.hire(sel, "gather", this.save.depots[0].id);
      if (q.get("hunt") && this.save.lodges[0]) this.hire(sel, "lodge", this.save.lodges[0].id);
      if (q.get("lumber") && this.save.camps[0]) this.hire(sel, "camp", this.save.camps[0].id);
      if (q.get("foodjob") && this.save.houses[0]) sel.startWater(this.save.houses[0].id, this.env, true);
      if (q.get("waterjob") && this.save.houses[0]) sel.startWater(this.save.houses[0].id, this.env);
      if (q.get("builder") && this.save.sites[0]) this.hire(sel, "site", this.save.sites[0].id);
    }
    const drag = nums("drag");
    if (drag?.length === 4) this.zoneDrag = { x0: drag[0] * C, y0: drag[1] * C, x1: drag[2] * C, y1: drag[3] * C, sx: 0, sy: 0 };
  }

  // ---------- caméra ----------

  private resize(fit = false) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    if (fit && !this.userCam) this.cam.zoom = Math.max(this.minZoom(), Math.min(this.w, this.h) / (15 * C));
  }

  private minZoom() {
    return Math.min(this.w, this.h) / (GRID * C * 1.04);
  }

  // La caméra reste au-dessus de l'île.
  private clampCam() {
    this.cam.x = Math.min(GRID * C, Math.max(0, this.cam.x));
    this.cam.y = Math.min(GRID * C, Math.max(0, this.cam.y));
  }

  private toWorld(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left - this.w / 2) / this.cam.zoom + this.cam.x,
      y: (clientY - r.top - this.h / 2) / this.cam.zoom + this.cam.y,
    };
  }

  private toClient(wx: number, wy: number) {
    const r = this.canvas.getBoundingClientRect();
    return { x: r.left + (wx - this.cam.x) * this.cam.zoom + this.w / 2, y: r.top + (wy - this.cam.y) * this.cam.zoom + this.h / 2 };
  }

  private cellOf(wx: number, wy: number): Pos | null {
    const gx = Math.floor(wx / C);
    const gy = Math.floor(wy / C);
    return gx < 0 || gy < 0 || gx >= GRID || gy >= GRID ? null : { gx, gy };
  }

  // ---------- saisie ----------

  private bindInput() {
    const cv = this.canvas;
    cv.addEventListener("contextmenu", (e) => e.preventDefault());
    cv.addEventListener("pointerdown", (e) => {
      cv.setPointerCapture(e.pointerId);
      // construction d'un chemin (ou démolition de chemins) : on glisse pour en tracer plusieurs cases d'un coup
      if (e.button === 0 && this.build.open && (this.build.selected === "road" || this.build.selected === ERASE)) {
        const w = this.toWorld(e.clientX, e.clientY);
        const c = this.cellOf(w.x, w.y);
        if (c) {
          this.roadPaint = { mode: this.build.selected === "road" ? "road" : "erase", last: c };
          if (this.roadPaint.mode === "erase") this.buildTap(w.x, w.y, e.clientX, e.clientY);
          else this.paintRoad(c, e.clientX, e.clientY, true);
        }
        return;
      }
      // clic droit pendant qu'on choisit où poser un bâtiment : il tourne d'un quart de tour
      if (e.button === 2 && this.build.open && this.build.selected && this.build.selected !== ERASE && this.build.selected !== "road") {
        this.rotate();
        return;
      }
      // clic droit maintenu avec un personnage sélectionné : on trace sa zone de travail
      if (e.button === 2 && !this.build.open && this.selected) {
        const w = this.toWorld(e.clientX, e.clientY);
        this.zoneDrag = { x0: w.x, y0: w.y, x1: w.x, y1: w.y, sx: e.clientX, sy: e.clientY };
        return;
      }
      this.press = { sx: e.clientX, sy: e.clientY, camX: this.cam.x, camY: this.cam.y, moved: false, button: e.button };
    });
    cv.addEventListener("pointermove", (e) => {
      this.mouse = { x: e.clientX, y: e.clientY, inside: true };
      if (this.roadPaint) {
        const w = this.toWorld(e.clientX, e.clientY);
        const c = this.cellOf(w.x, w.y);
        if (c && (c.gx !== this.roadPaint.last.gx || c.gy !== this.roadPaint.last.gy)) {
          for (const cell of cellsBetween(this.roadPaint.last, c)) {
            if (this.roadPaint.mode === "road") this.paintRoad(cell, e.clientX, e.clientY, false);
            else if (removeRoad(this.save, cell.gx, cell.gy)) this.roadsChanged = true;
          }
          this.roadPaint.last = c;
        }
        return;
      }
      if (this.zoneDrag) {
        const w = this.toWorld(e.clientX, e.clientY);
        this.zoneDrag.x1 = w.x;
        this.zoneDrag.y1 = w.y;
        return;
      }
      const p = this.press;
      if (!p) return;
      if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 6) p.moved = true;
      if (p.moved) {
        this.cam.x = p.camX - (e.clientX - p.sx) / this.cam.zoom;
        this.cam.y = p.camY - (e.clientY - p.sy) / this.cam.zoom;
        this.clampCam();
      }
    });
    cv.addEventListener("pointerleave", () => (this.mouse.inside = false));
    cv.addEventListener("pointerup", (e) => {
      if (this.roadPaint) {
        this.roadPaint = null;
        if (this.roadsChanged) persist(this.save);
        this.roadsChanged = false;
        return;
      }
      const zd = this.zoneDrag;
      if (zd && e.button === 2) {
        this.zoneDrag = null;
        const end = this.toWorld(e.clientX, e.clientY);
        const dragged = Math.hypot(e.clientX - zd.sx, e.clientY - zd.sy) > 10;
        // glisser : une zone de travail ; clic droit bref : le personnage sélectionné va là
        if (dragged) this.assignZone({ kind: "rect", x0: zd.x0 / C, y0: zd.y0 / C, x1: end.x / C, y1: end.y / C }, e.clientX, e.clientY);
        else this.rightClick(end.x, end.y, e.clientX, e.clientY);
        return;
      }
      const p = this.press;
      this.press = null;
      if (!p || p.moved || p.button !== 0) return;
      const w = this.toWorld(e.clientX, e.clientY);
      if (this.build.open && !this.build.selected) this.build.open = false; // le menu est ouvert sans rien de choisi : un clic sur la carte le ferme
      else if (this.build.open) this.buildTap(w.x, w.y, e.clientX, e.clientY);
      else this.farmTap(w.x, w.y, e.clientX, e.clientY);
    });
    cv.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const before = this.toWorld(e.clientX, e.clientY);
        this.cam.zoom = Math.min(2.5, Math.max(this.minZoom(), this.cam.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
        const after = this.toWorld(e.clientX, e.clientY);
        this.cam.x += before.x - after.x;
        this.cam.y += before.y - after.y;
        this.clampCam();
      },
      { passive: false },
    );

    document.getElementById("rotate")?.addEventListener("click", () => this.rotate());
    document.getElementById("popPill")?.addEventListener("click", () => this.openFolk());
    document.getElementById("folkClose")?.addEventListener("click", () => this.closeFolk());
    document.getElementById("portClose")?.addEventListener("click", () => this.closePort());
    document.getElementById("portModal")?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.closePort(); // un clic à côté de la fenêtre la ferme
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.portOpen) this.closePort();
    });
    document.getElementById("folkModal")?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.closeFolk(); // un clic à côté du tableau le ferme
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.paused) {
        this.closeFolk();
        this.closeMenu();
        this.closeHelp();
      }
    });
    if (new URLSearchParams(location.search).has("folk")) setTimeout(() => this.openFolk(), 400); // essai
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "r" && !e.ctrlKey && !e.metaKey) this.rotate();
      if (e.key.toLowerCase() !== "escape") return;
      if (this.paused) return; // le tableau ou le menu gèrent leur propre Échap
      if (this.zoneDrag) this.zoneDrag = null;
      else if (this.build.open || this.build.selected) {
        this.build.open = false;
        this.build.selected = null;
      } else if (this.selected || this.campSel || this.depotSel || this.houseSel || this.sawmillSel || this.wellSel || this.lodgeSel || this.butcherSel || this.portSel || this.apiarySel || this.clinicSel || this.churchSel || this.siteSel) this.deselectAll();
      else this.openMenu(); // rien à annuler : Échap ouvre le menu
    });
    // un clic en dehors du menu de construction (sans rien de choisi) le ferme
    document.addEventListener("click", (e) => {
      if (!this.build.open || this.build.selected) return;
      const t = e.target as HTMLElement;
      if (t.id === "game" || t.closest("#build, #buildBtn, #menuModal, #folkModal, #portModal, #campMenu, #toast")) return;
      this.build.open = false;
    });
    window.ferme?.onUpdate((u) => {
      this.update = u;
      if (u.state === "downloading" && u.percent === 0) toast(`⬇ Une mise à jour (${u.version}) se télécharge…`);
      if (u.state === "ready") toast(`✅ La mise à jour ${u.version} est prête : « Installer » dans le menu, ou à la fermeture du jeu.`);
      if (!(document.getElementById("menuModal") as HTMLElement).hidden) this.renderMenu();
    });
    document.getElementById("helpBtn")?.addEventListener("click", () => this.openHelp());
    document.getElementById("helpClose")?.addEventListener("click", () => this.closeHelp());
    document.getElementById("helpModal")?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.closeHelp();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() !== "h" || e.ctrlKey || e.metaKey || e.altKey) return;
      if (this.paused && (document.getElementById("helpModal") as HTMLElement).hidden) return; // un autre panneau est ouvert
      if (this.paused) this.closeHelp();
      else this.openHelp();
    });
    if (new URLSearchParams(location.search).has("help")) setTimeout(() => this.openHelp(new URLSearchParams(location.search).get("help") || undefined), 400); // essai : ?help=farm
    document.getElementById("menuBtn")?.addEventListener("click", () => this.openMenu());
    document.getElementById("menuClose")?.addEventListener("click", () => this.closeMenu());
    document.getElementById("menuModal")?.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.closeMenu();
    });
    document.getElementById("importFile")?.addEventListener("change", (e) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;
      file.text().then((txt) => {
        try {
          const o = JSON.parse(txt);
          if (!o || !Array.isArray(o.workers)) throw new Error("fichier invalide");
          localStorage.setItem(SAVE_KEY, txt);
          location.reload();
        } catch {
          toast("Ce fichier n'est pas une sauvegarde valide.");
        }
      });
      input.value = "";
    });
    if (new URLSearchParams(location.search).has("menu")) setTimeout(() => this.openMenu(), 400); // essai
  }

  // ---------- le grand drakkar : le voyage vers une île nouvelle ----------

  // Tout le village embarque : une île nouvelle accueille les villageois et les pièces. L'ancienne partie est gardée de côté.
  private setSail() {
    persist(this.save);
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) localStorage.setItem(`${SAVE_KEY}-ile${this.save.island ?? 0}`, raw); // l'île quittée reste archivée
    } catch {
      /* tant pis */
    }
    persist(sail(this.save));
    location.reload();
  }

  // Une fenêtre d'annonce (arrivée sur l'île, victoire).
  private showNews(title: string, lines: string[], big = true) {
    const modal = document.getElementById("winModal") as HTMLElement;
    (document.getElementById("winTitle") as HTMLElement).textContent = title;
    const body = document.getElementById("winBody") as HTMLElement;
    body.textContent = "";
    lines.forEach((t, i) => {
      const p = document.createElement("p");
      p.className = big && i === 0 ? "lostBig" : "";
      p.textContent = t;
      body.appendChild(p);
    });
    const row = document.createElement("div");
    row.className = "lostRow";
    const b = document.createElement("button");
    b.className = "mBtn on";
    b.textContent = "▶ Continuer";
    b.addEventListener("click", () => {
      modal.hidden = true;
      this.paused = false;
    });
    row.appendChild(b);
    body.appendChild(row);
    this.paused = true;
    modal.hidden = false;
  }

  private showArrival() {
    this.save.arrival = false;
    persist(this.save);
    this.showNews("⛵ Terre en vue !", [`Le grand drakkar a atteint une île nouvelle (île ${(this.save.island ?? 0) + 1}).`, `Les ${this.workers.length} villageois débarquent avec ${this.save.coins} pièces, mais sans aucun bâtiment.`, `Objectif : fonder une colonie qui prospère (${COLONY_GOAL.people} habitants, un port, une église, un marché, une ferme).`]);
  }

  // Sur une île de colonie : l'objectif est-il atteint ?
  private checkGoals(dt: number) {
    this.goalT -= dt;
    if (this.goalT > 0) return;
    this.goalT = 3;
    if ((this.save.island ?? 0) < 1 || this.save.victory || this.save.lost) return;
    if (!goals(this.save).every((g) => g.done)) return;
    this.save.victory = true;
    persist(this.save);
    this.showNews("🏆 Colonie fondée !", ["Bravo : la colonie prospère !", `Tu as tenu ${clockDay(this.save.clock)} jours. Tu peux continuer à jouer, ou construire un nouveau drakkar pour partir encore plus loin.`]);
  }

  // ---------- défaite : plus aucun villageois ----------

  // Essai : tous les villageois meurent (le dernier laisse son cadavre devant sa maison).
  private killAll() {
    for (const w of [...this.workers]) {
      this.bury(w.data, `☠️ ${vn(w.data.name)} est mort.`, "maladie");
    }
  }

  // Le dernier villageois a disparu : la partie est perdue.
  private lose() {
    const se = this.season();
    this.save.lost = { day: clockDay(this.save.clock), year: se.year, cause: this.lastLoss || "parti" };
    persist(this.save);
    this.showLost();
  }

  private showLost() {
    const lost = this.save.lost;
    if (!lost) return;
    this.closeFolk();
    this.closeMenu();
    this.closeHelp();
    this.paused = true;
    const modal = document.getElementById("lostModal") as HTMLElement;
    const body = document.getElementById("lostBody") as HTMLElement;
    body.textContent = "";
    const line = (text: string, cls = "") => {
      const p = document.createElement("p");
      p.className = cls;
      p.textContent = text;
      body.appendChild(p);
    };
    line("Il ne reste plus aucun villageois : le village est vide.", "lostBig");
    line(`Le dernier villageois est ${lost.cause}.`);
    line(`Tu as tenu ${lost.day} jour${lost.day > 1 ? "s" : ""} (année ${lost.year}).`);
    line("Pour ne pas en arriver là : des maisons avec de l'eau et de la nourriture, un soigneur, un fossoyeur, et attention aux nuisances.", "lostTip");
    const row = document.createElement("div");
    row.className = "lostRow";
    const mk = (label: string, fn: () => void, cls = "") => {
      const b = document.createElement("button");
      b.className = `mBtn ${cls}`;
      b.textContent = label;
      b.addEventListener("click", fn);
      row.appendChild(b);
    };
    mk("🔄 Nouvelle partie", () => {
      persist(newSave());
      location.reload();
    }, "on");
    mk("👁 Regarder le village", () => {
      modal.hidden = true;
      this.paused = false;
      (document.getElementById("lostBanner") as HTMLElement).hidden = false;
    });
    body.appendChild(row);
    (document.getElementById("lostBanner") as HTMLElement).hidden = true;
    modal.hidden = false;
  }

  // ---------- guide du jeu (aide) ----------

  private openHelp(topic?: string) {
    this.closeFolk();
    this.closeMenu();
    this.paused = true;
    this.renderHelp(topic ?? this.helpTopic);
    (document.getElementById("helpModal") as HTMLElement).hidden = false;
  }

  private closeHelp() {
    const m = document.getElementById("helpModal") as HTMLElement;
    if (m.hidden) return;
    m.hidden = true;
    this.paused = false;
  }

  private renderHelp(id: string) {
    const topic = HELP_TOPICS.find((t) => t.id === id) ?? HELP_TOPICS[0];
    this.helpTopic = topic.id;
    const nav = document.getElementById("helpNav") as HTMLElement;
    const art = document.getElementById("helpArt") as HTMLElement;
    nav.textContent = "";
    let group = "";
    for (const t of HELP_TOPICS) {
      if (t.group !== group) {
        group = t.group;
        const h = document.createElement("h4");
        h.textContent = group;
        nav.appendChild(h);
      }
      const b = document.createElement("button");
      b.className = t.id === topic.id ? "on" : "";
      b.textContent = `${t.emoji} ${tl(t.title)}`;
      b.addEventListener("click", () => {
        this.renderHelp(t.id);
        art.scrollTop = 0;
      });
      nav.appendChild(b);
    }
    art.textContent = "";
    const h2 = document.createElement("h2");
    if (topic.structure) {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 128;
      drawStructureThumb(cv, topic.structure);
      h2.appendChild(cv);
    }
    h2.append(`${topic.emoji} ${tl(topic.title)}`);
    art.appendChild(h2);
    const fmt = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    let list: HTMLUListElement | null = null;
    for (const line of topic.paras) {
      if (line.startsWith("• ")) {
        if (!list) {
          list = document.createElement("ul");
          art.appendChild(list);
        }
        const li = document.createElement("li");
        li.innerHTML = fmt(line.slice(2));
        list.appendChild(li);
      } else {
        list = null;
        const p = document.createElement("p");
        p.innerHTML = fmt(line);
        art.appendChild(p);
      }
    }
  }

  // ---------- menu du jeu ----------

  private openMenu() {
    this.closeFolk();
    this.paused = true;
    this.renderMenu();
    (document.getElementById("menuModal") as HTMLElement).hidden = false;
  }

  private closeMenu() {
    this.paused = false;
    (document.getElementById("menuModal") as HTMLElement).hidden = true;
  }

  private renderMenu(helpOpen = false) {
    const body = document.getElementById("menuBody") as HTMLElement;
    const sub = document.getElementById("menuSub") as HTMLElement;
    sub.textContent = `${this.workers.length} villageois`;
    body.textContent = "";
    const btn = (label: string, fn: () => void, cls = "") => {
      const b = document.createElement("button");
      b.className = `mBtn ${cls}`;
      b.textContent = label;
      b.addEventListener("click", fn);
      return b;
    };
    const sep = () => body.appendChild(Object.assign(document.createElement("div"), { className: "mSep" }));
    body.appendChild(btn("▶ Reprendre la partie", () => this.closeMenu()));
    body.appendChild(
      btn("💾 Sauvegarder maintenant", () => {
        persist(this.save);
        toast("Partie sauvegardée.");
      }),
    );
    sep();
    // son : activé / coupé et volume
    const sound = document.createElement("div");
    sound.className = "mRow";
    const label = document.createElement("span");
    label.textContent = isSoundOff() ? "🔇 Son" : "🔊 Son";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = String(Math.round(getVolume() * 100));
    slider.addEventListener("input", () => {
      setVolume(Number(slider.value) / 100);
      if (isSoundOff() && Number(slider.value) > 0) {
        setSoundOff(false);
        label.textContent = "🔊 Son";
        mute.textContent = "Couper";
      }
    });
    slider.addEventListener("change", () => play("bell")); // un coup de cloche pour juger le volume
    const mute = btn(isSoundOff() ? "Activer" : "Couper", () => {
      setSoundOff(!isSoundOff());
      this.renderMenu(helpOpen);
    });
    mute.style.textAlign = "center";
    sound.append(label, slider, mute);
    body.appendChild(sound);
    // vitesse du jeu
    const speed = document.createElement("div");
    speed.className = "mRow";
    const sl = document.createElement("span");
    sl.textContent = "⏩ Vitesse";
    const seg = document.createElement("div");
    seg.className = "mSeg";
    for (const v of [1, 2, 4]) {
      seg.appendChild(
        btn(`×${v}`, () => {
          this.timeScale = v;
          this.renderMenu(helpOpen);
        }, this.timeScale === v ? "on" : ""),
      );
    }
    speed.append(sl, seg);
    body.appendChild(speed);
    body.appendChild(
      btn(document.fullscreenElement ? "🗗 Quitter le plein écran" : "⛶ Plein écran", () => {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.();
        setTimeout(() => this.renderMenu(helpOpen), 250);
      }),
    );
    sep();
    // sauvegardes : fichier
    body.appendChild(
      btn("📤 Exporter la partie (fichier)", () => {
        persist(this.save);
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return toast("Rien à exporter pour l'instant.");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
        a.download = `ferme-sauvegarde-j${clockDay(this.save.clock)}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast("Sauvegarde exportée.");
      }),
    );
    body.appendChild(btn("📥 Importer une partie", () => (document.getElementById("importFile") as HTMLInputElement).click()));
    sep();
    // aide
    body.appendChild(
      btn(`🎨 Thème : ${THEME === "viking" ? "Viking ⚔️" : "Classique 🌾"} (changer)`, () => {
        const next: ThemeId = THEME === "viking" ? "classic" : "viking";
        persist(this.save);
        saveTheme(next);
        location.reload(); // le thème s'applique partout au rechargement ; la partie est sauvegardée
      }),
    );
    const goalBox = document.createElement("div");
    goalBox.className = "menuRow";
    const island = this.save.island ?? 0;
    const head0 = document.createElement("div");
    head0.style.fontWeight = "700";
    head0.textContent = island === 0 ? "🎯 Objectif : le grand drakkar" : `🎯 Objectif : fonder la colonie (île ${island + 1})`;
    goalBox.appendChild(head0);
    for (const gl of goals(this.save)) {
      const row = document.createElement("div");
      row.textContent = `${gl.done ? "✅" : "⬜"} ${gl.label}`;
      goalBox.appendChild(row);
    }
    body.appendChild(goalBox);
    sep();
    if (THEME === "viking") {
      const rs = ROAD_STYLES.find((r) => r.id === getRoadStyle())!;
      body.appendChild(
        btn(`🛤️ Chemins : ${rs.label} (changer)`, () => {
          cycleRoadStyle();
          this.renderMenu(helpOpen);
        }),
      );
    }
    body.appendChild(btn("📖 Guide des bâtiments", () => this.openHelp()));
    body.appendChild(btn(helpOpen ? "❓ Commandes ▴" : "❓ Commandes ▾", () => this.renderMenu(!helpOpen)));
    if (helpOpen) {
      const help = document.createElement("div");
      help.className = "mHelp";
      help.innerHTML =
        "<b>Clic gauche</b> : sélectionner un villageois ou un bâtiment (son menu s'ouvre en haut à droite).<br>" +
        "<b>Glisser</b> : déplacer la carte · <b>Molette</b> : zoom · <b>Minicarte</b> : aller quelque part.<br>" +
        "<b>Clic droit</b> : envoyer le villageois sélectionné, ou l'embaucher dans un bâtiment.<br>" +
        "<b>Clic droit maintenu</b> : tracer une zone de travail (bûcheron).<br>" +
        "<b>🔨 Construire</b> : choisir un bâtiment ; <b>R</b> le tourne ; les chemins se tracent en glissant ; <b>🗑 Démolir</b> retire.<br>" +
        "<b>👥</b> (en haut à gauche) : tableau des villageois, le jeu se met en pause.<br>" +
        "<b>Échap</b> : annuler / ouvrir ce menu.";
      body.appendChild(help);
    }
    sep();
    // application de bureau : version, mises à jour, quitter
    const app = window.ferme;
    if (app) {
      const u = this.update;
      const status = !u || u.state === "none" || u.state === "dev" ? (u?.state === "dev" ? "Mises à jour désactivées (mode développement)" : "") : u.state === "checking" ? "Recherche d'une mise à jour…" : u.state === "downloading" ? `Téléchargement de la mise à jour ${u.version ?? ""} : ${u.percent ?? 0} %` : u.state === "error" ? `Mise à jour impossible : ${u.message ?? ""}` : "";
      if (u?.state === "ready") body.appendChild(btn(`✅ Installer la mise à jour ${u.version} et redémarrer`, () => app.installUpdate(), "on"));
      else body.appendChild(btn(u?.state === "none" ? "🔄 À jour · rechercher à nouveau" : "🔄 Rechercher une mise à jour", () => app.checkUpdate()));
      if (status) body.appendChild(Object.assign(document.createElement("div"), { className: "mNote", textContent: status }));
      body.appendChild(btn("⏏ Quitter le jeu", () => window.close()));
      sep();
    }
    body.appendChild(
      btn("🔄 Nouvelle partie", () => {
        if (!confirm("Recommencer la ferme à zéro ? La partie actuelle sera perdue (pense à l'exporter).")) return;
        persist(newSave());
        location.reload();
      }, "danger"),
    );
    body.appendChild(Object.assign(document.createElement("div"), { className: "mNote", textContent: `${window.ferme ? "Version " + window.ferme.version + " · " : ""}Sons : pack « Impact Sounds » de Kenney (CC0)` }));
  }

  // Clic ou glisser sur la minicarte : la caméra va à cet endroit.
  private bindMinimap() {
    const el = document.getElementById("minimap") as HTMLCanvasElement;
    el.width = el.height = MINI;
    const go = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      this.cam.x = ((e.clientX - r.left) / r.width) * GRID * C;
      this.cam.y = ((e.clientY - r.top) / r.height) * GRID * C;
      this.clampCam();
    };
    el.addEventListener("pointerdown", (e) => {
      el.setPointerCapture(e.pointerId);
      go(e);
    });
    el.addEventListener("pointermove", (e) => {
      if (e.buttons) go(e);
    });
  }

  // ---------- actions du joueur ----------

  // Clic gauche (hors construction) : on sélectionne UN personnage, un camp ou un dépôt ; un clic ailleurs désélectionne tout.
  private farmTap(wx: number, wy: number, cx: number, cy: number) {
    const hit = this.workerAt(wx, wy);
    if (hit) {
      this.selectWorker(hit);
      return;
    }
    const cc = this.cellOf(wx, wy);
    const camp = cc ? campAt(this.save, cc.gx, cc.gy) : null;
    if (camp) {
      this.deselectAll();
      this.campSel = camp;
      return;
    }
    const depot = cc ? depotAt(this.save, cc.gx, cc.gy) : null;
    if (depot) {
      this.deselectAll();
      this.depotSel = depot;
      return;
    }
    const taverne = cc ? tavernAt(this.save, cc.gx, cc.gy) : null;
    if (taverne) {
      this.deselectAll();
      this.tavernSel = taverne;
      return;
    }
    const cale = cc ? shipyardAt(this.save, cc.gx, cc.gy) : null;
    if (cale) {
      this.deselectAll();
      this.shipSel = cale;
      return;
    }
    const halle = cc ? marketAt(this.save, cc.gx, cc.gy) : null;
    if (halle) {
      this.deselectAll();
      this.marketSel = halle;
      return;
    }
    const porcherie = cc ? pigpenAt(this.save, cc.gx, cc.gy) : null;
    if (porcherie) {
      this.deselectAll();
      this.pigpenSel = porcherie;
      return;
    }
    const etable = cc ? stableAt(this.save, cc.gx, cc.gy) : null;
    if (etable) {
      this.deselectAll();
      this.stableSel = etable;
      return;
    }
    const fermette = cc ? farmAt(this.save, cc.gx, cc.gy) : null;
    if (fermette) {
      this.deselectAll();
      this.farmSel = fermette;
      return;
    }
    const minster = cc ? churchAt(this.save, cc.gx, cc.gy) : null;
    if (minster) {
      this.deselectAll();
      this.churchSel = minster;
      return;
    }
    const infirm = cc ? clinicAt(this.save, cc.gx, cc.gy) : null;
    if (infirm) {
      this.deselectAll();
      this.clinicSel = infirm;
      return;
    }
    const hive = cc ? apiaryAt(this.save, cc.gx, cc.gy) : null;
    if (hive) {
      this.deselectAll();
      this.apiarySel = hive;
      return;
    }
    const dock = cc ? portAt(this.save, cc.gx, cc.gy) : null;
    if (dock) {
      this.deselectAll();
      this.openPort(dock);
      return;
    }
    const shop = cc ? butcherAt(this.save, cc.gx, cc.gy) : null;
    if (shop) {
      this.deselectAll();
      this.butcherSel = shop;
      return;
    }
    const hut = cc ? lodgeAt(this.save, cc.gx, cc.gy) : null;
    if (hut) {
      this.deselectAll();
      this.lodgeSel = hut;
      return;
    }
    const pit = cc ? wellAt(this.save, cc.gx, cc.gy) : null;
    if (pit) {
      this.deselectAll();
      this.wellSel = pit;
      return;
    }
    const sawmill = cc ? sawmillAt(this.save, cc.gx, cc.gy) : null;
    if (sawmill) {
      this.deselectAll();
      this.sawmillSel = sawmill;
      return;
    }
    const house = cc ? houseAt(this.save, cc.gx, cc.gy) : null;
    if (house) {
      this.deselectAll();
      this.houseSel = house;
      return;
    }
    const site = cc ? siteAt(this.save, cc.gx, cc.gy) : null;
    if (site && !site.undo) {
      this.deselectAll();
      this.siteSel = site;
      return;
    }
    this.deselectAll();
    if (this.tool === "walk") return;

    // avec une graine en main, le clic agit sur le terrain : arbre, eau ou champ
    const now = Date.now();
    const tree = this.terrain.treeAt(wx, wy, (idx) => isFelled(this.save, idx, now));
    if (tree >= 0) {
      if (storageFree(this.save) <= 0) {
        this.floatText(cx, cy, storageCapacity(this.save) > 0 ? "Dépôts pleins" : "Construis un dépôt pour stocker le bois");
        return;
      }
      const wood = chopTree(this.save, tree, now);
      persist(this.save);
      this.floatText(cx, cy, `+${wood} 🪵 en stock`);
      return;
    }
    if (!cc) return;
    if (isWater(terrainAt(cc.gx, cc.gy))) {
      if (now - this.lastFish < FISH_COOLDOWN_MS) {
        this.floatText(cx, cy, "La ligne se remet à l'eau…");
        return;
      }
      this.lastFish = now;
      this.splashes.push({ x: wx, y: wy, t0: performance.now() });
      const n = catchFish(this.save, terrainAt(cc.gx, cc.gy) === 0);
      persist(this.save);
      this.floatText(cx, cy, n ? `+${n} 🐟` : "Rien ne mord…");
      return;
    }
    const i = cc.gy * GRID + cc.gx;
    const before = this.save.cells[i];
    const a = interact(this.save, i, now, this.crop);
    persist(this.save);
    let msg = ACTION_MESSAGES[a];
    if (a === "plant") msg = `-${CROP_BY_ID[this.crop].cost} pièces`;
    if (a === "harvest" && before.kind === "crop") msg = `+${CROP_BY_ID[before.crop]?.gain ?? 0} pièces`;
    this.floatText(cx, cy, msg);
  }

  private selectWorker(w: Worker) {
    this.deselectAll();
    this.selected = w;
    this.jobMenuOpen = false;
  }

  private deselectAll() {
    this.selected = null;
    this.campSel = null;
    this.depotSel = null;
    this.siteSel = null;
    this.houseSel = null;
    this.sawmillSel = null;
    this.wellSel = null;
    this.lodgeSel = null;
    this.butcherSel = null;
    this.portSel = null;
    this.apiarySel = null;
    this.clinicSel = null;
    this.churchSel = null;
    this.farmSel = null;
    this.farmPick = null;
    this.stableSel = null;
    this.pigpenSel = null;
    this.marketSel = null;
    this.shipSel = null;
    this.tavernSel = null;
  }

  private workerAt(wx: number, wy: number): Worker | null {
    let best: Worker | null = null;
    let bestD = 0.5;
    for (const w of this.workers) {
      if (w.inside) continue;
      const d = Math.hypot(w.x * C - wx, w.y * C - wy) / C;
      if (d < bestD) {
        bestD = d;
        best = w;
      }
    }
    return best;
  }

  // Clic droit : sur un dépôt, le villageois sélectionné devient son porteur ; ailleurs, il va là.
  private rightClick(wx: number, wy: number, cx: number, cy: number) {
    const w = this.selected;
    if (!w) return;
    const cell = this.cellOf(wx, wy);
    if (!cell) return;
    // clic droit sur un bâtiment qui emploie : le villageois sélectionné y est embauché (s'il reste un poste)
    const spot = (): [WorkplaceKind, number] | null => {
      const depot = depotAt(this.save, cell.gx, cell.gy);
      if (depot) return ["depot", depot.id];
      const truie = pigpenAt(this.save, cell.gx, cell.gy);
      if (truie) return ["pigpen", truie.id];
      const etable = stableAt(this.save, cell.gx, cell.gy);
      if (etable) return ["stable", etable.id];
      const fermette = farmAt(this.save, cell.gx, cell.gy);
      if (fermette) return ["farm", fermette.id];
      const minster = churchAt(this.save, cell.gx, cell.gy);
      if (minster) return ["church", minster.id];
      const infirm = clinicAt(this.save, cell.gx, cell.gy);
      if (infirm) return ["clinic", infirm.id];
      const hive = apiaryAt(this.save, cell.gx, cell.gy);
      if (hive) return ["apiary", hive.id];
      const shop = butcherAt(this.save, cell.gx, cell.gy);
      if (shop) return ["butcher", shop.id];
      const hut = lodgeAt(this.save, cell.gx, cell.gy);
      if (hut) return ["lodge", hut.id];
      const mill = sawmillAt(this.save, cell.gx, cell.gy);
      if (mill) return ["sawmill", mill.id];
      const dock = portAt(this.save, cell.gx, cell.gy);
      if (dock) return ["port", dock.id];
      const camp = campAt(this.save, cell.gx, cell.gy);
      if (camp) return ["camp", camp.id];
      const site = siteAt(this.save, cell.gx, cell.gy);
      if (site && !site.undo) return ["site", site.id];
      return null;
    };
    const job = spot();
    if (job) {
      this.hire(w, job[0], job[1]);
      return;
    }
    w.leave(this.env);
    const path = findPath(this.save, w.cell, cell, false, this.avoidFor(w));
    if (!path) {
      this.floatText(cx, cy, "Impossible d'y aller");
      return;
    }
    w.moveTo(path, this.env);
    this.follow = true;
  }

  // Porteur universel : il transporte tout, d'un bâtiment à l'autre, en choisissant lui-même le prochain voyage utile
  // (bûches des camps → scierie, viande des chasseurs → boucherie, planches et viande préparée → dépôt, dépôts → port pour l'export).
  private anyHaulTask(from: Pos, cargo?: string): { dest: HaulDest; id: number } | null {
    const s = this.save;
    const cands: { dest: HaulDest; id: number; e: Pos }[] = [
      ...s.sawmills.map((m) => ({ dest: "sawmill" as const, id: m.id, e: sawmillEntrance(m) })),
      ...s.butchers.map((m) => ({ dest: "butcher" as const, id: m.id, e: butcherEntrance(m) })),
      ...s.depots.map((m) => ({ dest: "depot" as const, id: m.id, e: depotEntrance(m) })),
      ...s.ports.map((m) => ({ dest: "port" as const, id: m.id, e: portEntrance(m) })),
    ];
    // déjà chargé : seules les destinations qui conviennent à sa cargaison
    const wanted: Record<string, HaulDest[]> = { wood: ["sawmill", "port"], meat: ["butcher", "depot", "port"], plank: ["depot", "port"], cuts: ["depot", "port"], honey: ["port"], berries: ["port"], wheat: ["port"], corn: ["port"], tomato: ["port"], carrot: ["port"] };
    const ok = cands
      .filter((c) => !cargo || !wanted[cargo] || wanted[cargo].includes(c.dest))
      .filter((c) => {
        if (c.dest !== "port" || !cargo) return true;
        const p = s.ports.find((m) => m.id === c.id);
        return !!p && cargo in EXPORT_GOODS && portAccepts(p, cargo as ExportGood);
      })
      .filter((c) => this.haulRoute(c.id, !cargo, c.dest).ok)
      .sort((a, b) => Math.hypot(a.e.gx - from.gx, a.e.gy - from.gy) - Math.hypot(b.e.gx - from.gx, b.e.gy - from.gy));
    return ok.length ? { dest: ok[0].dest, id: ok[0].id } : null;
  }

  // Le soigneur choisit sa prochaine étape : porter un remède à un malade, ranger ce qu'il porte, préparer un remède, aller chercher des ingrédients.
  private healPlan(clinicId: number, _from: Pos, w: Worker): HealPlan | null {
    const s = this.save;
    const c = s.clinics.find((k) => k.id === clinicId);
    if (!c) return null;
    const door = clinicEntrance(c);
    const hid = w.data.id;
    const cargo = w.data.carry > 0 ? w.data.cargo : undefined;
    const taken = new Set([...this.healClaims].filter(([k]) => k !== hid).map(([, v]) => v));
    // les malades qui n'ont pas été soignés récemment, les plus graves d'abord
    const patients = this.workers
      .filter((o) => o.data.illness && !taken.has(o.data.id) && (o.data.illness.slowUntil ?? 0) <= o.data.illness.age) // le soigneur malade peut se soigner lui-même
      .sort((a, b) => (b === w ? 1000 : 0) + b.data.illness!.sev - ((a === w ? 1000 : 0) + a.data.illness!.sev)); // et se soigne en premier
    const where = (o: Worker): Pos => {
      const home = s.houses.find((h) => h.id === o.data.home);
      return o.inside && home ? houseEntrance(home) : o.cell;
    };
    // la prévention : une tisane à un villageois bien portant mais exposé (hiver, épidémie, maison d'un malade, soif, faim, fatigue)
    const winter = this.season().rules.id === "winter";
    const flu = this.workers.some((o) => o.data.illness?.kind === "flu");
    const preventTarget = (): Worker | undefined => {
      if (c.prevent === false) return undefined;
      const sickHomes = new Set(this.workers.filter((o) => o.data.illness).map((o) => o.data.home));
      const exposed = (o: Worker) => (sickHomes.has(o.data.home) && o.data.home != null ? 3 : 0) + (flu ? 2 : 0) + (winter ? 1 : 0) + ((o.data.thirst ?? 0) >= 70 || (o.data.hunger ?? 0) >= 70 || o.energy < 30 ? 1 : 0);
      return this.workers
        .filter((o) => o !== w && !o.data.illness && !taken.has(o.data.id) && (o.data.protect ?? 0) <= 30 && exposed(o) > 0)
        .sort((a, b) => exposed(b) - exposed(a))[0];
    };
    if (cargo === "tisane" || cargo === "syrup") {
      const p = patients[0];
      if (p) {
        this.healClaims.set(hid, p.data.id);
        return { type: "treat", target: where(p), patientId: p.data.id };
      }
      const t = cargo === "tisane" ? preventTarget() : undefined;
      if (t) {
        this.healClaims.set(hid, t.data.id);
        return { type: "treat", target: where(t), patientId: t.data.id, prevent: true };
      }
      this.healClaims.delete(hid);
      return { type: "stock", target: door }; // plus personne à soigner ni à protéger : le remède retourne au stock
    }
    if (cargo === "berries" || cargo === "honey") return { type: "stock", target: door };
    const p = patients.find((o) => bestRemedy(c, o.data.illness!));
    if (p) {
      this.healClaims.set(hid, p.data.id);
      return { type: "grab", target: door, patientId: p.data.id };
    }
    this.healClaims.delete(hid);
    if (c.tisane > PREVENT_RESERVE) {
      const t = preventTarget();
      if (t) {
        this.healClaims.set(hid, t.data.id);
        return { type: "grab", target: door, patientId: t.data.id, prevent: true };
      }
    }
    if (brewable(c)) return { type: "brew", target: door };
    // des ingrédients à rapporter des dépôts, tant qu'il reste de la place pour des remèdes
    if (c.tisane < CLINIC_REMEDY_CAP || c.syrup < CLINIC_REMEDY_CAP) {
      const depots = [...s.depots].sort((a, b) => Math.hypot(depotEntrance(a).gx - door.gx, depotEntrance(a).gy - door.gy) - Math.hypot(depotEntrance(b).gx - door.gx, depotEntrance(b).gy - door.gy));
      const wantHoney = c.honey < 3 && c.syrup < CLINIC_REMEDY_CAP;
      const withHoney = wantHoney ? depots.find((d) => (d.honey ?? 0) > 0) : undefined;
      if (withHoney) return { type: "fetch", target: depotEntrance(withHoney), depotId: withHoney.id, good: "honey" };
      if (c.berries < CLINIC_BERRY_CAP - 4) {
        const withBerries = depots.find((d) => (d.berries ?? 0) > 0);
        if (withBerries) return { type: "fetch", target: depotEntrance(withBerries), depotId: withBerries.id, good: "berries" };
        // pas de baies en réserve : il va en cueillir sur un arbuste sauvage, n'importe où sur la carte
        this.berryList ??= objects.map((o, i) => (o.kind === "berry" ? i : -1)).filter((i) => i >= 0);
        let best = -1;
        let bestD = Infinity;
        for (const i of this.berryList) {
          if (this.claimed.has(i) || w.skipsBush(i) || isPicked(s, i)) continue;
          const d = Math.hypot(objects[i].x - _from.gx, objects[i].y - _from.gy);
          if (d < bestD) {
            best = i;
            bestD = d;
          }
        }
        if (best >= 0) {
          return { type: "bush", target: { gx: Math.floor(objects[best].x), gy: Math.floor(objects[best].y) }, idx: best };
        }
      }
    }
    return null;
  }

  // L'éleveur choisit sa prochaine étape : ranger le lait, remplir l'auge ou l'abreuvoir, traire, ou aller chercher de l'herbe ou de l'eau.
  private stablePlan(stableId: number, from: Pos, w: Worker): StablePlan | null {
    const s = this.save;
    const st = s.stables.find((k) => k.id === stableId);
    if (!st) return null;
    const trough = stableTroughCell(st);
    const cargo = w.data.carry > 0 ? w.data.cargo : undefined;
    const byDist = (a: Pos, b: Pos) => Math.hypot(a.gx - from.gx, a.gy - from.gy) - Math.hypot(b.gx - from.gx, b.gy - from.gy);
    const depotRoom = [...s.depots].filter((d) => depotFree(d) > 0).sort((a, b) => byDist(depotEntrance(a), depotEntrance(b)))[0];
    const grassDepot = [...s.depots].filter((d) => (d.crops?.grass ?? 0) > 0).sort((a, b) => byDist(depotEntrance(a), depotEntrance(b)))[0];
    const well = [...s.wells].filter((m) => m.water > 0).sort((a, b) => byDist(wellEntrance(a), wellEntrance(b)))[0];
    // ce qu'il porte d'abord
    if (cargo === "water") return { type: "pour", target: trough };
    if (cargo === "grass") return { type: "feed", target: trough };
    if (cargo === "milk") return depotRoom ? { type: "deliver", target: depotEntrance(depotRoom), depotId: depotRoom.id } : null;
    const cows = st.cows.length > 0;
    // les vaches d'abord : plus rien à manger ou à boire
    if (cows && st.feed < 3 && grassDepot) return { type: "fetchGrass", target: depotEntrance(grassDepot), depotId: grassDepot.id };
    if (cows && st.water < 3 && well) return { type: "fetchWater", target: wellEntrance(well), wellId: well.id };
    if (st.milk >= 3 && depotRoom) return { type: "milk", target: stableMilkCell(st) };
    // puis remplir les réserves
    if (cows && st.feed < STABLE_FEED_CAP - 7 && grassDepot) return { type: "fetchGrass", target: depotEntrance(grassDepot), depotId: grassDepot.id };
    if (cows && st.water < STABLE_WATER_CAP - 7 && well) return { type: "fetchWater", target: wellEntrance(well), wellId: well.id };
    if (st.milk >= 1 && depotRoom) return { type: "milk", target: stableMilkCell(st) };
    return null;
  }

  // Le cuisinier choisit sa prochaine étape : ranger ce qu'il porte, préparer un plat si le garde-manger a tout, sinon aller chercher un ingrédient manquant.
  private tavernPlan(tavernId: number, from: Pos, w: Worker): CookPlan | null {
    const s = this.save;
    const t = s.taverns.find((k) => k.id === tavernId);
    if (!t) return null;
    const door = tavernEntrance(t);
    if (w.data.carry > 0) return { type: "stock", target: door };
    const have = (g: keyof typeof t.pantry) => t.pantry[g] ?? 0;
    const inDepots = (g: keyof typeof t.pantry) => s.depots.reduce((a, d) => a + (goodsOf("depot", d)[g] ?? 0), 0);
    // la recette la moins en stock dont on a (ou peut réunir) tous les ingrédients
    const options = RECIPES.filter((r) => (t.dishes[r.id] ?? 0) < DISH_CAP && (Object.entries(r.needs) as [keyof typeof t.pantry, number][]).every(([g, n]) => have(g) + inDepots(g) >= n)).sort((a, b) => (t.dishes[a.id] ?? 0) - (t.dishes[b.id] ?? 0));
    const r = options[0];
    if (!r) return null;
    for (const [g, n] of Object.entries(r.needs) as [keyof typeof t.pantry, number][]) {
      if (have(g) >= n) continue;
      const depot = [...s.depots].filter((d) => (goodsOf("depot", d)[g] ?? 0) > 0).sort((a, b) => Math.hypot(depotEntrance(a).gx - from.gx, depotEntrance(a).gy - from.gy) - Math.hypot(depotEntrance(b).gx - from.gx, depotEntrance(b).gy - from.gy))[0];
      if (!depot) return null;
      return { type: "fetch", target: depotEntrance(depot), depotId: depot.id, good: g };
    }
    return { type: "cook", target: door, recipe: r.id };
  }

  // L'action du cuisinier une fois arrivé.
  private tavernDo(plan: CookPlan, w: Worker) {
    const s = this.save;
    const job = w.data.job;
    if (!job || job.type !== "cook") return;
    const t = s.taverns.find((k) => k.id === job.tavernId);
    if (!t) return;
    const pop = this.toClient(w.x * C, w.y * C);
    if (plan.type === "fetch") {
      const d = s.depots.find((k) => k.id === plan.depotId);
      const n = d ? takeGood("depot", d, plan.good, Math.min(COOK_CARRY, PANTRY_CAP - (t.pantry[plan.good] ?? 0))) : 0;
      if (n > 0) {
        w.data.cargo = plan.good as WorkerSave["cargo"];
        w.data.carry = n;
        this.floatText(pop.x, pop.y, `+${n} ${EXPORT_GOODS[plan.good].emoji}`);
      }
    } else if (plan.type === "stock") {
      const g = w.data.cargo as keyof typeof t.pantry | undefined;
      if (g) t.pantry[g] = Math.min(PANTRY_CAP, (t.pantry[g] ?? 0) + w.data.carry);
      w.data.carry = 0;
      w.data.cargo = undefined;
    } else {
      const r = RECIPES.find((k) => k.id === plan.recipe);
      if (r && (Object.entries(r.needs) as [keyof typeof t.pantry, number][]).every(([g, n]) => (t.pantry[g] ?? 0) >= n)) {
        for (const [g, n] of Object.entries(r.needs) as [keyof typeof t.pantry, number][]) t.pantry[g] = (t.pantry[g] ?? 0) - n;
        t.dishes[r.id] = (t.dishes[r.id] ?? 0) + 1;
        job.cooked += 1;
        this.floatText(pop.x, pop.y, `+1 ${r.emoji} ${r.label}`);
      }
    }
    persist(s);
  }

  // Les villageois affamés ou fatigués passent manger à la taverne (s'il y a des plats et qu'ils ont les mains libres).
  private autoDining() {
    const s = this.save;
    if (!s.taverns.length) return;
    const now = s.clock;
    for (const w of this.workers) {
      if (w.data.inside || w.data.resting || w.data.visit || w.data.carry > 0 || w.data.job?.type === "water" || w.data.illness) continue;
      if ((this.dineCool.get(w.data.id) ?? 0) > now) continue;
      const hungry = (w.data.hunger ?? 0) >= DINE_HUNGER && (w.data.fedFor ?? 0) <= 0;
      const tired = w.energy <= DINE_ENERGY;
      if (!hungry && !tired) continue;
      const t = [...s.taverns].filter((k) => dishCount(k) > 0).sort((a, b) => Math.hypot(tavernEntrance(a).gx - w.cell.gx, tavernEntrance(a).gy - w.cell.gy) - Math.hypot(tavernEntrance(b).gx - w.cell.gx, tavernEntrance(b).gy - w.cell.gy))[0];
      if (!t) continue;
      this.dineCool.set(w.data.id, now + DINE_COOLDOWN);
      w.startDine(t.id, this.env);
    }
  }

  // Il mange un plat : celui qui convient le mieux (le plus énergétique s'il est fatigué, le plus rassasiant s'il a faim).
  private dineDo(_plan: DinePlan, w: Worker) {
    const s = this.save;
    const job = w.data.job;
    if (!job || job.type !== "water" || job.dine === undefined) return;
    const t = s.taverns.find((k) => k.id === job.dine);
    if (!t) return;
    const menu = RECIPES.filter((r) => (t.dishes[r.id] ?? 0) > 0);
    if (!menu.length) return;
    const wantEnergy = 100 - w.energy >= (w.data.hunger ?? 0);
    const dish = [...menu].sort((a, b) => (wantEnergy ? b.energy - a.energy : b.sated - a.sated))[0];
    t.dishes[dish.id] -= 1;
    w.data.energy = Math.min(100, w.energy + dish.energy);
    w.data.hunger = 0;
    w.data.fedFor = dish.sated;
    const pop = this.toClient(w.x * C, w.y * C);
    this.floatText(pop.x, pop.y, `${dish.emoji} +${dish.energy} ⚡`);
    persist(s);
  }

  // Le porcher choisit sa prochaine étape : ranger la viande, abattre sur ordre, remplir l'auge ou l'abreuvoir, ou aller chercher des légumes ou de l'eau.
  private pigPlan(pigpenId: number, from: Pos, w: Worker): SwinePlan | null {
    const s = this.save;
    const pg = s.pigpens.find((k) => k.id === pigpenId);
    if (!pg) return null;
    const trough = pigpenTroughCell(pg);
    const cargo = w.data.carry > 0 ? w.data.cargo : undefined;
    const byDist = (a: Pos, b: Pos) => Math.hypot(a.gx - from.gx, a.gy - from.gy) - Math.hypot(b.gx - from.gx, b.gy - from.gy);
    const depotRoom = [...s.depots].filter((d) => depotFree(d) > 0).sort((a, b) => byDist(depotEntrance(a), depotEntrance(b)))[0];
    const cropDepot = [...s.depots].filter((d) => this.pigCropOf(d) !== null).sort((a, b) => byDist(depotEntrance(a), depotEntrance(b)))[0];
    const well = [...s.wells].filter((m) => m.water > 0).sort((a, b) => byDist(wellEntrance(a), wellEntrance(b)))[0];
    if (cargo === "water") return { type: "pour", target: trough };
    if (cargo === "meat") return depotRoom ? { type: "deliver", target: depotEntrance(depotRoom), depotId: depotRoom.id } : null;
    if (cargo && cargo in FARM_CROPS) return { type: "feed", target: trough };
    const pigs = pg.pigs.length > 0;
    if (pigs && pg.feed < 3 && cropDepot) return { type: "fetchCrop", target: depotEntrance(cropDepot), depotId: cropDepot.id };
    if (pigs && pg.water < 3 && well) return { type: "fetchWater", target: wellEntrance(well), wellId: well.id };
    if (pg.order > 0 && adultsOf(pg) > 0 && depotRoom) return { type: "slaughter", target: pigpenSlaughterCell(pg) };
    if (pigs && pg.feed < PIG_FEED_CAP - 7 && cropDepot) return { type: "fetchCrop", target: depotEntrance(cropDepot), depotId: cropDepot.id };
    if (pigs && pg.water < PIG_WATER_CAP - 7 && well) return { type: "fetchWater", target: wellEntrance(well), wellId: well.id };
    return null;
  }

  // Le légume du dépôt que mangent les cochons (le plus abondant ; jamais l'herbe des vaches).
  private pigCropOf(d: { crops?: Partial<Record<FarmCrop, number>> }): FarmCrop | null {
    let best: FarmCrop | null = null;
    for (const c of Object.keys(FARM_CROPS) as FarmCrop[]) {
      if (c === "grass") continue;
      if ((d.crops?.[c] ?? 0) > 0 && (best === null || (d.crops?.[c] ?? 0) > (d.crops?.[best] ?? 0))) best = c;
    }
    return best;
  }

  // L'action du porcher une fois arrivé.
  private pigDo(plan: SwinePlan, w: Worker) {
    const s = this.save;
    const job = w.data.job;
    if (!job || job.type !== "swine") return;
    const pg = s.pigpens.find((k) => k.id === job.pigpenId);
    if (!pg) return;
    const pop = this.toClient(w.x * C, w.y * C);
    if (plan.type === "slaughter") {
      const n = slaughterPig(pg);
      if (n > 0) {
        pg.order = Math.max(0, pg.order - 1);
        w.data.cargo = "meat";
        w.data.carry = n;
        job.slaughtered += 1;
        this.floatText(pop.x, pop.y, `+${n} 🍖`);
      }
    } else if (plan.type === "deliver") {
      const d = s.depots.find((k) => k.id === plan.depotId);
      const taken = d ? Math.min(w.data.carry, depotFree(d)) : 0;
      if (d && taken > 0) d.meat = (d.meat ?? 0) + taken;
      w.data.carry -= taken;
      if (w.data.carry <= 0) w.data.cargo = undefined;
      this.floatText(pop.x, pop.y, `+${taken} 🍖 au dépôt`);
    } else if (plan.type === "fetchCrop") {
      const d = s.depots.find((k) => k.id === plan.depotId);
      const crop = d ? this.pigCropOf(d) : null;
      const n = d && crop ? Math.min(SWINE_CARRY, d.crops?.[crop] ?? 0, Math.ceil(PIG_FEED_CAP - pg.feed)) : 0;
      if (d && crop && n > 0) {
        d.crops = { ...(d.crops ?? {}), [crop]: (d.crops?.[crop] ?? 0) - n };
        w.data.cargo = crop;
        w.data.carry = n;
        this.floatText(pop.x, pop.y, `+${n} ${FARM_CROPS[crop].emoji}`);
      }
    } else if (plan.type === "feed") {
      pg.feed = Math.min(PIG_FEED_CAP, pg.feed + w.data.carry);
      w.data.carry = 0;
      w.data.cargo = undefined;
      this.floatText(pop.x, pop.y, `🥕 auge ${Math.floor(pg.feed)}/${PIG_FEED_CAP}`);
    } else if (plan.type === "fetchWater") {
      const m = s.wells.find((k) => k.id === plan.wellId);
      const n = m ? takeWater(m, Math.min(SWINE_CARRY, Math.ceil(PIG_WATER_CAP - pg.water))) : 0;
      if (n > 0) {
        w.data.cargo = "water";
        w.data.carry = n;
        this.floatText(pop.x, pop.y, `+${n} 💧`);
      }
    } else {
      pg.water = Math.min(PIG_WATER_CAP, pg.water + w.data.carry);
      w.data.carry = 0;
      w.data.cargo = undefined;
      this.floatText(pop.x, pop.y, `💧 abreuvoir ${Math.floor(pg.water)}/${PIG_WATER_CAP}`);
    }
    persist(s);
  }

  // L'action de l'éleveur une fois arrivé.
  private stableDo(plan: StablePlan, w: Worker) {
    const s = this.save;
    const job = w.data.job;
    if (!job || job.type !== "tend") return;
    const st = s.stables.find((k) => k.id === job.stableId);
    if (!st) return;
    const pop = this.toClient(w.x * C, w.y * C);
    if (plan.type === "milk") {
      const n = Math.min(HERDER_CARRY, st.milk);
      if (n > 0) {
        st.milk -= n;
        w.data.cargo = "milk";
        w.data.carry = n;
        job.milked += n;
        this.floatText(pop.x, pop.y, `+${n} 🥛`);
      }
    } else if (plan.type === "deliver") {
      const d = s.depots.find((k) => k.id === plan.depotId);
      const taken = d ? Math.min(w.data.carry, depotFree(d)) : 0;
      if (d && taken > 0) d.milk = (d.milk ?? 0) + taken;
      w.data.carry -= taken;
      if (w.data.carry <= 0) w.data.cargo = undefined;
      this.floatText(pop.x, pop.y, `+${taken} 🥛 au dépôt`);
    } else if (plan.type === "fetchGrass") {
      const d = s.depots.find((k) => k.id === plan.depotId);
      const n = d ? Math.min(HERDER_CARRY, d.crops?.grass ?? 0, Math.ceil(STABLE_FEED_CAP - st.feed)) : 0;
      if (d && n > 0) {
        d.crops = { ...(d.crops ?? {}), grass: (d.crops?.grass ?? 0) - n };
        w.data.cargo = "grass";
        w.data.carry = n;
        this.floatText(pop.x, pop.y, `+${n} 🌿`);
      }
    } else if (plan.type === "feed") {
      st.feed = Math.min(STABLE_FEED_CAP, st.feed + w.data.carry);
      w.data.carry = 0;
      w.data.cargo = undefined;
      this.floatText(pop.x, pop.y, `🌿 auge ${Math.floor(st.feed)}/${STABLE_FEED_CAP}`);
    } else if (plan.type === "fetchWater") {
      const m = s.wells.find((k) => k.id === plan.wellId);
      const n = m ? takeWater(m, Math.min(HERDER_CARRY, Math.ceil(STABLE_WATER_CAP - st.water))) : 0;
      if (n > 0) {
        w.data.cargo = "water";
        w.data.carry = n;
        this.floatText(pop.x, pop.y, `+${n} 💧`);
      }
    } else {
      st.water = Math.min(STABLE_WATER_CAP, st.water + w.data.carry);
      w.data.carry = 0;
      w.data.cargo = undefined;
      this.floatText(pop.x, pop.y, `💧 abreuvoir ${Math.floor(st.water)}/${STABLE_WATER_CAP}`);
    }
    persist(s);
  }

  // Le fermier choisit sa prochaine étape : ranger sa récolte, récolter une parcelle mûre, arroser, semer, ou aller remplir la cuve au puits.
  private farmPlan(farmId: number, from: Pos, w: Worker): FarmPlan | null {
    const s = this.save;
    const f = s.farms.find((k) => k.id === farmId);
    if (!f) return null;
    const door = farmEntrance(f);
    const carry = w.data.carry;
    const cargo = carry > 0 ? w.data.cargo : undefined;
    const holdsCrop = !!cargo && cargo in FARM_CROPS;
    // il porte de l'eau : il la verse dans la cuve
    if (cargo === "water") return { type: "pour", target: farmTankCell(f) };
    const season = this.season().index;
    const ripe = f.plots.findIndex((p) => p.p >= 1 && (!holdsCrop || p.c === cargo)); // il ne mélange pas deux cultures dans son panier
    const room = ripe >= 0 ? carry + FARM_CROPS[f.plots[ripe].c].yield <= FARM_CARRY : false;
    const empty = f.plots.findIndex((p) => p.p < 0 && p.t !== null && cropSeasonFactor(p.t, season) > 0); // chaque parcelle a sa culture prévue ; sans choix, on n'y sème rien
    const canSow = empty >= 0;
    const dryPlots = f.plots.map((p, i) => ({ p, i })).filter((x) => plotDry(x.p)).sort((a, b) => a.p.wet - b.p.wet);
    const depot = [...s.depots]
      .filter((d) => depotFree(d) > 0)
      .sort((a, b) => Math.hypot(depotEntrance(a).gx - from.gx, depotEntrance(a).gy - from.gy) - Math.hypot(depotEntrance(b).gx - from.gx, depotEntrance(b).gy - from.gy))[0];
    // la récolte va au dépôt quand le panier est plein, qu'il n'y a plus rien à récolter, ou que la culture change
    if (holdsCrop && (ripe < 0 || !room) && depot) return { type: "deliver", target: depotEntrance(depot), depotId: depot.id };
    if (ripe >= 0 && room) return { type: "reap", target: farmPlotCell(f, ripe), plot: ripe };
    // une parcelle sèche (ou tout juste semée) : on l'arrose avec la cuve
    if (!holdsCrop && dryPlots.length && f.water >= 1) return { type: "water", target: farmPlotCell(f, dryPlots[0].i), plot: dryPlots[0].i };
    if (canSow) return { type: "sow", target: farmPlotCell(f, empty), plot: empty };
    // plus d'eau et des parcelles qui en réclament : au puits
    if (!holdsCrop && f.water < FARM_TANK_CAP && (dryPlots.length > f.water || (f.water < 4 && f.plots.some((p) => p.p >= 0 && p.p < 1)))) {
      const well = [...s.wells]
        .filter((m) => m.water > 0)
        .sort((a, b) => Math.hypot(wellEntrance(a).gx - door.gx, wellEntrance(a).gy - door.gy) - Math.hypot(wellEntrance(b).gx - door.gx, wellEntrance(b).gy - door.gy))[0];
      if (well) return { type: "fetch", target: wellEntrance(well), wellId: well.id };
    }
    if (holdsCrop && depot) return { type: "deliver", target: depotEntrance(depot), depotId: depot.id };
    return null;
  }

  // L'action du fermier une fois arrivé.
  private farmDo(plan: FarmPlan, w: Worker) {
    const s = this.save;
    const job = w.data.job;
    if (!job || job.type !== "farm") return;
    const f = s.farms.find((k) => k.id === job.farmId);
    if (!f) return;
    const pop = this.toClient(w.x * C, w.y * C);
    if (plan.type === "sow") {
      const pl = f.plots[plan.plot];
      if (pl && pl.p < 0 && pl.t) {
        pl.c = pl.t;
        pl.p = 0;
        pl.t = null; // la récolte faite, il faudra rechoisir quoi y mettre
        this.floatText(pop.x, pop.y, `🌱 ${FARM_CROPS[pl.c].label}`);
      }
    } else if (plan.type === "water") {
      if (waterPlot(f, plan.plot)) this.floatText(pop.x, pop.y, "💧 arrosé");
    } else if (plan.type === "fetch") {
      const m = s.wells.find((k) => k.id === plan.wellId);
      if (m) {
        const n = takeWater(m, Math.min(FARM_FETCH, Math.ceil(FARM_TANK_CAP - f.water)));
        if (n > 0) {
          w.data.cargo = "water";
          w.data.carry = n;
          this.floatText(pop.x, pop.y, `+${n} 💧`);
        }
      }
    } else if (plan.type === "pour") {
      const n = Math.min(w.data.carry, FARM_TANK_CAP - f.water);
      f.water += Math.max(0, n);
      w.data.carry = 0; // le reste, s'il y en a, se perd
      w.data.cargo = undefined;
      this.floatText(pop.x, pop.y, `💧 cuve ${Math.floor(f.water)}/${FARM_TANK_CAP}`);
    } else if (plan.type === "reap") {
      const pl = f.plots[plan.plot];
      if (pl && pl.p >= 1 && (w.data.carry === 0 || w.data.cargo === pl.c)) {
        const n = FARM_CROPS[pl.c].yield;
        w.data.cargo = pl.c;
        w.data.carry += n;
        job.harvested += n;
        pl.p = -1;
        pl.wet = 0;
        this.floatText(pop.x, pop.y, `+${n} ${FARM_CROPS[pl.c].emoji}`);
      }
    } else if (w.data.cargo && w.data.cargo in FARM_CROPS) {
      const crop = w.data.cargo as FarmCrop;
      const d = s.depots.find((k) => k.id === plan.depotId);
      const taken = d ? addCropToDepot(d, crop, w.data.carry) : 0;
      w.data.carry -= taken;
      if (w.data.carry <= 0) w.data.cargo = undefined;
      this.floatText(pop.x, pop.y, `+${taken} ${FARM_CROPS[crop].emoji} au dépôt`);
    }
    persist(s);
  }

  // Le fossoyeur choisit sa prochaine étape : porter son défunt à l'église, ou aller chercher le défunt le plus proche.
  private buryPlan(churchId: number, from: Pos, w: Worker): BuryPlan | null {
    const s = this.save;
    const c = s.churches.find((k) => k.id === churchId);
    if (!c) return null;
    if (w.data.carry > 0 && w.data.cargo === "body") return { type: "inter", target: churchEntrance(c) };
    if (gravesFree(c) <= 0) return null; // cimetière plein
    const taken = new Set([...this.buryClaims].filter(([k]) => k !== w.data.id).map(([, v]) => v));
    const body = s.corpses
      .filter((x) => !taken.has(x.id))
      .sort((a, b) => Math.hypot(a.x - from.gx, a.y - from.gy) - Math.hypot(b.x - from.gx, b.y - from.gy))[0];
    if (!body) {
      this.buryClaims.delete(w.data.id);
      return null;
    }
    this.buryClaims.set(w.data.id, body.id);
    return { type: "pick", target: { gx: Math.floor(body.x), gy: Math.floor(body.y) }, corpseId: body.id };
  }

  // L'action du fossoyeur une fois arrivé.
  private buryDo(plan: BuryPlan, w: Worker) {
    const s = this.save;
    const job = w.data.job;
    if (!job || job.type !== "bury") return;
    const c = s.churches.find((k) => k.id === job.churchId);
    if (!c) return;
    const pop = this.toClient(w.x * C, w.y * C);
    if (plan.type === "pick") {
      const i = s.corpses.findIndex((x) => x.id === plan.corpseId);
      this.buryClaims.delete(w.data.id);
      if (i < 0) return; // un autre l'a déjà pris
      const [b] = s.corpses.splice(i, 1);
      w.data.body = { name: b.name, age: b.age, cause: b.cause, color: b.color };
      w.data.carry = 1;
      w.data.cargo = "body";
      this.floatText(pop.x, pop.y, "⚰️");
    } else if (w.data.body) {
      const b = w.data.body;
      c.graves.push({ name: b.name, age: b.age, cause: b.cause, color: b.color });
      w.data.body = undefined;
      w.data.carry = 0;
      w.data.cargo = undefined;
      job.buried++;
      this.floatText(pop.x, pop.y, "✝");
      play("bell");
      toast(`⛪ ${vn(b.name)} repose désormais au cimetière.`);
    }
    persist(s);
  }

  // Le soigneur gagne de l'expérience ; un changement de niveau est annoncé.
  private gainXp(w: Worker, n: number) {
    const before = healSkill(w.data.xp ?? 0).level;
    w.data.xp = (w.data.xp ?? 0) + n;
    const after = healSkill(w.data.xp);
    if (after.level > before) toast(`🩺 ${w.name} devient ${after.label.toLowerCase()} : ses remèdes sont plus efficaces.`);
  }

  // L'action du soigneur une fois arrivé.
  private healDo(plan: HealPlan, w: Worker) {
    const s = this.save;
    const job = w.data.job;
    if (!job || job.type !== "heal") return;
    const c = s.clinics.find((k) => k.id === job.clinicId);
    if (!c) return;
    const skill = healSkill(w.data.xp ?? 0);
    const p = "patientId" in plan ? this.workers.find((o) => o.data.id === plan.patientId) : undefined;
    const pop = this.toClient(w.x * C, w.y * C);
    if (plan.type === "grab") {
      const r: RemedyKind | null = plan.prevent ? (c.tisane > 0 ? "tisane" : null) : p?.data.illness ? bestRemedy(c, p.data.illness) : null;
      if (!r) {
        this.healClaims.delete(w.data.id);
        return;
      }
      c[r]--;
      w.data.carry = 1;
      w.data.cargo = r;
    } else if (plan.type === "treat") {
      if (!p || (!p.data.illness && !plan.prevent)) {
        this.healClaims.delete(w.data.id);
        return; // guéri ou parti entre-temps : le remède retournera au stock
      }
      const near = p.inside || Math.hypot(p.cell.gx - plan.target.gx, p.cell.gy - plan.target.gy) <= 3;
      if (!near) return; // il a bougé : le soigneur recalcule
      const remedy = w.data.cargo as RemedyKind;
      w.data.carry = 0;
      w.data.cargo = undefined;
      this.healClaims.delete(w.data.id);
      if (p.data.illness) {
        const kind = p.data.illness.kind;
        const cured = applyRemedy(p.data, remedy, skill.power);
        job.treated++;
        this.gainXp(w, XP_TREAT + (cured ? XP_CURE : 0));
        this.floatText(pop.x, pop.y, `${REMEDIES[remedy].emoji} ${p.name}`);
        if (cured) this.onHealth({ type: "cured", worker: p.data, kind });
      } else {
        protectVillager(p.data);
        this.gainXp(w, XP_PREVENT);
        this.floatText(pop.x, pop.y, `🛡️ ${p.name}`);
      }
    } else if (plan.type === "brew") {
      const k = brewable(c);
      if (k) {
        brew(c, k, skill.save);
        this.gainXp(w, XP_BREW);
        this.floatText(pop.x, pop.y, `+1 ${REMEDIES[k].emoji}`);
      }
    } else if (plan.type === "fetch") {
      const d = s.depots.find((k) => k.id === plan.depotId);
      if (d) {
        const room = plan.good === "berries" ? CLINIC_BERRY_CAP - c.berries : CLINIC_HONEY_CAP - c.honey;
        const have = plan.good === "berries" ? d.berries ?? 0 : d.honey ?? 0;
        const n = Math.min(room, have, plan.good === "berries" ? 8 : 4);
        if (plan.good === "berries") d.berries = have - n;
        else d.honey = have - n;
        w.data.carry = n;
        w.data.cargo = plan.good;
      }
    } else if (plan.type === "bush") {
      this.claimed.delete(plan.idx);
      const got = pickBush(s, plan.idx);
      if (got > 0) {
        w.data.cargo = "berries";
        w.data.carry = got;
        this.floatText(pop.x, pop.y, `+${got} 🫐`);
      }
    } else if (plan.type === "stock") {
      const cargo = w.data.cargo;
      if (cargo === "berries" || cargo === "honey") addClinicStock(c, cargo, w.data.carry);
      else if (cargo === "tisane" || cargo === "syrup") c[cargo]++;
      w.data.carry = 0;
      w.data.cargo = undefined;
    }
    persist(s);
  }

  // Une maladie qui se déclare, une guérison, un décès.
  private onHealth(ev: HealthEvent) {
    const d = ev.worker;
    const e = FEMALE_NAMES.includes(d.name) ? "e" : "";
    const il = ILLNESSES[ev.kind];
    if (ev.type === "sick" && ev.from) toast(`${il.emoji} ${vn(d.name)} a été contaminé${e} par ${vn(ev.from)} : ${il.label.toLowerCase()}.`);
    else if (ev.type === "sick") toast(ev.epidemic ? `🦠 Une épidémie de ${il.label.toLowerCase()} se déclare : ${vn(d.name)} est malade !` : `${il.emoji} ${vn(d.name)} est tombé${e} malade : ${il.label.toLowerCase()}.`);
    else if (ev.type === "cured") toast(`💚 ${vn(d.name)} est guéri${e} !`);
    else this.bury(d, `☠️ ${vn(d.name)} est mort${e} de ${il.label.toLowerCase()}. Un nouveau villageois arrivera peut-être plus tard.`, il.label.toLowerCase());
    persist(this.save);
  }

  // Un villageois meurt : il disparaît, le joueur en perd un, un nouveau arrivera plus tard.
  private bury(d: WorkerSave, message: string, cause: string) {
    this.lastLoss = `mort de ${cause}`;
    spawnCorpse(this.save, d, cause); // le corps reste devant la maison, en attendant un fossoyeur
    const w = this.workers.find((o) => o.data === d);
    if (w) {
      w.stop(this.env);
      if (this.selected === w) this.selected = null;
      const p = this.toClient(w.x * C, w.y * C);
      this.floatText(p.x, p.y, "🕯️");
    }
    this.save.workers = this.save.workers.filter((k) => k !== d);
    this.workers = this.workers.filter((o) => o.data !== d);
    this.healClaims.delete(d.id);
    toast(this.save.churches.length ? message : `${message} Son corps reste devant sa maison : il faut une église (et un fossoyeur) pour l'enterrer.`);
    this.arrivalT = this.arrivalSec - DEPARTURE_RETURN_SEC;
  }

  // Le temps passe : un ancien approche de la fin, ou s'éteint.
  private onAge(ev: AgeEvent) {
    const d = ev.worker;
    const e = FEMALE_NAMES.includes(d.name) ? "e" : "";
    if (ev.type === "warn") toast(`🧓 ${vn(d.name)} se fait vieux${e ? "ille" : ""} (${Math.floor(d.age ?? 0)} ans) : ${e ? "elle" : "il"} n'a plus beaucoup de temps devant ${e ? "elle" : "lui"}.`);
    else {
      this.bury(d, `🕯️ ${vn(d.name)} s'est éteint${e} de vieillesse à ${Math.floor(d.age ?? 0)} ans. Un nouveau villageois arrivera peut-être plus tard.`, "vieillesse");
      persist(this.save);
    }
  }

  // Un habitant va chercher de l'eau pour sa maison : au puits (relié par un chemin) le plus proche qui en a, jusqu'à ce que la maison soit pleine.
  private sendForWater(house: House, food = false) {
    // l'habitant qui part : de préférence un qui ne fait rien, et qui n'a rien sur le dos
    const free = this.workers.filter((o) => o.data.home === house.id && (o.data.carry === 0 || o.data.cargo === "water") && !(o.data.job?.type === "water"));
    const w = free.find((o) => !o.working) ?? free[0];
    if (!w) {
      toast("Personne ne peut y aller pour l'instant : les habitants portent déjà quelque chose.");
      return;
    }
    const t = this.waterTarget(house.id, true, food);
    if (!t.ok && t.reason !== "noWell") {
      toast(
        t.reason === "full"
          ? food ? "Cette maison a déjà toute la nourriture qu'il lui faut." : "Cette maison a déjà toute l'eau qu'il lui faut."
          : t.reason === "noRoad"
            ? `Aucun chemin ne relie cette maison à ${food ? "une boucherie" : "un puits"} (🔨 Construire › Chemin).`
            : "Il n'y a pas de maison.",
      );
      return;
    }
    if (!t.ok) {
      const any = food ? this.save.butchers.length : this.save.wells.length;
      toast(
        any
          ? food ? "Les boucheries et dépôts reliés à cette maison n'ont pas de viande préparée pour l'instant." : "Les puits reliés à cette maison sont à sec : attends qu'ils se remplissent."
          : food ? "Il n'y a ni boucherie ni dépôt : construis-en une (🔨 Construire)." : "Il n'y a aucun puits : construis-en un (🔨 Construire).",
      );
      return;
    }
    w.startWater(house.id, this.env, food);
    persist(this.save);
    toast(food ? `${w.name} part chercher à manger à la boucherie pour sa maison.` : `${w.name} part chercher de l'eau au puits pour sa maison.`);
  }

  // Où une corvée d'eau envoie : le puits le plus proche de la maison qui est relié à elle par un chemin et qui a de l'eau (needWater).
  private waterTarget(houseId: number, needWater: boolean, food = false): WaterRoute {
    const s = this.save;
    const house = s.houses.find((h) => h.id === houseId);
    if (!house) return { ok: false, reason: "noHouse" };
    if (food ? (house.food ?? 0) >= HOUSE_FOOD_CAP : (house.water ?? 0) >= HOUSE_WATER_CAP) return { ok: false, reason: "full" };
    // sources : les puits (eau) ou les boucheries (viande préparée)
    type WSrc = { id: number; gx: number; gy: number; e: Pos; stock: number; kind?: "butcher" | "depot" };
    const sources: WSrc[] = food
      ? [
          ...s.butchers.map((m): WSrc => ({ id: m.id, gx: m.gx, gy: m.gy, e: butcherEntrance(m), stock: m.cuts, kind: "butcher" })),
          ...s.depots.map((m): WSrc => ({ id: m.id, gx: m.gx, gy: m.gy, e: depotEntrance(m), stock: (m.cuts ?? 0) + (m.berries ?? 0) + (m.milk ?? 0) + cropTotal(m, true), kind: "depot" })),
        ]
      : s.wells.map((m) => ({ id: m.id, gx: m.gx, gy: m.gy, e: wellEntrance(m), stock: m.water }));
    if (!sources.length) return { ok: false, reason: "noWell" };
    const he = houseEntrance(house);
    const linked = sources.filter((m) => this.linkedTo(m.e, [he])).sort((a, b) => Math.hypot(a.gx - house.gx, a.gy - house.gy) - Math.hypot(b.gx - house.gx, b.gy - house.gy));
    if (!linked.length) return { ok: false, reason: "noRoad" };
    const src = needWater ? linked.find((m) => m.stock > 0) : linked[0];
    if (!src) return { ok: false, reason: "noWell" };
    return { ok: true, wellId: src.id, wellAccess: src.e, houseAccess: he, srcKind: src.kind };
  }

  // R / bouton Tourner : en construction, tourne l'aperçu ; sinon, tourne le bâtiment sélectionné d'un quart de tour.
  private rotate() {
    if (this.build.open) {
      this.buildRot = (this.buildRot + 1) % 4;
      return;
    }
    if (this.portSel) {
      toast("Le port est toujours tourné vers la mer.");
      return;
    }
    const target = this.butcherSel
      ? { b: this.butcherSel, k: "butcher" as const }
      : this.lodgeSel
      ? { b: this.lodgeSel, k: "lodge" as const }
      : this.wellSel
      ? { b: this.wellSel, k: "well" as const }
      : this.sawmillSel
      ? { b: this.sawmillSel, k: "sawmill" as const }
      : this.houseSel
      ? { b: this.houseSel, k: "house" as const }
      : this.campSel
        ? { b: this.campSel, k: "camp" as const }
        : this.depotSel
          ? { b: this.depotSel, k: "depot" as const }
          : this.siteSel
            ? { b: this.siteSel, k: this.siteSel.kind }
            : null;
    if (!target) return;
    if (rotateBuilding(this.save, target.b, target.k)) persist(this.save);
    else toast("Impossible de tourner : il n'y a pas de place libre pour l'entrée.");
  }

  // Case libre la plus proche de la porte pour sortir de la maison : aucun autre personnage n'y est, ni n'y va.
  private spawnSpot(self: Worker): Pos {
    const house = this.save.houses.find((h) => h.id === self.data.home);
    const door = house ? houseEntrance(house) : self.cell;
    const busy = (c: Pos) => !this.crossable(c) && this.workers.some((o) => o !== self && !o.inside && (sameCell(o.cell, c) || (!!o.nextCell && sameCell(o.nextCell, c))));
    for (let r = 0; r < 12; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const c = { gx: door.gx + dx, gy: door.gy + dy };
          if (walkable(this.save, c.gx, c.gy) && !busy(c)) return c;
        }
      }
    }
    return door;
  }

  // Démonte le bâtiment : il devient un chantier qui se défait en quelques secondes, puis rend une partie de ses matériaux.
  private dismantle(b: House | Camp | Depot | Sawmill | Well | Lodge | Butcher | Port | Apiary | Clinic | Church | Farm | Stable | Pigpen | Market | Shipyard | Tavern) {
    // les habitants sortent un par un, chacun sur sa propre case
    for (const w of this.workers) if (w.inside && w.data.home === (b as House).id && this.save.houses.includes(b as House)) w.leave(this.env);
    startDismantle(this.save, b);
    this.deselectAll();
    persist(this.save);
  }

  // Annule un chantier : la moitié des pièces et le bois déjà livré sont rendus tout de suite.
  private cancelSite(t: Site) {
    const g = siteRefund(t);
    const n = g.wood + g.planks;
    removeSite(this.save, t);
    this.deselectAll();
    persist(this.save);
    toast(n ? `Chantier annulé : ${n} ${g.planks ? "planche" : "🪵"}${g.planks && n > 1 ? "s" : ""} récupéré${n > 1 ? "s" : ""}.` : "Chantier annulé.");
  }

  // Un villageois qui est dans la maison en sort : il apparaît près de la porte, sur une case libre, et on le sélectionne.
  private leaveHome(w: Worker, _house: House) {
    w.leave(this.env);
    persist(this.save);
    this.selectWorker(w);
  }

  // Boutons du bas de menu : tourner et démonter.
  // Pied du menu : deux gros boutons côte à côte, tourner et démonter (ou annuler le chantier).
  private addMenuActions(box: HTMLElement, b: House | Camp | Depot | Sawmill | Well | Lodge | Butcher | Port | Apiary | Clinic | Church | Farm | Stable | Pigpen | Market | Shipyard | Tavern | Site) {
    const row = document.createElement("div");
    row.className = "menuActions";
    const btn = (icon: string, label: string, sub: string, fn: () => void) => {
      const el = document.createElement("button");
      el.className = "round menuBtn";
      const top = document.createElement("span");
      top.textContent = `${icon} ${label}`;
      el.appendChild(top);
      if (sub) {
        const small = document.createElement("small");
        small.textContent = sub;
        el.appendChild(small);
      }
      el.addEventListener("click", fn);
      row.appendChild(el);
    };
    btn("↻", "Tourner", "", () => this.rotate());
    if (this.save.houses.includes(b as House)) {
      // quarantaine : les malades de la maison y restent, la contagion ne sort plus
      const h = b as House;
      const sick = this.workers.some((w) => w.data.home === h.id && w.data.illness);
      if (sick || h.quarantine)
        btn("🚧", h.quarantine ? "Lever la quarantaine" : "Quarantaine", h.quarantine ? "" : "les malades restent chez eux", () => {
          h.quarantine = !h.quarantine;
          toast(h.quarantine ? "Quarantaine : les malades de cette maison n'en sortent plus." : "Quarantaine levée.");
          persist(this.save);
          this.menuSig = "";
        });
    }
    if (this.save.clinics.includes(b as Clinic)) {
      const cl = b as Clinic;
      btn("🛡️", "Prévention", cl.prevent === false ? "coupée" : "activée : tisanes aux villageois exposés", () => {
        cl.prevent = cl.prevent === false ? true : false;
        persist(this.save);
        this.menuSig = "";
      });
    }
    if ("wood" in b && "gx" in b && this.save.depots.includes(b as Depot)) {
      const d = b as Depot;
      const lv = depotLevel(d);
      if (lv < DEPOT_LEVELS.length) {
        const next = DEPOT_LEVELS[lv];
        btn("⬆️", "Améliorer", `${next.coins} 🪙 ${next.planks} 🪚 · ${next.cap * (d.pantry ? 2 : 1)} places`, () => {
          const r = upgradeDepot(this.save, d);
          if (r === "ok") {
            toast(`Dépôt amélioré : ${depotCapacity(d)} places.`);
            persist(this.save);
          } else toast(r === "poor" ? "Pas assez de pièces pour améliorer le dépôt." : "Pas assez de planches en stock pour améliorer le dépôt.");
          this.menuSig = "";
        });
      }
    }
    const s = this.save;
    const g = "kind" in b ? siteRefund(b) : dismantleGain(s, b);
    const gain = [g.coins ? `${g.coins} 🪙` : "", g.wood ? `${g.wood} 🪵` : "", g.planks ? `${g.planks} 🪚` : ""].filter(Boolean).join(" ");
    btn("🧰", "kind" in b ? "Annuler" : "Démonter", gain ? `+ ${gain}` : "", () => ("kind" in b ? this.cancelSite(b) : this.dismantle(b)));
    box.appendChild(row);
  }

  // Itinéraire d'un bâtisseur : de l'entrée d'un camp ou d'un dépôt (qui a du bois si wantWood) jusqu'à l'entrée du chantier, par les chemins.
  private buildRoute(siteId: number, wantMat: boolean): BuildRoute {
    const s = this.save;
    const site = s.sites.find((t) => t.id === siteId);
    if (!site) return { ok: false, reason: "noSite" };
    const goal = siteEntrance(site);
    if (!roadAt(s, goal.gx, goal.gy)) return { ok: false, reason: "noRoad" };
    type Src = { kind: "camp" | "depot" | "sawmill"; id: number; e: Pos; stock: number };
    // les planches viennent des scieries, les bûches des camps et des dépôts
    const all: Src[] = (
      site.mat === "plank"
        ? [
            ...s.sawmills.map((m): Src => ({ kind: "sawmill", id: m.id, e: sawmillEntrance(m), stock: m.planks })),
            ...s.depots.map((d): Src => ({ kind: "depot", id: d.id, e: depotEntrance(d), stock: d.planks ?? 0 })),
          ]
        : [
            ...s.camps.map((c): Src => ({ kind: "camp", id: c.id, e: campEntrance(c), stock: c.wood })),
          ]
    ).filter((x) => roadAt(s, x.e.gx, x.e.gy));
    const linked = (list: Src[]) => {
      const r = roadRoute(s, list.map((x) => x.e), [goal]);
      if (!r) return null;
      return { src: list.find((x) => x.e.gx === r.start.gx && x.e.gy === r.start.gy)!, start: r.start, path: r.path };
    };
    const r = linked(wantMat ? all.filter((x) => x.stock > 0) : all);
    if (r) return { ok: true, src: { kind: r.src.kind, id: r.src.id }, access: r.start, route: r.path };
    return linked(all) ? { ok: false, reason: "noWood" } : { ok: false, reason: "noRoad" };
  }

  // La zone délimitée décide du métier : des arbres dedans, et le personnage devient bûcheron.
  private assignZone(zone: Zone, cx: number, cy: number) {
    const w = this.selected;
    if (!w) return;
    if (w.data.workplace?.kind !== "camp") {
      toast(`${w.name} n'est pas bûcheron : embauche-le d'abord dans un camp de bûcheron (menu du camp › Recruter).`);
      return;
    }
    const now = Date.now();
    const n = this.terrain.treesIn(zone, (idx) => isFelled(this.save, idx, now)).length;
    if (n === 0) {
      this.floatText(cx, cy, "Rien à faire ici : choisis une zone boisée");
      return;
    }
    w.startWood(zone, this.env);
    toast(`${w.name} coupera les ${n} arbre${n > 1 ? "s" : ""} de cette zone.`);
  }

  // Tant qu'une maison a une place libre, un villageois finit par arriver : il vient de la campagne et marche jusqu'à sa maison.
  // Les villageois s'occupent eux-mêmes de leur maison : quand l'eau ou la nourriture passe à la moitié, un habitant disponible (qui ne
  // fait rien) part en chercher à une source reliée par un chemin. À sec, n'importe quel habitant qui a les mains libres s'y met,
  // même au milieu d'un travail : il le reprendra ensuite.
  private autoErrands() {
    const s = this.save;
    for (const house of s.houses) {
      // la maison est à sec (eau ou nourriture) et aucune source n'est disponible nulle part : ses habitants s'énervent, même retournés à leur travail
      const dry = [false, true].some((f) => (f ? house.food ?? 0 : house.water ?? 0) <= 0 && !this.waterTarget(house.id, true, f).ok);
      for (const o of this.workers) if (o.data.home === house.id) o.data.unsupplied = dry || undefined;
      for (const food of [false, true]) {
        const level = food ? house.food ?? 0 : house.water ?? 0;
        const cap = food ? HOUSE_FOOD_CAP : HOUSE_WATER_CAP;
        if (level > Math.floor(cap / 2)) continue;
        const folks = this.workers.filter((o) => o.data.home === house.id);
        // déjà quelqu'un en route pour la même chose
        if (folks.some((o) => o.data.job?.type === "water" && o.data.job.dine === undefined && !!o.data.job.food === food)) continue;
        // les habitants sans emploi d'abord ; sinon un employé y va aussi (il reprend son travail ensuite)
        const free = folks.filter((o) => !o.resting && o.data.job?.type !== "water" && (o.data.carry === 0 || o.data.cargo === "water")).sort((x, y) => Number(!!x.data.workplace) - Number(!!y.data.workplace));
        const w = free[0];
        if (!w || !this.waterTarget(house.id, true, food).ok) continue;
        w.startWater(house.id, this.env, food);
        persist(s);
      }
    }
  }

  private updateArrivals(dt: number) {
    const s = this.save;
    if (s.lost) return; // partie perdue : plus personne n'arrive
    const free = s.houses.length * HOUSE_CAPACITY - this.workers.length;
    if (free <= 0 || this.workers.length >= MAX_CREW) {
      this.arrivalT = 0;
      return;
    }
    if (s.houses.some(houseThirsty) || s.houses.some(houseHungry)) return; // sans eau ni nourriture, personne ne vient s'installer
    if (this.workers.some((w) => (w.data.discontent ?? 0) >= 70)) return; // ni tant qu'un habitant est très mécontent
    // il lui faut une maison avec une place libre et pas trop gênée
    if (!s.houses.some((h) => this.workers.filter((o) => o.data.home === h.id).length < HOUSE_CAPACITY && nuisanceLevel(s, h) < HOME_OK_NUISANCE)) return;
    this.arrivalT += dt;
    if (this.arrivalT < this.arrivalSec) return;
    this.arrivalT = 0;
    // la maison qui a de la place, la plus proche du centre du village
    const house = s.houses.find((h) => this.workers.filter((o) => o.data.home === h.id).length < HOUSE_CAPACITY && nuisanceLevel(s, h) < HOME_OK_NUISANCE) ?? s.houses[0];
    const door = houseEntrance(house);
    // il arrive de loin, par un endroit d'où il peut marcher jusqu'à la porte
    let from: Pos | null = null;
    const start = Math.random() * Math.PI * 2;
    for (const r of [16, 13, 10, 7]) {
      for (let k = 0; k < 16 && !from; k++) {
        const a = start + (k / 16) * Math.PI * 2;
        const c = { gx: Math.round(door.gx + Math.cos(a) * r), gy: Math.round(door.gy + Math.sin(a) * r) };
        if (walkable(s, c.gx, c.gy) && findPath(s, c, door)) from = c;
      }
      if (from) break;
    }
    const spot = from ?? { gx: door.gx, gy: door.gy };
    const d = addVillager(s, spot.gx + 0.5, spot.gy + 0.5, true);
    const w = new Worker(d);
    this.workers.push(w);
    this.assignHomes();
    w.sendHome(this.env);
    persist(s);
    toast("Un nouveau villageois s'installe au village !");
  }

  // Chaque villageois sans logement prend une place dans la maison la plus proche qui n'est pas pleine.
  private assignHomes() {
    const s = this.save;
    let changed = false;
    for (const w of this.workers) {
      if (w.data.home != null && s.houses.some((h) => h.id === w.data.home)) continue;
      if (w.data.home != null) changed = true;
      w.data.home = null;
      const free = s.houses
        .filter((h) => this.workers.filter((o) => o.data.home === h.id).length < HOUSE_CAPACITY)
        .filter((h) => {
          const n = nuisanceLevel(s, h);
          return n < HOME_OK_NUISANCE && !(w.data.shunned?.includes(h.id) && n >= HOME_RETURN_OK); // il évite les maisons trop gênées
        })
        .sort((a, b) => Math.hypot(a.gx - w.x, a.gy - w.y) - Math.hypot(b.gx - w.x, b.gy - w.y))[0];
      if (free) {
        w.data.home = free.id;
        changed = true;
      }
    }
    if (changed) persist(s);
  }

  // Un villageois menace de partir, se calme, ou quitte sa maison.
  private onDiscontent(ev: DiscontentEvent) {
    const data = ev.worker;
    if (ev.kind === "threat") toast(`💢 ${vn(data.name)} menace de partir : les nuisances autour de sa maison l'exaspèrent !`);
    else if (ev.kind === "calm") toast(`${vn(data.name)} s'est calmé.`);
    else if (ev.house) {
      // il part pour de bon : il quitte la maison puis le village, le joueur perd un villageois
      const w = this.workers.find((o) => o.data === data);
      if (w) {
        w.leave(this.env); // il sort sur une case libre devant la porte (sa maison est encore connue ici)
        w.stop(this.env); // il lâche son travail (arbre, gibier visé…)
        if (this.selected === w) this.selected = null;
      }
      this.save.workers = this.save.workers.filter((k) => k !== data);
      this.workers = this.workers.filter((o) => o.data !== data);
      this.lastLoss = "parti, exaspéré par les nuisances";
      toast(`${vn(data.name)} a quitté le village pour de bon, exaspéré${w?.fem ? "e" : ""} par les nuisances. Un nouveau villageois reviendra dans un moment.`);
      this.arrivalT = this.arrivalSec - DEPARTURE_RETURN_SEC; // le prochain arrivera au plus tôt dans DEPARTURE_RETURN_SEC secondes
      if (w) {
        data.home = null;
        data.threat = undefined;
        data.carry = 0;
        data.resting = false;
        // il s'éloigne vers un endroit lointain, à pied, puis s'efface
        const here = w.cell;
        for (const r of [26, 20, 14]) {
          let path: [number, number][] | null = null;
          const start = Math.random() * Math.PI * 2;
          for (let k = 0; k < 16 && !path; k++) {
            const a = start + (k / 16) * Math.PI * 2;
            const target = { gx: Math.round(here.gx + Math.cos(a) * r), gy: Math.round(here.gy + Math.sin(a) * r) };
            if (walkable(this.save, target.gx, target.gy)) path = findPath(this.save, here, target);
          }
          if (path && path.length) {
            w.moveTo(path, this.env);
            break;
          }
        }
        this.leavers.push({ w, t: 0 });
      }
      persist(this.save);
    }
  }

  // ---------- emploi ----------

  // Les employés d'un bâtiment.
  private employeesAt(kind: WorkplaceKind, id: number): Worker[] {
    if (kind === "site" && id > 0) return this.workers.filter((w) => w.data.workplace?.kind === "site" && w.data.job?.type === "build" && w.data.job.siteId === id); // les bâtisseurs de ce chantier
    return this.workers.filter((w) => w.data.workplace?.kind === kind && w.data.workplace.id === id);
  }

  // Combien d'ouvriers sont à leur poste dans la scierie ou la boucherie (c'est ce qui la fait tourner).
  private staffAt(kind: "sawmill" | "butcher", id: number): number {
    return this.workers.filter((w) => w.data.job?.type === "haul" && w.data.job.craft && w.data.job.dest === kind && w.data.job.depotId === id && w.crafting).length;
  }

  private workplaceExists(kind: WorkplaceKind, id: number): boolean {
    const s = this.save;
    if (kind === "site" && id === 0) return true; // le poste de bâtisseur ne dépend d'aucun chantier en particulier
    const list: { id: number }[] =
      kind === "camp" ? s.camps : kind === "lodge" ? s.lodges : kind === "apiary" ? s.apiaries : kind === "clinic" ? s.clinics : kind === "church" ? s.churches : kind === "farm" ? s.farms : kind === "stable" ? s.stables : kind === "pigpen" ? s.pigpens : kind === "tavern" ? s.taverns : kind === "site" ? s.sites.filter((t) => !t.undo) : kind === "depot" || kind === "gather" ? s.depots : kind === "port" ? s.ports : kind === "sawmill" ? s.sawmills : s.butchers;
    return list.some((m) => m.id === id);
  }

  private workplaceName(kind: WorkplaceKind): string {
    return tl({ camp: "camp de bûcheron", lodge: "camp de chasseur", apiary: "rucher", clinic: "maison du soigneur", church: "église", farm: "ferme", stable: "étable", pigpen: "porcherie", tavern: "taverne", site: "chantier", depot: "dépôt", gather: "dépôt (cueillette)", port: "port", sawmill: "scierie", butcher: "boucherie" }[kind]);
  }

  // Donne à l'employé le travail de son poste.
  private startJob(w: Worker, kind: WorkplaceKind, id: number) {
    const s = this.save;
    if (kind === "camp") {
      const c = s.camps.find((k) => k.id === id);
      if (c) w.startWood({ kind: "circle", cx: c.gx + 1, cy: c.gy + 1, r: LUMBER_RADIUS }, this.env); // il coupe les arbres autour de son camp
    } else if (kind === "lodge") w.startHunt(id, this.env);
    else if (kind === "apiary") w.startBee(id, this.env);
    else if (kind === "clinic") w.startHeal(id, this.env);
    else if (kind === "church") w.startBury(id, this.env);
    else if (kind === "farm") w.startFarm(id, this.env);
    else if (kind === "stable") w.startTend(id, this.env);
    else if (kind === "pigpen") w.startSwine(id, this.env);
    else if (kind === "tavern") w.startCook(id, this.env);
    else if (kind === "site") {
      // il prend le chantier qui a le moins de bâtisseurs ; s'il n'y en a pas, il attend qu'on en pose un
      const sites = s.sites.filter((t) => !t.undo);
      const load = (siteId: number) => this.workers.filter((o) => o !== w && o.data.job?.type === "build" && o.data.job.siteId === siteId).length;
      const next = [...sites].sort((a, b) => load(a.id) - load(b.id))[0];
      if (next) w.startBuild(next.id, this.env);
    }
    else if (kind === "gather") w.startGather(id, this.env);
    else if (kind === "depot" || kind === "port") w.startHaul(0, this.env, "any"); // le porteur transporte tout
    else w.startCraft(kind, id, this.env);
  }

  // Embauche un villageois dans ce bâtiment (s'il reste un poste) ; s'il avait un autre emploi, il le quitte.
  private hire(w: Worker, kind: WorkplaceKind, id: number): boolean {
    if (kind === "site") id = 0; // un bâtisseur est un bâtisseur : il va de chantier en chantier
    if (!this.workplaceExists(kind, id)) return false;
    const already = w.data.workplace?.kind === kind && w.data.workplace.id === id;
    if (!already && this.employeesAt(kind, id).length >= JOBS[kind].slots) {
      toast(`Plus de poste libre : ce ${this.workplaceName(kind)} emploie déjà ${JOBS[kind].slots} personne${JOBS[kind].slots > 1 ? "s" : ""}.`);
      return false;
    }
    this.fire(w, true);
    w.data.workplace = { kind, id };
    this.startJob(w, kind, id);
    persist(this.save);
    toast(`${w.name} est embauché · ${JOBS[kind].label} (${this.workplaceName(kind)}).`);
    return true;
  }

  // Vire un villageois : il quitte son emploi et redevient disponible.
  private fire(w: Worker, quiet = false) {
    w.data.workplace = undefined;
    w.stop(this.env);
    w.setRole("none", this.env);
    w.data.carry = 0; // il lâche ce qu'il portait
    w.data.cargo = undefined;
    persist(this.save);
    if (!quiet) toast(`${w.name} est renvoyé${w.fem ? "e" : ""} : ${w.fem ? "elle" : "il"} n'a plus d'emploi.`);
  }

  // Une fois par seconde : un employé dont le bâtiment a disparu perd son emploi ; celui qui n'a plus de travail en reprend un.
  private reconcileEmployment() {
    for (const w of this.workers) {
      const p = w.data.workplace;
      if (!p) continue;
      if (p.kind === "site" && p.id !== 0) w.data.workplace = { kind: "site", id: 0 }; // anciennes parties : bâtisseur d'un chantier précis
      if (!this.workplaceExists(p.kind, p.id)) {
        w.data.workplace = undefined; // chantier terminé, bâtiment démonté : il est de nouveau sans emploi
        w.stop(this.env);
        w.setRole("none", this.env);
        continue;
      }
      if (!w.data.job && !w.resting && !w.data.resume && !w.inside) this.startJob(w, p.kind, p.id);
    }
  }

  // Anciennes parties : un villageois qui avait un travail sans employeur est rattaché au bâtiment concerné.
  private migrateEmployment() {
    const s = this.save;
    for (const w of this.workers) {
      const j = w.data.job;
      if (!j || w.data.workplace) continue;
      let p: { kind: WorkplaceKind; id: number } | null = null;
      if (j.type === "hunt" && s.lodges.some((k) => k.id === j.lodgeId)) p = { kind: "lodge", id: j.lodgeId };
      else if (j.type === "bee" && s.apiaries.some((k) => k.id === j.apiaryId)) p = { kind: "apiary", id: j.apiaryId };
      else if (j.type === "build" && s.sites.some((k) => k.id === j.siteId)) p = { kind: "site", id: 0 };
      else if (j.type === "haul" && (s.depots[0] || s.ports[0])) p = s.depots[0] ? { kind: "depot", id: s.depots[0].id } : { kind: "port", id: s.ports[0].id };
      else if (j.type === "wood" && s.camps[0]) p = { kind: "camp", id: s.camps[0].id };
      if (p) w.data.workplace = p;
      else if (j.type !== "water") {
        w.data.job = null;
        w.data.role = "none";
      }
    }
  }

  // Cases où des personnages se tiennent immobiles : les trajets les contournent.
  // Sur un chemin ou à l'entrée d'un bâtiment, les villageois se croisent sans se bloquer ; ailleurs, une seule personne par case.
  private crossable(c: Pos): boolean {
    return roadAt(this.save, c.gx, c.gy) || isEntrance(this.save, c.gx, c.gy);
  }

  private avoidFor(self: Worker): Set<number> {
    return new Set(this.workers.filter((o) => o !== self && !o.moving && !o.inside && !this.crossable(o.cell)).map((o) => o.cell.gy * GRID + o.cell.gx));
  }

  // Itinéraire d'un porteur de ce dépôt : de l'entrée d'un camp (qui a du bois si wantWood) jusqu'à l'entrée du dépôt,
  // par les chemins seulement. Les deux entrées doivent être sur un chemin continu : passer à côté ne suffit pas.
  // Itinéraire d'un porteur vers sa destination, par les chemins, d'entrée à entrée : vers une scierie il apporte les bûches des camps,
  // vers un dépôt les planches des scieries et la viande préparée des boucheries, vers une boucherie la viande des camps de chasseur.
  private haulRoute(destId: number, wantWood: boolean, kind: HaulDest = "depot"): HaulRoute {
    const s = this.save;
    const dest =
      kind === "sawmill" ? s.sawmills.find((m) => m.id === destId) : kind === "butcher" ? s.butchers.find((m) => m.id === destId) : kind === "port" ? s.ports.find((m) => m.id === destId) : s.depots.find((d) => d.id === destId);
    if (!dest) return { ok: false, reason: "noDepot" };
    const port = kind === "port" ? (dest as Port) : null;
    const free =
      kind === "sawmill"
        ? SAWMILL_LOGS_CAP - (dest as Sawmill).logs
        : kind === "butcher"
          ? BUTCHER_MEAT_CAP - (dest as Butcher).meat
          : port
            ? portFree(port) // la place que laissent les quotas d'export
            : depotFree(dest as Depot);
    if (free <= 0) return { ok: false, reason: "full" };
    type Src = { kind: "camp" | "sawmill" | "lodge" | "butcher" | "depot"; id: number; e: Pos; stock: number };
    const sources: Src[] =
      kind === "sawmill"
        ? s.camps.map((c): Src => ({ kind: "camp", id: c.id, e: campEntrance(c), stock: c.wood }))
        : kind === "butcher"
          ? [
              ...s.lodges.map((m): Src => ({ kind: "lodge", id: m.id, e: lodgeEntrance(m), stock: m.meat })),
              ...s.depots.map((d): Src => ({ kind: "depot", id: d.id, e: depotEntrance(d), stock: d.meat ?? 0 })), // la viande brute en réserve dans les dépôts
            ]
          : port
            ? [
                ...s.depots.map((d): Src => ({ kind: "depot", id: d.id, e: depotEntrance(d), stock: exportableTotal("depot", d, port, s) })),
                ...s.sawmills.map((m): Src => ({ kind: "sawmill", id: m.id, e: sawmillEntrance(m), stock: exportableTotal("sawmill", m, port, s) })),
                ...s.butchers.map((m): Src => ({ kind: "butcher", id: m.id, e: butcherEntrance(m), stock: exportableTotal("butcher", m, port, s) })),
                ...s.camps.map((c): Src => ({ kind: "camp", id: c.id, e: campEntrance(c), stock: exportableTotal("camp", c, port, s) })),
                ...s.lodges.map((m): Src => ({ kind: "lodge", id: m.id, e: lodgeEntrance(m), stock: exportableTotal("lodge", m, port, s) })),
              ]
            : [
                ...s.sawmills.map((m): Src => ({ kind: "sawmill", id: m.id, e: sawmillEntrance(m), stock: m.planks })),
                ...s.butchers.map((m): Src => ({ kind: "butcher", id: m.id, e: butcherEntrance(m), stock: m.cuts })),
                // un camp de chasseur presque plein déverse sa viande brute dans les dépôts (réserve pour les bouchers)
                ...s.lodges.map((m): Src => ({ kind: "lodge", id: m.id, e: lodgeEntrance(m), stock: m.meat >= LODGE_CAP * 0.7 ? m.meat : 0 })),
              ];
    if (!sources.length) return { ok: false, reason: "noCamp" };
    const goal = kind === "sawmill" ? sawmillEntrance(dest as Sawmill) : kind === "butcher" ? butcherEntrance(dest as Butcher) : port ? portEntrance(port) : depotEntrance(dest as Depot);
    if (!roadAt(s, goal.gx, goal.gy)) return { ok: false, reason: "noRoad" };
    const all = sources.filter((x) => roadAt(s, x.e.gx, x.e.gy));
    const linked = (list: Src[]) => {
      const r = roadRoute(s, list.map((x) => x.e), [goal]);
      if (!r) return null;
      return { src: list.find((x) => x.e.gx === r.start.gx && x.e.gy === r.start.gy)!, start: r.start, path: r.path };
    };
    const r = linked(wantWood ? all.filter((x) => x.stock > 0) : all);
    if (r) return { ok: true, src: { kind: r.src.kind, id: r.src.id }, campAccess: r.start, route: r.path };
    // aucune source avec du stock n'est reliée : soit aucune n'est reliée, soit les sources reliées sont vides
    return linked(all) ? { ok: false, reason: "empty" } : { ok: false, reason: "noRoad" };
  }

  // Le bâtiment qui sert de source d'export (dépôt, scierie, boucherie, camp de bûcheron ou de chasseur).
  private exportSource(kind: "camp" | "depot" | "sawmill" | "lodge" | "butcher", id: number) {
    const s = this.save;
    return kind === "depot" ? s.depots.find((k) => k.id === id) : kind === "sawmill" ? s.sawmills.find((k) => k.id === id) : kind === "butcher" ? s.butchers.find((k) => k.id === id) : kind === "camp" ? s.camps.find((k) => k.id === id) : s.lodges.find((k) => k.id === id);
  }

  // Le bâtiment est-il relié par un chemin continu à un autre (camp ↔ dépôt) ?
  private linkedTo(entrance: Pos, others: Pos[]): boolean {
    const s = this.save;
    return roadAt(s, entrance.gx, entrance.gy) && !!roadRoute(s, [entrance], others.filter((e) => roadAt(s, e.gx, e.gy)));
  }

  // Ce que le jeu met à la disposition des personnages pour travailler.
  private makeEnv(): WorkerEnv {
    return {
      findPath: (from, to, self) => findPath(this.save, from, to, false, this.avoidFor(self)),
      // une case est prise si un autre personnage s'y tient ou vient de la réserver
      taken: (cell, self) => !this.crossable(cell) && this.workers.some((o) => o !== self && !o.inside && (sameCell(o.cell, cell) || (!!o.nextCell && sameCell(o.nextCell, cell)))),
      blockerAt: (cell, self) => this.crossable(cell) ? null : this.workers.find((o) => o !== self && !o.inside && (sameCell(o.cell, cell) || (!!o.nextCell && sameCell(o.nextCell, cell)))) ?? null,
      isWalkable: (gx, gy) => walkableByPeople(this.save, gx, gy),
      treesIn: (zone) => this.terrain.treesIn(zone, (i) => isFelled(this.save, i, Date.now())),
      isFelled: (idx) => isFelled(this.save, idx, Date.now()),
      claimed: this.claimed,
      // le bois abattu est chargé sur le dos du bûcheron : il n'entre pas dans le stock
      chop: (_w, idx) => {
        const wood = felTree(this.save, idx, Date.now());
        const o = objects[idx];
        const p = this.toClient(o.x * C, o.y * C);
        this.floatText(p.x, p.y, `+${wood} 🪵 sur le dos`);
        return wood;
      },
      // camps qui ont encore de la place : on y travaille à leur entrée
      camps: () => this.save.camps.filter((c) => c.wood < CAMP_CAPACITY).map(campEntrance),
      hasCamps: () => this.save.camps.length > 0,
      // arrivé à l'entrée d'un camp : le bois est stocké là, dans la limite de sa capacité
      deposit: (n, w) => {
        const dist = (c: Camp) => Math.hypot(campEntrance(c).gx + 0.5 - w.x, campEntrance(c).gy + 0.5 - w.y);
        const camp = this.save.camps.filter((c) => c.wood < CAMP_CAPACITY).sort((a, b) => dist(a) - dist(b))[0];
        if (!camp) return 0;
        const taken = depositAtCamp(camp, n);
        const p = this.toClient(w.x * C, w.y * C);
        this.floatText(p.x, p.y, `+${taken} 🪵 au camp${taken < n ? " (plein)" : ""}`);
        persist(this.save);
        return taken;
      },
      // porteur : il appartient à un dépôt
      anyHaulTask: (from, cargo) => this.anyHaulTask(from, cargo),
      craftReady: (kind, id) => {
        const m = kind === "sawmill" ? this.save.sawmills.find((k) => k.id === id) : this.save.butchers.find((k) => k.id === id);
        return !!m && (kind === "sawmill" ? sawmillWorking(m as Sawmill) : butcherWorking(m as Butcher));
      },
      craftInfo: (kind, id) => {
        const m = kind === "sawmill" ? this.save.sawmills.find((k) => k.id === id) : this.save.butchers.find((k) => k.id === id);
        if (!m) return null;
        return { entrance: kind === "sawmill" ? sawmillEntrance(m) : butcherEntrance(m), center: { x: m.gx + 1.5, y: m.gy + 1.5 } };
      },
      apiaryInfo: (id) => {
        const m = this.save.apiaries.find((k) => k.id === id);
        return m ? { care: m.care, honey: m.honey, entrance: apiaryEntrance(m) } : null;
      },
      tendApiary: (id) => {
        const m = this.save.apiaries.find((k) => k.id === id);
        if (m) tendApiary(m);
        persist(this.save);
      },
      harvestApiary: (id, max) => {
        const m = this.save.apiaries.find((k) => k.id === id);
        persist(this.save);
        return m ? harvestApiary(m, max) : 0;
      },
      // éleveur
      tavernInfo: (id) => this.save.taverns.some((k) => k.id === id),
      tavernPlan: (id, from, w) => this.tavernPlan(id, from, w),
      tavernDo: (plan, w) => this.tavernDo(plan, w),
      dinePlan: (id, _from, _w) => {
        const t = this.save.taverns.find((k) => k.id === id);
        return t && dishCount(t) > 0 ? { type: "eat", target: tavernEntrance(t) } : null;
      },
      dineDo: (plan, w) => this.dineDo(plan, w),
      pigInfo: (id) => this.save.pigpens.some((k) => k.id === id),
      pigPlan: (id, from, w) => this.pigPlan(id, from, w),
      pigDo: (plan, w) => this.pigDo(plan, w),
      stableInfo: (id) => this.save.stables.some((k) => k.id === id),
      stablePlan: (id, from, w) => this.stablePlan(id, from, w),
      stableDo: (plan, w) => this.stableDo(plan, w),
      // fermier
      farmInfo: (id) => this.save.farms.some((k) => k.id === id),
      farmPlan: (id, from, w) => this.farmPlan(id, from, w),
      farmDo: (plan, w) => this.farmDo(plan, w),
      // fossoyeur
      churchInfo: (id) => this.save.churches.some((k) => k.id === id),
      buryPlan: (id, from, w) => this.buryPlan(id, from, w),
      buryDo: (plan, w) => this.buryDo(plan, w),
      // soigneur
      clinicInfo: (id) => this.save.clinics.some((k) => k.id === id),
      quarantined: (w) => !!this.save.houses.find((h) => h.id === w.data.home)?.quarantine,
      healPlan: (id, from, w) => this.healPlan(id, from, w),
      healDo: (plan, w) => this.healDo(plan, w),
      // cueilleur : l'arbuste à baies mûr le plus proche, dans le rayon de son dépôt
      berryTarget: (depotId, from, claim, skip) => {
        if (!this.save.depots.some((k) => k.id === depotId)) return null;
        this.berryList ??= objects.map((o, i) => (o.kind === "berry" ? i : -1)).filter((i) => i >= 0);
        let best = -1;
        let bestD = Infinity;
        for (const i of this.berryList) {
          if (this.claimed.has(i) || skip.has(i) || isPicked(this.save, i)) continue;
          const d = Math.hypot(objects[i].x - from.gx, objects[i].y - from.gy);
          if (d < bestD) {
            best = i;
            bestD = d;
          }
        }
        if (best < 0) return null;
        if (claim) this.claimed.add(best);
        return { idx: best, x: objects[best].x, y: objects[best].y };
      },
      pickBerries: (idx) => {
        const n = pickBush(this.save, idx);
        persist(this.save);
        return n;
      },
      depositBerries: (depotId, n, w) => {
        const d = this.save.depots.find((k) => k.id === depotId);
        const taken = d ? addBerriesToDepot(d, n) : 0;
        const p = this.toClient(w.x * C, w.y * C);
        this.floatText(p.x, p.y, `+${taken} 🫐 au dépôt`);
        persist(this.save);
        return taken;
      },
      // le dépôt le plus proche qui a de la place pour le miel
      honeyDepot: (from) => {
        const d = this.save.depots
          .filter((k) => depotFree(k) > 0)
          .sort((a, b) => Math.hypot(depotEntrance(a).gx - from.gx, depotEntrance(a).gy - from.gy) - Math.hypot(depotEntrance(b).gx - from.gx, depotEntrance(b).gy - from.gy))[0];
        return d ? { id: d.id, entrance: depotEntrance(d) } : null;
      },
      depositHoney: (depotId, n, w) => {
        const d = this.save.depots.find((k) => k.id === depotId);
        const taken = d ? addHoneyToDepot(d, n) : 0;
        const p = this.toClient(w.x * C, w.y * C);
        this.floatText(p.x, p.y, `+${taken} 🍯 au dépôt`);
        persist(this.save);
        return taken;
      },
      exportGood: (src, portId) => {
        const p = this.save.ports.find((k) => k.id === portId);
        const o = this.exportSource(src.kind, src.id);
        return p && o ? exportableOf(src.kind, o, p, this.save)?.good ?? null : null;
      },
      takeGood: (src, good, max) => {
        const o = this.exportSource(src.kind, src.id);
        const keep = Math.max(0, ...this.save.ports.map((p) => portReserve(p, good))); // le stock minimum à garder au village
        const n = o ? takeGood(src.kind, o, good, Math.min(max, Math.max(0, villageStock(this.save, good) - keep))) : 0;
        if (n > 0) persist(this.save);
        return n;
      },
      depotInfo: (id, dest, good) => {
        if (dest === "sawmill") {
          const m = this.save.sawmills.find((k) => k.id === id);
          return m ? { free: SAWMILL_LOGS_CAP - m.logs } : null;
        }
        if (dest === "butcher") {
          const m = this.save.butchers.find((k) => k.id === id);
          return m ? { free: BUTCHER_MEAT_CAP - m.meat } : null;
        }
        if (dest === "port") {
          const m = this.save.ports.find((k) => k.id === id);
          return m ? { free: good ? portSpace(m, good) : portFree(m) } : null;
        }
        const d = this.save.depots.find((k) => k.id === id);
        return d ? { free: depotFree(d) } : null;
      },
      haulRoute: (depotId, wantWood, dest) => this.haulRoute(depotId, wantWood, dest),
      roadPath: (from, to, self) => (roadAt(this.save, to.gx, to.gy) ? findPath(this.save, from, to, true, this.avoidFor(self)) : null),
      depositDepot: (depotId, n, w, dest, plank, cuts, honey, berries, crop) => {
        const p = this.toClient(w.x * C, w.y * C);
        let taken = 0;
        if (dest === "sawmill") {
          const m = this.save.sawmills.find((k) => k.id === depotId);
          taken = m ? addLogs(m, n) : 0;
          this.floatText(p.x, p.y, `+${taken} 🪵 à la scierie`);
        } else if (dest === "port") {
          const m = this.save.ports.find((k) => k.id === depotId);
          const good = (w.data.cargo ?? "plank") as ExportGood; // la ressource qu'il porte
          taken = m && good in EXPORT_GOODS ? addToPort(m, n, good) : 0;
          this.floatText(p.x, p.y, `+${taken} ${EXPORT_GOODS[good]?.emoji ?? "📦"} au port`);
        } else if (dest === "butcher") {
          const m = this.save.butchers.find((k) => k.id === depotId);
          taken = m ? addRawMeat(m, n) : 0;
          this.floatText(p.x, p.y, `+${taken} 🍖 à la boucherie`);
        } else {
          const d = this.save.depots.find((k) => k.id === depotId);
          if (d && w.data.cargo === "meat") {
            taken = Math.min(n, depotFree(d));
            d.meat = (d.meat ?? 0) + taken; // de la viande brute mise en réserve
          } else taken = d ? (cuts ? addCutsToDepot(d, n) : plank ? addPlanksToDepot(d, n) : addToDepot(d, n)) : 0;
          this.floatText(p.x, p.y, `+${taken} ${w.data.cargo === "meat" ? "🍖" : cuts ? "🥩" : plank ? "🪚" : "🪵"} en stock`);
        }
        persist(this.save);
        return taken;
      },
      onRoad: (gx, gy) => roadAt(this.save, gx, gy),
      spawnSpot: (self) => this.spawnSpot(self),
      lodgeInfo: (id) => {
        const m = this.save.lodges.find((k) => k.id === id);
        return m ? { free: lodgeFree(m), entrance: lodgeEntrance(m) } : null;
      },
      // le gibier libre le plus proche du chasseur, dans le rayon du camp ; il est alors réservé pour lui
      preyNear: (lodgeId, from) => {
        const m = this.save.lodges.find((k) => k.id === lodgeId);
        if (!m) return null;
        const e = lodgeEntrance(m);
        const prey = this.animals
          .filter((a) => !a.dead && !this.preyClaimed.has(a.id) && Math.hypot(a.x - (e.gx + 0.5), a.y - (e.gy + 0.5)) <= HUNT_RADIUS)
          .sort((a, b) => Math.hypot(a.x - from.gx, a.y - from.gy) - Math.hypot(b.x - from.gx, b.y - from.gy))[0];
        if (!prey) return null;
        this.preyClaimed.add(prey.id);
        return { id: prey.id, x: prey.x, y: prey.y };
      },
      preyPos: (id) => {
        const a = this.animals.find((k) => k.id === id);
        return a && !a.dead ? { x: a.x, y: a.y } : null;
      },
      releasePrey: (id) => {
        this.preyClaimed.delete(id);
      },
      kill: (id) => {
        const a = this.animals.find((k) => k.id === id);
        if (!a || a.dead) return 0;
        a.dead = true;
        const p = this.toClient(a.x * C, a.y * C);
        const meat = Math.max(1, Math.round(a.meat * this.season().rules.meat)); // l'automne, le gibier est plus gras
        this.floatText(p.x, p.y, `+${meat} 🍖`);
        return meat;
      },
      depositMeat: (lodgeId, n, w) => {
        const m = this.save.lodges.find((k) => k.id === lodgeId);
        const taken = m ? addMeat(m, n) : 0;
        const p = this.toClient(w.x * C, w.y * C);
        this.floatText(p.x, p.y, `+${taken} 🍖 au camp`);
        persist(this.save);
        return taken;
      },
      hungry: (w) => (w.data.hunger ?? 0) >= NEED_BAD,
      houseStock: (w, what) => {
        const h = this.save.houses.find((k) => k.id === w.data.home);
        return h ? (what === "water" ? h.water ?? 0 : h.food ?? 0) : 0;
      },
      satisfy: (w) => {
        const h = this.save.houses.find((k) => k.id === w.data.home);
        if (!h) return;
        if ((w.data.thirst ?? 0) > 20 && (h.water ?? 0) > 0) {
          h.water = (h.water ?? 0) - 1;
          w.data.thirst = 0;
        }
        if ((w.data.hunger ?? 0) > 20 && (h.food ?? 0) > 0) {
          h.food = (h.food ?? 0) - 1;
          w.data.hunger = 0;
        }
        persist(this.save);
      },
      night: () => darkness(clockHour(this.save.clock)),
      climate: () => ({ drain: this.season().rules.drain, speed: this.season().rules.speed }),
      thirsty: (w) => (w.data.thirst ?? 0) >= NEED_BAD,
      waterTarget: (houseId, needWater, food) => this.waterTarget(houseId, needWater, !!food),
      takeWater: (srcId, max, food, kind) => {
        persist(this.save);
        if (food) {
          if (kind === "depot") {
            const d = this.save.depots.find((k) => k.id === srcId);
            if (!d) return 0;
            const nc = Math.min(max, d.cuts ?? 0);
            d.cuts = (d.cuts ?? 0) - nc;
            const nb = Math.min(max - nc, d.berries ?? 0); // puis les baies
            d.berries = (d.berries ?? 0) - nb;
            let nr = 0;
            while (nr < max - nc - nb) {
              const r = takeCropFromDepot(d, max - nc - nb - nr, true); // puis les récoltes (pas l'herbe)
              if (!r || r.n <= 0) break;
              nr += r.n;
            }
            const nm = Math.min(max - nc - nb - nr, d.milk ?? 0); // et enfin le lait
            d.milk = (d.milk ?? 0) - nm;
            return nc + nb + nr + nm;
          }
          const b = this.save.butchers.find((k) => k.id === srcId);
          return b ? takeCuts(b, max) : 0;
        }
        const m = this.save.wells.find((k) => k.id === srcId);
        return m ? takeWater(m, max) : 0;
      },
      deliverWater: (houseId, n, w, food) => {
        const h = this.save.houses.find((k) => k.id === houseId);
        const taken = h ? (food ? addFood(h, n) : addWater(h, n)) : 0;
        const p = this.toClient(w.x * C, w.y * C);
        this.floatText(p.x, p.y, food ? `+${taken} 🥩 à la maison` : `+${taken} 💧 à la maison`);
        persist(this.save);
        return taken;
      },
      homeEntrance: (w) => {
        const h = this.save.houses.find((k) => k.id === w.data.home);
        return h ? houseEntrance(h) : null;
      },
      // bâtisseur
      siteInfo: (id) => {
        const t = this.save.sites.find((k) => k.id === id);
        return t && !t.undo ? { missing: siteMissing(t), ready: siteReady(t), entrance: siteEntrance(t), plank: t.mat === "plank" } : null;
      },
      buildRoute: (siteId, wantWood) => this.buildRoute(siteId, wantWood),
      takeFromSource: (src, max, plank, cuts, honey, berries) => {
        persist(this.save);
        if (src.kind === "sawmill") {
          const m = this.save.sawmills.find((k) => k.id === src.id);
          return m ? takePlanks(m, max) : 0;
        }
        if (src.kind === "depot") {
          const d = this.save.depots.find((k) => k.id === src.id);
          if (!d) return 0;
          if (plank) {
            const n = Math.min(max, d.planks ?? 0);
            d.planks = (d.planks ?? 0) - n;
            return n;
          }
          if (berries) {
            const n = Math.min(max, d.berries ?? 0);
            d.berries = (d.berries ?? 0) - n;
            return n;
          }
          if (honey) {
            const n = Math.min(max, d.honey ?? 0);
            d.honey = (d.honey ?? 0) - n;
            return n;
          }
          if (cuts) {
            const n = Math.min(max, d.cuts ?? 0);
            d.cuts = (d.cuts ?? 0) - n;
            return n;
          }
          const n = Math.min(max, d.wood);
          d.wood -= n;
          return n;
        }
        if (src.kind === "lodge") {
          const m = this.save.lodges.find((k) => k.id === src.id);
          return m ? takeMeat(m, max) : 0;
        }
        if (src.kind === "butcher") {
          const m = this.save.butchers.find((k) => k.id === src.id);
          return m ? takeCuts(m, max) : 0;
        }
        const c = this.save.camps.find((k) => k.id === src.id);
        if (!c) return 0;
        const n = Math.min(max, c.wood);
        c.wood -= n;
        return n;
      },
      depositSite: (siteId, n, w) => {
        const t = this.save.sites.find((k) => k.id === siteId);
        const taken = t ? addToSite(t, n) : 0;
        const p = this.toClient(w.x * C, w.y * C);
        this.floatText(p.x, p.y, t?.mat === "plank" ? `+${taken} planche${taken > 1 ? "s" : ""} au chantier` : `+${taken} 🪵 au chantier`);
        persist(this.save);
        return taken;
      },
      workCell: (siteId, from) => {
        const t = this.save.sites.find((k) => k.id === siteId);
        return t ? workCell(this.save, t, from) : null;
      },
      work: (siteId, dt) => {
        const t = this.save.sites.find((k) => k.id === siteId);
        if (!t) return true;
        const done = workOnSite(this.save, t, dt);
        if (done) {
          if (this.siteSel === t) this.siteSel = null;
          persist(this.save);
        } else if (!this.dirtyAt) this.dirtyAt = performance.now();
        return done;
      },
      changed: () => {
        if (!this.dirtyAt) this.dirtyAt = performance.now();
      },
      notify: (text) => toast(text),
    };
  }

  // ---------- construction ----------

  private roadsChanged = false;

  // Pose une case de chemin pendant un glissement ; le message d'erreur n'apparaît que sur la première case.
  private paintRoad(c: Pos, cx: number, cy: number, first: boolean) {
    const r = placeRoad(this.save, c.gx, c.gy);
    if (r === "ok") {
      this.roadsChanged = true;
      clearBerries(this.save, c.gx, c.gy, 1, 1); // un arbuste à baies sous le chemin disparaît
    }
    else if (first && r !== "already") this.floatText(cx, cy, BUILD_MESSAGES[r]);
  }

  private buildTap(wx: number, wy: number, cx: number, cy: number) {
    const sel = this.build.selected;
    if (!sel) return;
    const c = this.cellOf(wx, wy);
    if (!c) return;
    if (sel === ERASE) {
      const camp = campAt(this.save, c.gx, c.gy);
      const depot = depotAt(this.save, c.gx, c.gy);
      const site = siteAt(this.save, c.gx, c.gy);
      const house = houseAt(this.save, c.gx, c.gy);
      const mill = sawmillAt(this.save, c.gx, c.gy);
      const pit = wellAt(this.save, c.gx, c.gy);
      const hut = lodgeAt(this.save, c.gx, c.gy);
      const shop = butcherAt(this.save, c.gx, c.gy);
      const dock = portAt(this.save, c.gx, c.gy);
      const taverne = tavernAt(this.save, c.gx, c.gy);
      const cale = shipyardAt(this.save, c.gx, c.gy);
      const halle = marketAt(this.save, c.gx, c.gy);
      const truie = pigpenAt(this.save, c.gx, c.gy);
      const etable = stableAt(this.save, c.gx, c.gy);
      const fermette = farmAt(this.save, c.gx, c.gy);
      const minster = churchAt(this.save, c.gx, c.gy);
      const infirm = clinicAt(this.save, c.gx, c.gy);
      const hive = apiaryAt(this.save, c.gx, c.gy);
      if (taverne) {
        removeTavern(this.save, taverne);
        if (this.tavernSel === taverne) this.tavernSel = null;
      } else if (cale) {
        removeShipyard(this.save, cale);
        if (this.shipSel === cale) this.shipSel = null;
      } else if (halle) {
        removeMarket(this.save, halle);
        if (this.marketSel === halle) this.marketSel = null;
      } else if (truie) {
        removePigpen(this.save, truie);
        if (this.pigpenSel === truie) this.pigpenSel = null;
      } else if (etable) {
        removeStable(this.save, etable);
        if (this.stableSel === etable) this.stableSel = null;
      } else if (fermette) {
        removeFarm(this.save, fermette);
        if (this.farmSel === fermette) this.farmSel = null;
      } else if (minster) {
        removeChurch(this.save, minster);
        if (this.churchSel === minster) this.churchSel = null;
      } else if (infirm) {
        removeClinic(this.save, infirm);
        if (this.clinicSel === infirm) this.clinicSel = null;
      } else if (hive) {
        removeApiary(this.save, hive);
        if (this.apiarySel === hive) this.apiarySel = null;
      } else if (dock) {
        removePort(this.save, dock);
        if (this.portSel === dock) this.portSel = null;
      } else if (shop) {
        removeButcher(this.save, shop);
        if (this.butcherSel === shop) this.butcherSel = null;
      } else if (hut) {
        removeLodge(this.save, hut);
        if (this.lodgeSel === hut) this.lodgeSel = null;
      } else if (pit) {
        removeWell(this.save, pit);
        if (this.wellSel === pit) this.wellSel = null;
      } else if (mill) {
        removeSawmill(this.save, mill);
        if (this.sawmillSel === mill) this.sawmillSel = null;
      } else if (house) {
        removeHouse(this.save, house);
        if (this.houseSel === house) this.houseSel = null;
        for (const w of this.workers) if (w.data.home === null) w.data.inside = false;
      } else if (site) {
        removeSite(this.save, site);
        if (this.siteSel === site) this.siteSel = null;
      } else if (camp) {
        removeCamp(this.save, camp);
        if (this.campSel === camp) this.campSel = null;
      } else if (depot) {
        removeDepot(this.save, depot);
        if (this.depotSel === depot) this.depotSel = null;
      } else if (!removeRoad(this.save, c.gx, c.gy)) return;
      persist(this.save);
      return;
    }
    const kind = STRUCTURES[sel].kind;
    const r =
      kind === "camp" ? placeCamp(this.save, c.gx, c.gy, false, this.buildRot) : kind === "depot" ? placeDepot(this.save, c.gx, c.gy, false, this.buildRot) : kind === "house" ? placeHouse(this.save, c.gx, c.gy, false, this.buildRot) : kind === "sawmill" ? placeSawmill(this.save, c.gx, c.gy, false, this.buildRot) : kind === "well" ? placeWell(this.save, c.gx, c.gy, false, this.buildRot) : kind === "lodge" ? placeLodge(this.save, c.gx, c.gy, false, this.buildRot) : kind === "butcher" ? placeButcher(this.save, c.gx, c.gy, false, this.buildRot) : kind === "port" ? placePort(this.save, c.gx, c.gy) : kind === "apiary" ? placeApiary(this.save, c.gx, c.gy, false, this.buildRot) : kind === "clinic" ? placeClinic(this.save, c.gx, c.gy, false, this.buildRot) : kind === "church" ? placeChurch(this.save, c.gx, c.gy, false, this.buildRot) : kind === "farm" ? placeFarm(this.save, c.gx, c.gy, false, this.buildRot) : kind === "stable" ? placeStable(this.save, c.gx, c.gy, false, this.buildRot) : kind === "pigpen" ? placePigpen(this.save, c.gx, c.gy, false, this.buildRot) : kind === "market" ? placeMarket(this.save, c.gx, c.gy, false, this.buildRot) : kind === "tavern" ? placeTavern(this.save, c.gx, c.gy, false, this.buildRot) : kind === "pantry" ? placePantry(this.save, c.gx, c.gy, false, this.buildRot) : kind === "shipyard" ? placeShipyard(this.save, ...((p) => [p.gx, p.gy] as [number, number])(shipyardSpot(this.save, c.gx, c.gy) ?? c)) : placeRoad(this.save, c.gx, c.gy);
    if (r === "ok") {
      if (sel !== ERASE) clearBerries(this.save, c.gx, c.gy, STRUCTURES[sel].size, STRUCTURES[sel].size, STRUCTURES[sel].kind === "road" ? 0 : 1); // un arbuste à baies sur l'emplacement (ou devant l'entrée) disparaît
      persist(this.save);
    }
    else if (r !== "already") this.floatText(cx, cy, kind === "shipyard" && r === "terrain" ? "Il faut une côte dégagée : 6 × 6 cases d'herbe ou de sable, sans arbre, avec de l'eau le long d'un côté." : BUILD_MESSAGES[r]);
  }

  private floatText(x: number, y: number, text: string) {
    const d = document.createElement("div");
    d.className = "float";
    d.textContent = text;
    d.style.left = `${x}px`;
    d.style.top = `${y}px`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 950);
  }

  // ---------- boucle ----------

  private frame(t: number) {
    const now = Date.now();
    const dt = this.paused ? 0 : Math.min(0.1, (t - this.lastT) / 1000 || 0); // en pause, plus rien n'avance
    this.lastT = t;
    for (const got of tickDismantle(this.save, dt * this.timeScale)) {
      const parts = [got.coins ? `+${got.coins} pièces` : "", got.wood ? `+${got.wood} 🪵` : "", got.planks ? `+${got.planks} planches` : ""].filter(Boolean).join(", ");
      toast(parts ? `Démonté : ${parts}.` : "Démonté.");
      persist(this.save);
    }
    const season = this.season().rules; // la saison règle les rythmes de ce qui suit
    let moved = tickSawmills(this.save, dt * this.timeScale, (id) => this.staffAt("sawmill", id));
    moved = tickWells(this.save, dt * this.timeScale * season.well) || moved;
    moved = tickButchers(this.save, dt * this.timeScale, (id) => this.staffAt("butcher", id)) || moved;
    moved = tickApiaries(this.save, dt * this.timeScale, season.honey, season.hive) || moved;
    if (season.ships === 0) for (const m of this.save.ports) m.t = 0; // mer gelée : le prochain bateau repartira du début
    for (const sale of tickPorts(this.save, dt * this.timeScale * season.ships)) {
      const p = this.toClient((sale.port.gx + 1.5) * C, sale.port.gy * C);
      this.floatText(p.x, p.y, `+${sale.coins} 🪙 export`);
      persist(this.save);
    }
    if (tickFarms(this.save, dt * this.timeScale, this.season().index) && !this.dirtyAt) this.dirtyAt = performance.now();
    tickStables(this.save, dt * this.timeScale, this.season().index);
    tickPigpens(this.save, dt * this.timeScale);
    this.pantryT -= dt;
    if (this.pantryT <= 0) {
      this.pantryT = 1;
      if (consolidateFood(this.save)) persist(this.save); // la nourriture des dépôts est rangée au garde-manger
    }
    if (this.portOpen && performance.now() - this.portRefresh > 1000) {
      this.portRefresh = performance.now();
      this.renderPort(); // les stocks et le décompte du bateau se mettent à jour
    }
    this.checkGoals(dt);
    for (const ev of tickMarkets(this.save, dt * this.timeScale)) {
      toast(ev.arrived ? "🛒 Une caravane de marchands est arrivée au marché !" : "🛒 La caravane a quitté le marché.");
      persist(this.save);
    }
    tickCorpses(this.save, dt * this.timeScale);
    for (const ev of tickAging(this.save, dt * this.timeScale)) this.onAge(ev);
    for (const ev of tickHealth(this.save, dt * this.timeScale, this.season().rules.id === "winter")) this.onHealth(ev);
    moved = tickThirst(this.save, dt * this.timeScale * season.water) || moved;
    moved = tickHunger(this.save, dt * this.timeScale * season.food) || moved;
    if (moved && !this.dirtyAt) this.dirtyAt = performance.now();
    this.save.clock += dt * this.timeScale;
    this.save.grow += dt * this.timeScale * 1000 * season.regrow; // les arbres repoussent plus vite au printemps, plus du tout en hiver
    const step = Math.floor(this.save.clock / 5);
    if (step !== this.clockStep) {
      this.clockStep = step;
      if (!this.dirtyAt) this.dirtyAt = performance.now();
    }
    this.updateArrivals(dt * this.timeScale);
    for (const ev of tickDiscontent(this.save, dt * this.timeScale)) this.onDiscontent(ev);
    for (const l of this.leavers) {
      l.t += dt * this.timeScale;
      l.w.update(dt * this.timeScale, this.env);
    }
    this.leavers = this.leavers.filter((l) => l.t < 9);
    this.errandT -= dt * this.timeScale;
    if (this.errandT <= 0) {
      this.errandT = 2;
      this.autoErrands();
      this.autoDining();
    }
    this.homeT -= dt;
    if (this.homeT <= 0) {
      this.homeT = 1;
      this.assignHomes();
      this.reconcileEmployment();
    }
    for (let i = 0; i < this.timeScale; i++) for (const w of this.workers) w.update(dt, this.env);
    const people = this.workers.filter((w) => !w.inside && w.role !== "hunt"); // les chasseurs, camouflés, ne font pas fuir le gibier
    if (!this.save.lost && this.workers.length === 0) this.lose(); // plus aucun villageois : la partie est perdue
    for (const a of this.animals) a.update(dt, this.save, people);
    if (this.animals.some((a) => a.dead)) this.animals = this.animals.filter((a) => !a.dead);
    this.popT -= dt;
    if (this.popT <= 0) {
      this.popT = REPOP_SEC / Math.max(0.1, season.repop);
      this.repopulate();
    }
    if (this.dirtyAt && performance.now() - this.dirtyAt > 1500) {
      this.dirtyAt = 0;
      persist(this.save);
    }
    if (this.press?.moved) this.follow = false;
    const sel = this.selected;
    if (this.follow && sel) {
      const k = Math.min(1, dt * 5);
      this.cam.x += (sel.x * C - this.cam.x) * k;
      this.cam.y += (sel.y * C - this.cam.y) * k;
      this.clampCam();
    }
    this.draw(now, t);
    this.drawMinimap();
    this.updateCrew();
    this.updateStructureMenu();
    this.updateWorkerMenu();
    this.ui.sync(this.save);
    this.updateHud();
    requestAnimationFrame((nt) => this.frame(nt));
  }

  // ---------- dessin ----------

  private draw(now: number, t: number) {
    const g = this.g;
    const z = this.cam.zoom;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.setTransform(this.dpr * z, 0, 0, this.dpr * z, this.dpr * (this.w / 2 - this.cam.x * z), this.dpr * (this.h / 2 - this.cam.y * z));
    const hw = this.w / 2 / z;
    const hh = this.h / 2 / z;
    const view = { x0: this.cam.x - hw, y0: this.cam.y - hh, x1: this.cam.x + hw, y1: this.cam.y + hh };
    const felledFn = (idx: number) => isFelled(this.save, idx, now);
    this.terrain.draw(g, view, z, { x: this.cam.x, y: this.cam.y });
    this.terrain.drawWater(g, view, z, t);

    // case visée par le pointeur
    const sel = this.build.selected;
    const selDef = sel && sel !== ERASE ? STRUCTURES[sel] : null;
    let pointerWorld: { x: number; y: number } | null = null;
    let hoverCell: Pos | null = null;
    if (this.mouse.inside && !this.press?.moved) {
      const w = this.toWorld(this.mouse.x, this.mouse.y);
      pointerWorld = w;
      hoverCell = this.cellOf(w.x, w.y);
    }
    this.showCellInfo(hoverCell, pointerWorld, felledFn);
    const tileHot = !this.zoneDrag && hoverCell && (!this.build.open || !!sel) ? hoverCell : null;

    // seules les cases visibles et labourées (ou survolées) se dessinent
    const gx0 = Math.max(0, Math.floor(view.x0 / C));
    const gx1 = Math.min(GRID - 1, Math.floor(view.x1 / C));
    const gy0 = Math.max(0, Math.floor(view.y0 / C));
    const gy1 = Math.min(GRID - 1, Math.floor(view.y1 / C));
    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const cell = this.save.cells[gy * GRID + gx];
        const hot = !!tileHot && tileHot.gx === gx && tileHot.gy === gy && !selDef;
        if (cell.kind !== "grass" || hot) drawTile(g, gx, gy, cell, now, hot, sel === ERASE, canBuild(this.save, gx, gy));
      }
    }
    // en construction, une grille discrète apparaît autour du pointeur
    if (this.build.open && hoverCell) {
      g.strokeStyle = "rgba(255,255,255,0.22)";
      g.lineWidth = 1;
      g.beginPath();
      for (let d = -5; d <= 6; d++) {
        const a = (hoverCell.gx + d) * C;
        const b = (hoverCell.gy + d) * C;
        g.moveTo(a, (hoverCell.gy - 5) * C);
        g.lineTo(a, (hoverCell.gy + 6) * C);
        g.moveTo((hoverCell.gx - 5) * C, b);
        g.lineTo((hoverCell.gx + 6) * C, b);
      }
      g.stroke();
    }

    // les portes de tous les bâtiments (le chemin s'y prolonge toujours d'une case de terre battue)
    const sv0 = this.save;
    const doors: [number, number, number][] = [];
    if (isViking()) {
      const add = (e: Pos, rot = 0) => doors.push([e.gx, e.gy, rot]);
      for (const m of sv0.camps) add(campEntrance(m), m.rot);
      for (const m of sv0.depots) add(depotEntrance(m), m.rot);
      for (const m of sv0.houses) add(houseEntrance(m), m.rot);
      for (const m of sv0.sawmills) add(sawmillEntrance(m), m.rot);
      for (const m of sv0.wells) add(wellEntrance(m), m.rot);
      for (const m of sv0.lodges) add(lodgeEntrance(m), m.rot);
      for (const m of sv0.butchers) add(butcherEntrance(m), m.rot);
      for (const m of sv0.ports) add(portEntrance(m), m.rot);
      for (const m of sv0.apiaries) add(apiaryEntrance(m), m.rot);
      for (const m of sv0.clinics) add(clinicEntrance(m), m.rot);
      for (const m of sv0.churches) add(churchEntrance(m), m.rot);
      for (const m of sv0.farms) add(farmEntrance(m), m.rot);
      for (const m of sv0.stables) add(stableEntrance(m), m.rot);
      for (const m of sv0.pigpens) add(pigpenEntrance(m), m.rot);
      for (const m of sv0.markets) add(marketEntrance(m), m.rot);
      for (const m of sv0.taverns) add(tavernEntrance(m), m.rot);
      for (const m of sv0.shipyards) add(shipyardEntrance(m), m.rot);
    }
    drawRoads(g, this.save.roads, GRID, view, doors);
    for (const d of this.save.depots) drawDepot(g, d.gx, d.gy, d.rot, depotLevel(d), !!d.pantry);
    for (const c of this.save.camps) drawCamp(g, c.gx, c.gy, c.rot);
    for (const m of this.save.apiaries) drawApiary(g, m.gx, m.gy, apiaryBusy(m, this.season().rules.honey), t, m.rot);
    for (const m of this.save.clinics) drawClinic(g, m.gx, m.gy, m.rot, this.workers.some((w) => w.brewing && w.data.job?.type === "heal" && w.data.job.clinicId === m.id), t);
    for (const m of this.save.churches) drawChurch(g, m.gx, m.gy, m.rot, m.graves.length);
    for (const m of this.save.taverns) drawTavern(g, m.gx, m.gy, m.rot, this.workers.some((w) => w.cooking && w.data.job?.type === "cook" && w.data.job.tavernId === m.id), t);
    for (const m of this.save.shipyards) drawShipyard(g, m.gx, m.gy, m.rot, m.stage, t);
    for (const m of this.save.markets) {
      drawMarket(g, m.gx, m.gy, m.rot, m.here, t);
      // la caravane arrive par la gauche, s'installe à côté du marché, puis repart par la droite
      if (m.here) {
        const elapsed = MARKET_STAY_SEC - m.clock;
        const inT = Math.min(1, elapsed / 7);
        const outT = Math.min(1, m.clock / 7);
        const off = inT < 1 ? -(1 - inT) * 10 : outT < 1 ? (1 - outT) * 10 : 0;
        const wobble = inT < 1 || outT < 1;
        g.save();
        const cx = (m.gx - 2.2) * C + off * C;
        drawCaravan(g, cx, (m.gy + 1.5) * C, t, wobble);
        g.restore();
      }
    }
    for (const m of this.save.pigpens) drawPigpen(g, m.gx, m.gy, m.rot, m.pigs, t, m.feed / PIG_FEED_CAP, m.water / PIG_WATER_CAP);
    for (const m of this.save.stables) drawStable(g, m.gx, m.gy, m.rot, m.cows, t, m.feed / STABLE_FEED_CAP, m.water / STABLE_WATER_CAP);
    for (const m of this.save.farms) drawFarm(g, m.gx, m.gy, m.rot, m.plots, t, m.water / FARM_TANK_CAP);
    for (const c of this.save.corpses) drawCorpse(g, c.x, c.y, CREW_COLORS[c.color % CREW_COLORS.length]);
    for (const m of this.save.ports) drawPort(g, m.gx, m.gy, m.rot);
    for (const m of this.save.ports) drawShip(g, m, t);
    for (const m of this.save.butchers) drawButcher(g, m.gx, m.gy, butcherWorking(m) && this.staffAt("butcher", m.id) > 0, t, m.rot);
    for (const m of this.save.lodges) drawLodge(g, m.gx, m.gy, m.rot);
    for (const m of this.save.wells) drawWell(g, m.gx, m.gy, m.rot);
    for (const m of this.save.sawmills) drawSawmill(g, m.gx, m.gy, sawmillWorking(m) && this.staffAt("sawmill", m.id) > 0, t, m.rot);
    for (const h of this.save.houses) drawHouse(g, h.gx, h.gy, this.workers.some((w) => w.inside && w.data.home === h.id), t, h.rot);
    if (isViking()) {
      // boucliers, bannières, têtes de dragon et pierres runiques sur les bâtiments
      const sv = this.save;
      const deco = (kind: Parameters<typeof drawVikingDeco>[1], list: { gx: number; gy: number }[], size: number) => {
        for (const m of list) drawVikingDeco(g, kind, m.gx, m.gy, size, t);
      };
    }
    // une maison sans eau : une goutte dessinée (pas un emoji) posée sur le toit, dont l'opacité oscille entre 90 et 100 %
    for (const h of this.save.houses) {
      if (!houseThirsty(h) || !this.workers.some((w) => w.data.home === h.id)) continue;
      const a = 0.85 + 0.15 * Math.sin(t / 110);
      const angry = this.workers.some((w) => w.data.home === h.id && (w.data.discontent ?? 0) >= 50);
      const cx = (h.gx + 1) * C - (angry ? 22 : 0); // à côté du visage s'il y en a un
      const cy = (h.gy + 1) * C + 4;
      const r = 12;
      g.beginPath();
      g.moveTo(cx, cy - r * 2.1);
      g.bezierCurveTo(cx + r * 0.3, cy - r * 1.3, cx + r, cy - r * 0.6, cx + r, cy);
      g.arc(cx, cy, r, 0, Math.PI, false);
      g.bezierCurveTo(cx - r, cy - r * 0.6, cx - r * 0.3, cy - r * 1.3, cx, cy - r * 2.1);
      g.closePath();
      g.fillStyle = `rgba(47,150,240,${a})`;
      g.fill();
      g.strokeStyle = `rgba(16,84,160,${a})`;
      g.lineWidth = 2.5;
      g.lineJoin = "round";
      g.stroke();
      g.fillStyle = `rgba(255,255,255,${a * 0.75})`;
      g.beginPath();
      g.ellipse(cx - r * 0.38, cy - r * 0.15, r * 0.2, r * 0.38, 0.35, 0, Math.PI * 2);
      g.fill();
    }
    // quarantaine : un panneau sur la maison
    for (const h of this.save.houses) {
      if (!h.quarantine) continue;
      g.font = "34px sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("🚧", (h.gx + 1.5) * C, (h.gy + 1.55) * C);
      g.textBaseline = "alphabetic";
    }
    // un habitant malade : une croix verte sur le toit (à gauche, pour ne pas cacher la goutte ni la mine renfrognée)
    for (const h of this.save.houses) {
      const sick = this.workers.filter((w) => w.data.home === h.id && w.data.illness);
      if (!sick.length) continue;
      const bad = sick.some((w) => (w.data.illness?.sev ?? 0) >= SICK_BED);
      const a = 0.88 + 0.12 * Math.sin(t / 150);
      const cx = (h.gx + 0.55) * C;
      const cy = (h.gy + 0.6) * C;
      g.fillStyle = `rgba(255,255,255,${a})`;
      g.beginPath();
      g.arc(cx, cy, 15, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = bad ? `rgba(200,50,50,${a})` : `rgba(62,130,87,${a})`;
      g.lineWidth = 3;
      g.stroke();
      g.fillStyle = bad ? "#c83232" : "#3e8257";
      g.fillRect(cx - 3.5, cy - 9, 7, 18);
      g.fillRect(cx - 9, cy - 3.5, 18, 7);
    }
    // des habitants mécontents : une mine renfrognée, au centre du toit comme la goutte (qui se pousse sur le côté s'il y en a une)
    for (const h of this.save.houses) {
      if (!this.workers.some((w) => w.data.home === h.id && (w.data.discontent ?? 0) >= 50)) continue;
      const thirsty = houseThirsty(h);
      g.font = "36px sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("😠", (h.gx + 1) * C + (thirsty ? 22 : 0), (h.gy + 1) * C + 2);
      g.textBaseline = "alphabetic";
    }
    for (const k of this.save.sites) drawSite(g, k.kind, k.gx, k.gy, k.have, k.need, k.progress, t, k.rot, !!k.undo, k.mat === "plank");
    // un dépôt plein : une pastille rouge sur le toit
    for (const d of this.save.depots) {
      if (depotFree(d) > 0) continue;
      const a = 0.85 + 0.15 * Math.sin(t / 130);
      const cx = (d.gx + 1.5) * C;
      const cy = (d.gy + 1.1) * C;
      g.fillStyle = `rgba(214,57,48,${a})`;
      g.beginPath();
      g.arc(cx, cy, 20, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = `rgba(255,255,255,${a})`;
      g.lineWidth = 3;
      g.stroke();
      g.fillStyle = "#fff";
      g.font = "bold 26px sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("!", cx, cy + 1);
      g.textBaseline = "alphabetic";
    }
    this.drawEntrances(g, t);
    if (z >= 0.3) for (const a of this.animals) a.draw(g, view);
    this.drawCrew(g, t);
    this.terrain.drawTrees(g, view, z, felledFn, (idx) => isPicked(this.save, idx), (idx) => isBerryGone(this.save, idx));
    this.drawSeason(g, view, t);
    this.drawNight(g, view, t);
    this.drawSelections(g);
    this.drawSplashes(g, t);
    if (this.build.open && selDef && hoverCell) this.drawGhost(g, selDef.kind, hoverCell, selDef.cost);
  }

  // La saison en cours, d'après l'horloge de jeu.
  private season() {
    return seasonAt(this.save.clock);
  }

  // Les saisons : une teinte sur le monde (qui glisse vers celle de la saison suivante à la fin), de la neige qui blanchit l'herbe
  // à l'approche de l'hiver, et des particules qui tombent : pétales, feuilles mortes, flocons.
  private drawSeason(g: CanvasRenderingContext2D, view: { x0: number; y0: number; x1: number; y1: number }, t: number) {
    const se = this.season();
    const smooth = (x: number) => x * x * (3 - 2 * x);
    const blend = smooth(Math.max(0, Math.min(1, (se.prog - 0.75) / 0.25)));
    const c = se.rules.tint.map((v, i) => v + (se.next.tint[i] - v) * blend);
    const w = view.x1 - view.x0;
    const h = view.y1 - view.y0;
    if (c[0] < 254 || c[1] < 254 || c[2] < 254) {
      g.save();
      g.globalCompositeOperation = "multiply";
      g.fillStyle = `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
      g.fillRect(view.x0 - C, view.y0 - C, w + 2 * C, h + 2 * C);
      g.restore();
    }
    // neige au sol : elle arrive à la fin de l'automne, et fond à la fin de l'hiver
    const snow = se.rules.id === "winter" ? 1 - blend : se.rules.id === "autumn" ? blend : 0;
    if (snow > 0.01) {
      g.save();
      g.globalCompositeOperation = "screen";
      g.fillStyle = `rgba(232,240,255,${0.4 * snow})`;
      g.fillRect(view.x0 - C, view.y0 - C, w + 2 * C, h + 2 * C);
      g.restore();
    }
    // particules : pétales (printemps), feuilles (automne), flocons (hiver et fin d'automne)
    const kind = snow > 0.3 ? "snow" : se.rules.id === "autumn" ? "leaf" : null;
    if (!kind) return;
    const z = this.cam.zoom;
    const count = kind === "snow" ? 90 : 45;
    const speed = kind === "snow" ? 0.1 : kind === "leaf" ? 0.07 : 0.05; // vues par seconde
    g.save();
    for (let i = 0; i < count; i++) {
      const rx = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const ry = (Math.sin(i * 78.233) * 12345.6789) % 1;
      const px = (rx + 1) % 1;
      const py = (ry + 1) % 1;
      const fall = (py + (t / 1000) * speed * (0.7 + (i % 5) * 0.12)) % 1;
      const sway = Math.sin(t / 600 + i) * (kind === "snow" ? 0.012 : 0.03);
      const x = view.x0 + (((px + sway + (kind === "leaf" ? fall * 0.15 : 0)) % 1) + 1) % 1 * w;
      const y = view.y0 + fall * h;
      const size = (kind === "snow" ? 2.6 + (i % 3) : 4.5) / z;
      g.globalAlpha = kind === "snow" ? 0.85 : 0.9;
      if (kind === "snow") {
        g.fillStyle = "#ffffff";
        g.beginPath();
        g.arc(x, y, size, 0, Math.PI * 2);
        g.fill();
      } else {
        g.fillStyle = ["#d9822b", "#b5502a", "#e0a63a", "#9a6a2a"][i % 4];
        g.beginPath();
        g.ellipse(x, y, size * 1.5, size * 0.8, t / 400 + i, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
  }

  // La nuit : un voile bleu sombre sur tout le monde (rosé à l'aube et au crépuscule), puis des lueurs chaudes aux fenêtres
  // des maisons habitées, aux feux des camps et aux fenêtres des usines qui tournent.
  private drawNight(g: CanvasRenderingContext2D, view: { x0: number; y0: number; x1: number; y1: number }, t: number) {
    const d = darkness(clockHour(this.save.clock));
    if (d < 0.01) return;
    const warm = Math.min(d, 1 - d) * 2; // 1 au milieu de l'aube ou du crépuscule
    const rr = 255 - (255 - 78) * d;
    const gg = 255 - (255 - 92) * d - 22 * warm;
    const bb = 255 - (255 - 150) * d - 45 * warm;
    g.save();
    g.globalCompositeOperation = "multiply";
    g.fillStyle = `rgb(${Math.round(rr)},${Math.round(gg)},${Math.round(bb)})`;
    g.fillRect(view.x0 - C, view.y0 - C, view.x1 - view.x0 + 2 * C, view.y1 - view.y0 + 2 * C);
    g.restore();
    if (d < 0.2) return;
    // lueurs : de la lumière ajoutée, d'autant plus visible qu'il fait noir
    g.save();
    g.globalCompositeOperation = "lighter";
    const glow = (cx: number, cy: number, radius: number, power: number, seed: number, rgb = "255,185,90") => {
      if (cx < view.x0 - radius || cx > view.x1 + radius || cy < view.y0 - radius || cy > view.y1 + radius) return;
      const flick = 0.88 + 0.12 * Math.sin(t / 140 + seed * 1.7) * Math.sin(t / 97 + seed);
      const a = power * d * flick;
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `rgba(${rgb},${a})`);
      grad.addColorStop(0.45, `rgba(${rgb},${a * 0.45})`);
      grad.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = grad;
      g.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    };
    const s = this.save;
    for (const h of s.houses) if (this.workers.some((w) => w.data.home === h.id)) glow((h.gx + 1) * C, (h.gy + 1) * C, 2.3 * C, 0.5, h.id);
    for (const c of s.camps) glow((c.gx + 0.7) * C, (c.gy + 0.9) * C, 2.1 * C, 0.65, c.id + 20, "255,150,60");
    for (const m of s.lodges) glow((m.gx + 0.7) * C, (m.gy + 0.9) * C, 2 * C, 0.5, m.id + 40, "255,150,60");
    for (const m of s.sawmills) if (sawmillWorking(m) && this.staffAt("sawmill", m.id) > 0) glow((m.gx + 1.5) * C, (m.gy + 1.5) * C, 2.6 * C, 0.4, m.id + 60);
    for (const m of s.butchers) if (butcherWorking(m) && this.staffAt("butcher", m.id) > 0) glow((m.gx + 1.5) * C, (m.gy + 1.5) * C, 2.6 * C, 0.4, m.id + 80);
    for (const m of s.depots) glow((m.gx + 1.5) * C, (m.gy + 1.5) * C, 1.8 * C, 0.25, m.id + 100);
    for (const m of s.ports) glow((m.gx + 1.5) * C, (m.gy + 1.5) * C, 2.4 * C, 0.4, m.id + 120, "255,215,130");
    g.restore();
  }

  // Aperçu de la structure qu'on s'apprête à poser, rouge si c'est impossible.
  private drawGhost(g: CanvasRenderingContext2D, kind: "camp" | "depot" | "road" | "house" | "sawmill" | "well" | "lodge" | "butcher" | "port" | "apiary" | "clinic" | "church" | "farm" | "stable" | "pigpen" | "market" | "shipyard" | "tavern" | "pantry", at: Pos, cost: number) {
    const s = this.save;
    if (kind === "shipyard") at = shipyardSpot(s, at.gx, at.gy) ?? at; // le plan se cale tout seul sur la côte la plus proche
    const size = kind === "pantry" || kind === "tavern" ? 3 : kind === "shipyard" ? SHIPYARD_SIZE : kind === "market" ? 3 : kind === "stable" || kind === "pigpen" ? STABLE_SIZE : kind === "farm" ? FARM_SIZE : kind === "camp" || kind === "house" || kind === "well" || kind === "lodge" || kind === "apiary" || kind === "clinic" ? 2 : kind === "depot" || kind === "sawmill" || kind === "butcher" || kind === "port" || kind === "church" ? 3 : 1;
    const affordable = s.coins >= cost;
    const ok = affordable && (kind === "camp" ? canPlaceCamp(s, at.gx, at.gy, this.buildRot) : kind === "depot" ? canPlaceDepot(s, at.gx, at.gy, this.buildRot) : kind === "house" ? canPlaceHouse(s, at.gx, at.gy, this.buildRot) : kind === "sawmill" ? canPlaceSawmill(s, at.gx, at.gy, this.buildRot) : kind === "well" ? canPlaceWell(s, at.gx, at.gy, this.buildRot) : kind === "lodge" ? canPlaceLodge(s, at.gx, at.gy, this.buildRot) : kind === "butcher" ? canPlaceButcher(s, at.gx, at.gy, this.buildRot) : kind === "port" ? canPlacePort(s, at.gx, at.gy) : kind === "apiary" ? canPlaceApiary(s, at.gx, at.gy, this.buildRot) : kind === "clinic" ? canPlaceClinic(s, at.gx, at.gy, this.buildRot) : kind === "church" ? canPlaceChurch(s, at.gx, at.gy, this.buildRot) : kind === "farm" ? canPlaceFarm(s, at.gx, at.gy, this.buildRot) : kind === "stable" ? canPlaceStable(s, at.gx, at.gy, this.buildRot) : kind === "pigpen" ? canPlacePigpen(s, at.gx, at.gy, this.buildRot) : kind === "market" ? canPlaceMarket(s, at.gx, at.gy, this.buildRot) : kind === "tavern" ? canPlaceTavern(s, at.gx, at.gy, this.buildRot) : kind === "pantry" ? canPlaceDepot(s, at.gx, at.gy, this.buildRot) : kind === "shipyard" ? canPlaceShipyard(s, at.gx, at.gy) : canPlaceRoad(s, at.gx, at.gy));
    this.drawNuisanceGhost(g, kind, at, size);
    g.globalAlpha = 0.65;
    if (kind === "camp") drawCamp(g, at.gx, at.gy, this.buildRot);
    else if (kind === "depot") drawDepot(g, at.gx, at.gy, this.buildRot);
    else if (kind === "pantry") drawDepot(g, at.gx, at.gy, this.buildRot, 1, true);
    else if (kind === "house") drawHouse(g, at.gx, at.gy, false, 0, this.buildRot);
    else if (kind === "sawmill") drawSawmill(g, at.gx, at.gy, false, 0, this.buildRot);
    else if (kind === "well") drawWell(g, at.gx, at.gy, this.buildRot);
    else if (kind === "lodge") drawLodge(g, at.gx, at.gy, this.buildRot);
    else if (kind === "butcher") drawButcher(g, at.gx, at.gy, false, 0, this.buildRot);
    else if (kind === "port") drawPort(g, at.gx, at.gy, Math.max(0, portRot(s, at.gx, at.gy)));
    else if (kind === "apiary") drawApiary(g, at.gx, at.gy, false, 0, this.buildRot);
    else if (kind === "clinic") drawClinic(g, at.gx, at.gy, this.buildRot);
    else if (kind === "church") drawChurch(g, at.gx, at.gy, this.buildRot);
    else if (kind === "farm") drawFarm(g, at.gx, at.gy, this.buildRot);
    else if (kind === "stable") drawStable(g, at.gx, at.gy, this.buildRot);
    else if (kind === "pigpen") drawPigpen(g, at.gx, at.gy, this.buildRot);
    else if (kind === "market") drawMarket(g, at.gx, at.gy, this.buildRot);
    else if (kind === "tavern") drawTavern(g, at.gx, at.gy, this.buildRot);
    else if (kind === "shipyard") drawShipyard(g, at.gx, at.gy, Math.max(0, shipyardRot(s, at.gx, at.gy)));
    else drawRoadCell(g, at.gx, at.gy);
    g.globalAlpha = 1;
    if (!ok) {
      g.fillStyle = "rgba(230,40,40,0.3)";
      g.fillRect(at.gx * C, at.gy * C, size * C, size * C);
    }
    // où sera l'entrée : c'est là qu'il faudra amener un chemin
    if (kind !== "road") {
      const spot = { gx: at.gx, gy: at.gy, rot: this.buildRot };
      const e = kind === "camp" ? campEntrance(spot) : kind === "house" ? houseEntrance(spot) : kind === "sawmill" ? sawmillEntrance(spot) : kind === "well" ? wellEntrance(spot) : kind === "lodge" ? lodgeEntrance(spot) : kind === "butcher" ? butcherEntrance(spot) : kind === "port" ? portEntrance({ ...spot, rot: Math.max(0, portRot(s, at.gx, at.gy)) }) : kind === "apiary" ? apiaryEntrance(spot) : kind === "clinic" ? clinicEntrance(spot) : kind === "church" ? churchEntrance(spot) : kind === "farm" ? farmEntrance(spot) : kind === "stable" ? stableEntrance(spot) : kind === "pigpen" ? pigpenEntrance(spot) : kind === "market" ? marketEntrance(spot) : kind === "tavern" ? tavernEntrance(spot) : kind === "shipyard" ? shipyardEntrance({ ...spot, rot: Math.max(0, shipyardRot(s, at.gx, at.gy)) }) : depotEntrance(spot);
      drawEntrance(g, e.gx, e.gy, roadAt(s, e.gx, e.gy), performance.now(), this.buildRot);
    }
  }

  // Cercle pointillé : jusqu'où ce bâtiment dérange. Les maisons concernées sont cerclées de rouge avec la gêne qu'elles subiraient.
  // Pour une maison qu'on envisage de poser, on montre son contentement d'après les nuisances alentour.
  private drawNuisanceGhost(g: CanvasRenderingContext2D, kind: string, at: Pos, size: number) {
    const s = this.save;
    const key: NuisanceKey | null = kind === "apiary" || kind === "sawmill" || kind === "port" || kind === "lodge" ? kind : null;
    const ring = (cx: number, cy: number, radius: number) => {
      g.save();
      g.beginPath();
      g.arc(cx * C, cy * C, radius * C, 0, Math.PI * 2);
      g.fillStyle = "rgba(220,60,60,0.07)";
      g.fill();
      g.strokeStyle = "rgba(220,60,60,0.65)";
      g.lineWidth = 3;
      g.setLineDash([10, 9]);
      g.lineDashOffset = -performance.now() / 60;
      g.stroke();
      g.restore();
    };
    const tag = (text: string, x: number, y: number, color: string) => {
      g.save();
      g.font = "bold 20px 'Trebuchet MS', sans-serif";
      g.textAlign = "center";
      g.lineWidth = 5;
      g.strokeStyle = "#4a3b2a";
      g.fillStyle = color;
      g.strokeText(text, x, y);
      g.fillText(text, x, y);
      g.restore();
    };
    if (key) {
      const cx = at.gx + size / 2;
      const cy = at.gy + size / 2;
      const n = MOOD.nuisance[key];
      ring(cx, cy, n.radius);
      for (const h of housesNear(s, cx, cy, n.radius)) {
        const pen = nuisancePen(key, Math.hypot(h.gx + 1 - cx, h.gy + 1 - cy));
        g.save();
        g.strokeStyle = "rgba(220,60,60,0.9)";
        g.lineWidth = 4;
        g.strokeRect(h.gx * C - 3, h.gy * C - 3, 2 * C + 6, 2 * C + 6);
        g.restore();
        if (pen > 0) tag(`−${pen}`, (h.gx + 1) * C, h.gy * C - 8, "#ffb3a8");
      }
    } else if (kind === "house") {
      for (const src of nuisanceSources(s)) ring(src.x, src.y, MOOD.nuisance[src.key].radius);
      const m = moodAt(s, at.gx + 1, at.gy + 1);
      tag(`${m.mood < MOOD.grumpyBelow ? "😠" : m.mood < 75 ? "😐" : "😊"} ${m.mood} %`, (at.gx + 1) * C, at.gy * C - 10, m.mood < MOOD.grumpyBelow ? "#ffb3a8" : m.mood < 75 ? "#ffe9a0" : "#c8f2b0");
    }
  }

  private drawCrew(g: CanvasRenderingContext2D, t: number) {
    const dest = this.selected?.destination;
    if (dest) {
      const pulse = 0.5 + 0.5 * Math.sin(t / 180);
      g.strokeStyle = `rgba(255,255,255,${0.6 + 0.4 * pulse})`;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(dest[0] * C, dest[1] * C, C * (0.2 + 0.08 * pulse), 0, Math.PI * 2);
      g.stroke();
    }
    for (const w of [...this.workers].filter((o) => !o.inside && !o.crafting && !o.brewing && !o.cooking).sort((a, b) => a.y - b.y)) w.draw(g, w === this.selected, t);
    for (const l of this.leavers) {
      g.globalAlpha = l.t < 5 ? 1 : Math.max(0, 1 - (l.t - 5) / 4); // il s'efface dans le lointain
      l.w.draw(g, false, t);
      g.globalAlpha = 1;
    }
  }

  // Repères d'entrée : visibles en construction et pour le camp ou le dépôt sélectionné.
  private drawEntrances(g: CanvasRenderingContext2D, t: number) {
    const s = this.save;
    const show = (e: Pos, rot = 0) => drawEntrance(g, e.gx, e.gy, roadAt(s, e.gx, e.gy), t, rot);
    if (this.build.open) {
      for (const c of s.camps) show(campEntrance(c), c.rot);
      for (const d of s.depots) show(depotEntrance(d), d.rot);
      for (const k of s.sites) show(siteEntrance(k), k.rot);
      for (const h of s.houses) show(houseEntrance(h), h.rot);
      for (const m of s.sawmills) show(sawmillEntrance(m), m.rot);
      for (const m of s.wells) show(wellEntrance(m), m.rot);
      for (const m of s.lodges) show(lodgeEntrance(m), m.rot);
      for (const m of s.butchers) show(butcherEntrance(m), m.rot);
      for (const m of s.ports) show(portEntrance(m), m.rot);
      for (const m of s.apiaries) show(apiaryEntrance(m), m.rot);
      for (const m of s.clinics) show(clinicEntrance(m), m.rot);
      for (const m of s.churches) show(churchEntrance(m), m.rot);
      for (const m of s.farms) show(farmEntrance(m), m.rot);
      for (const m of s.stables) show(stableEntrance(m), m.rot);
      for (const m of s.pigpens) show(pigpenEntrance(m), m.rot);
      for (const m of s.markets) show(marketEntrance(m), m.rot);
      for (const m of s.taverns) show(tavernEntrance(m), m.rot);
      for (const m of s.shipyards) show(shipyardEntrance(m), m.rot);
    } else {
      if (this.apiarySel) show(apiaryEntrance(this.apiarySel), this.apiarySel.rot);
      if (this.clinicSel) show(clinicEntrance(this.clinicSel), this.clinicSel.rot);
      if (this.churchSel) show(churchEntrance(this.churchSel), this.churchSel.rot);
      if (this.farmSel) show(farmEntrance(this.farmSel), this.farmSel.rot);
      if (this.stableSel) show(stableEntrance(this.stableSel), this.stableSel.rot);
      if (this.pigpenSel) show(pigpenEntrance(this.pigpenSel), this.pigpenSel.rot);
      if (this.marketSel) show(marketEntrance(this.marketSel), this.marketSel.rot);
      if (this.tavernSel) show(tavernEntrance(this.tavernSel), this.tavernSel.rot);
      if (this.shipSel) show(shipyardEntrance(this.shipSel), this.shipSel.rot);
      if (this.portSel) show(portEntrance(this.portSel), this.portSel.rot);
      if (this.butcherSel) show(butcherEntrance(this.butcherSel), this.butcherSel.rot);
      if (this.lodgeSel) show(lodgeEntrance(this.lodgeSel), this.lodgeSel.rot);
      if (this.wellSel) show(wellEntrance(this.wellSel), this.wellSel.rot);
      if (this.sawmillSel) show(sawmillEntrance(this.sawmillSel), this.sawmillSel.rot);
      if (this.houseSel) show(houseEntrance(this.houseSel), this.houseSel.rot);
      if (this.siteSel) show(siteEntrance(this.siteSel), this.siteSel.rot);
      if (this.campSel) show(campEntrance(this.campSel), this.campSel.rot);
      if (this.depotSel) show(depotEntrance(this.depotSel), this.depotSel.rot);
    }
  }

  // Cadres de sélection et zone en cours de tracé.
  private drawSelections(g: CanvasRenderingContext2D) {
    const outline = () => {
      g.fillStyle = "rgba(255,214,64,0.1)";
      g.fill();
      g.strokeStyle = "rgba(255,200,40,0.95)";
      g.lineWidth = 3;
      g.setLineDash([14, 10]);
      g.lineDashOffset = -performance.now() / 45; // les tirets défilent doucement
      g.stroke();
      g.setLineDash([]);
      g.lineDashOffset = 0;
    };
    if (this.depotSel) {
      g.beginPath();
      g.rect(this.depotSel.gx * C - 4, this.depotSel.gy * C - 4, 3 * C + 8, 3 * C + 8);
      outline();
    }
    if (this.apiarySel) {
      g.beginPath();
      g.rect(this.apiarySel.gx * C - 4, this.apiarySel.gy * C - 4, 2 * C + 8, 2 * C + 8);
      outline();
      this.drawNuisanceGhost(g, "apiary", this.apiarySel, 2);
    }
    if (this.tavernSel) {
      g.beginPath();
      g.rect(this.tavernSel.gx * C - 4, this.tavernSel.gy * C - 4, 3 * C + 8, 3 * C + 8);
      outline();
    }
    if (this.shipSel) {
      g.beginPath();
      g.rect(this.shipSel.gx * C - 4, this.shipSel.gy * C - 4, SHIPYARD_SIZE * C + 8, SHIPYARD_SIZE * C + 8);
      outline();
    }
    if (this.marketSel) {
      g.beginPath();
      g.rect(this.marketSel.gx * C - 4, this.marketSel.gy * C - 4, 3 * C + 8, 3 * C + 8);
      outline();
    }
    if (this.pigpenSel) {
      g.beginPath();
      g.rect(this.pigpenSel.gx * C - 4, this.pigpenSel.gy * C - 4, PIGPEN_SIZE * C + 8, PIGPEN_SIZE * C + 8);
      outline();
    }
    if (this.stableSel) {
      g.beginPath();
      g.rect(this.stableSel.gx * C - 4, this.stableSel.gy * C - 4, STABLE_SIZE * C + 8, STABLE_SIZE * C + 8);
      outline();
    }
    if (this.farmSel) {
      g.beginPath();
      g.rect(this.farmSel.gx * C - 4, this.farmSel.gy * C - 4, FARM_SIZE * C + 8, FARM_SIZE * C + 8);
      outline();
    }
    if (this.churchSel) {
      g.beginPath();
      g.rect(this.churchSel.gx * C - 4, this.churchSel.gy * C - 4, 3 * C + 8, 3 * C + 8);
      outline();
    }
    if (this.clinicSel) {
      g.beginPath();
      g.rect(this.clinicSel.gx * C - 4, this.clinicSel.gy * C - 4, 2 * C + 8, 2 * C + 8);
      outline();
    }
    if (this.sawmillSel) this.drawNuisanceGhost(g, "sawmill", this.sawmillSel, 3);
    if (this.portSel) this.drawNuisanceGhost(g, "port", this.portSel, 3);
    if (this.lodgeSel) this.drawNuisanceGhost(g, "lodge", this.lodgeSel, 2);
    if (this.portSel) {
      g.beginPath();
      g.rect(this.portSel.gx * C - 4, this.portSel.gy * C - 4, 3 * C + 8, 3 * C + 8);
      outline();
    }
    if (this.butcherSel) {
      g.beginPath();
      g.rect(this.butcherSel.gx * C - 4, this.butcherSel.gy * C - 4, 3 * C + 8, 3 * C + 8);
      outline();
    }
    if (this.lodgeSel) {
      g.beginPath();
      g.rect(this.lodgeSel.gx * C - 4, this.lodgeSel.gy * C - 4, 2 * C + 8, 2 * C + 8);
      outline();
    }
    if (this.wellSel) {
      g.beginPath();
      g.rect(this.wellSel.gx * C - 4, this.wellSel.gy * C - 4, 2 * C + 8, 2 * C + 8);
      outline();
    }
    if (this.sawmillSel) {
      g.beginPath();
      g.rect(this.sawmillSel.gx * C - 4, this.sawmillSel.gy * C - 4, 3 * C + 8, 3 * C + 8);
      outline();
    }
    if (this.houseSel) {
      g.beginPath();
      g.rect(this.houseSel.gx * C - 4, this.houseSel.gy * C - 4, 2 * C + 8, 2 * C + 8);
      outline();
    }
    if (this.siteSel) {
      const n = siteSize(this.siteSel.kind);
      g.beginPath();
      g.rect(this.siteSel.gx * C - 4, this.siteSel.gy * C - 4, n * C + 8, n * C + 8);
      outline();
    }
    if (this.campSel) {
      g.beginPath();
      g.rect(this.campSel.gx * C - 4, this.campSel.gy * C - 4, 2 * C + 8, 2 * C + 8);
      outline();
    }
    // zone en cours de tracé (clic droit maintenu) : les arbres qui seront coupés sont cerclés
    const d = this.zoneDrag;
    if (d && Math.hypot(d.x1 - d.x0, d.y1 - d.y0) * this.cam.zoom > 10) this.drawZonePreview(g, d, outline);
  }

  private drawZonePreview(g: CanvasRenderingContext2D, d: { x0: number; y0: number; x1: number; y1: number }, outline: () => void) {
    const pre: Zone = { kind: "rect", x0: d.x0 / C, y0: d.y0 / C, x1: d.x1 / C, y1: d.y1 / C };
    const now = Date.now();
    const trees = this.terrain.treesIn(pre, (idx) => isFelled(this.save, idx, now));
    g.beginPath();
    g.rect(Math.min(d.x0, d.x1), Math.min(d.y0, d.y1), Math.abs(d.x1 - d.x0), Math.abs(d.y1 - d.y0));
    outline();
    g.strokeStyle = "rgba(255,214,64,0.95)";
    g.lineWidth = 2.5;
    for (const idx of trees) {
      const o = objects[idx];
      g.beginPath();
      g.arc(o.x * C, o.y * C, 0.42 * C * o.size, 0, Math.PI * 2);
      g.stroke();
    }
    const label = trees.length ? `${trees.length} arbre${trees.length > 1 ? "s" : ""} · relâche pour valider` : "aucun arbre dans cette zone";
    g.font = "bold 17px 'Trebuchet MS', sans-serif";
    g.textAlign = "center";
    g.lineWidth = 5;
    g.strokeStyle = "#4a3b2a";
    g.fillStyle = "#fff6e0";
    const ly = d.y1 - 0.6 * C;
    g.strokeText(label, d.x1, ly);
    g.fillText(label, d.x1, ly);
  }

  // Cercles qui s'élargissent là où l'on vient de jeter la ligne.
  private drawSplashes(g: CanvasRenderingContext2D, t: number) {
    this.splashes = this.splashes.filter((s) => t - s.t0 < 900);
    g.strokeStyle = "#fff";
    for (const s of this.splashes) {
      const k = (t - s.t0) / 900;
      g.globalAlpha = 1 - k;
      g.lineWidth = 3 * (1 - k) + 1;
      g.beginPath();
      g.arc(s.x, s.y, 8 + k * 34, 0, Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  private drawMinimap() {
    const el = document.getElementById("minimap") as HTMLCanvasElement;
    const g = el.getContext("2d")!;
    g.clearRect(0, 0, MINI, MINI);
    g.drawImage(this.mini, 0, 0);
    const k = MINI / (GRID * C);
    // camps (orange) et dépôts (brun)
    for (const c of this.save.camps) {
      g.fillStyle = "#e8923a";
      g.fillRect((c.gx * C + C) * k - 2.5, (c.gy * C + C) * k - 2.5, 5, 5);
    }
    for (const m of this.save.apiaries) {
      g.fillStyle = "#e6b84a";
      g.fillRect((m.gx * C + C) * k - 2.5, (m.gy * C + C) * k - 2.5, 5, 5);
    }
    for (const m of this.save.taverns) {
      g.fillStyle = "#c9784a";
      g.fillRect((m.gx * C + 1.5 * C) * k - 3, (m.gy * C + 1.5 * C) * k - 3, 6, 6);
    }
    for (const m of this.save.shipyards) {
      g.fillStyle = "#5a7fa8";
      g.fillRect((m.gx * C + 3 * C) * k - 4, (m.gy * C + 3 * C) * k - 4, 8, 8);
    }
    for (const m of this.save.markets) {
      g.fillStyle = m.here ? "#e8c24e" : "#c0453a";
      g.fillRect((m.gx * C + 1.5 * C) * k - 3, (m.gy * C + 1.5 * C) * k - 3, 6, 6);
    }
    for (const m of this.save.pigpens) {
      g.fillStyle = "#d98f8a";
      g.fillRect((m.gx * C + 2 * C) * k - 4, (m.gy * C + 2 * C) * k - 4, 8, 8);
    }
    for (const m of this.save.stables) {
      g.fillStyle = "#b4573a";
      g.fillRect((m.gx * C + 2 * C) * k - 4, (m.gy * C + 2 * C) * k - 4, 8, 8);
    }
    for (const m of this.save.farms) {
      g.fillStyle = "#c9a63a";
      g.fillRect((m.gx * C + 2.5 * C) * k - 4, (m.gy * C + 2.5 * C) * k - 4, 8, 8);
    }
    for (const m of this.save.churches) {
      g.fillStyle = "#8d8a99";
      g.fillRect((m.gx * C + 1.5 * C) * k - 3, (m.gy * C + 1.5 * C) * k - 3, 6, 6);
    }
    for (const m of this.save.clinics) {
      g.fillStyle = "#4f9a6a";
      g.fillRect((m.gx * C + C) * k - 2.5, (m.gy * C + C) * k - 2.5, 5, 5);
    }
    for (const m of this.save.ports) {
      g.fillStyle = "#4f78a8";
      g.fillRect((m.gx * C + 1.5 * C) * k - 3, (m.gy * C + 1.5 * C) * k - 3, 6, 6);
    }
    for (const m of this.save.butchers) {
      g.fillStyle = "#d9d2c2";
      g.fillRect((m.gx * C + 1.5 * C) * k - 3, (m.gy * C + 1.5 * C) * k - 3, 6, 6);
    }
    for (const m of this.save.lodges) {
      g.fillStyle = "#b5443a";
      g.fillRect((m.gx * C + C) * k - 2.5, (m.gy * C + C) * k - 2.5, 5, 5);
    }
    for (const m of this.save.wells) {
      g.fillStyle = "#3b8fd9";
      g.fillRect((m.gx * C + C) * k - 2.5, (m.gy * C + C) * k - 2.5, 5, 5);
    }
    for (const m of this.save.sawmills) {
      g.fillStyle = "#b58a4a";
      g.fillRect((m.gx * C + 1.5 * C) * k - 3, (m.gy * C + 1.5 * C) * k - 3, 6, 6);
    }
    for (const h of this.save.houses) {
      g.fillStyle = "#c4513c";
      g.fillRect((h.gx * C + C) * k - 2.5, (h.gy * C + C) * k - 2.5, 5, 5);
    }
    for (const d of this.save.depots) {
      g.fillStyle = "#7a4e2a";
      g.fillRect((d.gx * C + 1.5 * C) * k - 3, (d.gy * C + 1.5 * C) * k - 3, 6, 6);
    }
    const hw = this.w / 2 / this.cam.zoom;
    const hh = this.h / 2 / this.cam.zoom;
    g.strokeStyle = "#fff";
    g.lineWidth = 2;
    g.strokeRect((this.cam.x - hw) * k, (this.cam.y - hh) * k, hw * 2 * k, hh * 2 * k);
  }

  // ---------- infobulle et menus ----------

  // Ce que l'on peut faire sous le curseur : abattre, pêcher, construire…
  private showCellInfo(cell: Pos | null, w: { x: number; y: number } | null, felled: (idx: number) => boolean) {
    const el = document.getElementById("cellInfo") as HTMLElement;
    if (!cell || !w) {
      el.style.display = "none";
      return;
    }
    const s = this.save;
    const text = siteAt(s, cell.gx, cell.gy)?.undo
      ? "démontage en cours"
      : siteAt(s, cell.gx, cell.gy)
        ? "chantier"
        : houseAt(s, cell.gx, cell.gy)
          ? "maison"
          : sawmillAt(s, cell.gx, cell.gy)
            ? "scierie"
            : wellAt(s, cell.gx, cell.gy)
              ? "puits"
              : lodgeAt(s, cell.gx, cell.gy)
                ? "camp de chasseur"
                : butcherAt(s, cell.gx, cell.gy)
                  ? "boucherie"
                  : portAt(s, cell.gx, cell.gy)
                    ? "port"
                    : tavernAt(s, cell.gx, cell.gy)
                      ? "taverne"
                    : shipyardAt(s, cell.gx, cell.gy)
                      ? "chantier du grand drakkar"
                    : marketAt(s, cell.gx, cell.gy)
                      ? "marché"
                    : pigpenAt(s, cell.gx, cell.gy)
                      ? "porcherie"
                    : stableAt(s, cell.gx, cell.gy)
                      ? "étable"
                    : farmAt(s, cell.gx, cell.gy)
                      ? "ferme"
                    : churchAt(s, cell.gx, cell.gy)
                      ? "église"
                    : clinicAt(s, cell.gx, cell.gy)
                      ? "maison du soigneur"
                    : apiaryAt(s, cell.gx, cell.gy)
                      ? "rucher"
          : campAt(s, cell.gx, cell.gy)
            ? "camp de bûcheron"
            : depotAt(s, cell.gx, cell.gy)
              ? "dépôt"
              : "";
    if (!text) {
      el.style.display = "none"; // ni herbe, ni eau, ni arbre : rien à dire
      return;
    }
    el.textContent = text;
    el.className = "";
    el.style.display = "block";
  }

  // Menu de la structure sélectionnée. Camp : stock, limite et liaison. Dépôt : stock, liaison, et recrutement d'un porteur.
  private updateStructureMenu() {
    const box = document.getElementById("campMenu") as HTMLElement;
    const camp = this.campSel && this.save.camps.includes(this.campSel) ? this.campSel : null;
    const depot = this.depotSel && this.save.depots.includes(this.depotSel) ? this.depotSel : null;
    const site = this.siteSel && this.save.sites.includes(this.siteSel) ? this.siteSel : null;
    if (!camp) this.campSel = null;
    if (!depot) this.depotSel = null;
    if (!site) this.siteSel = null;
    const house = this.houseSel && this.save.houses.includes(this.houseSel) ? this.houseSel : null;
    if (!house) this.houseSel = null;
    const mill = this.sawmillSel && this.save.sawmills.includes(this.sawmillSel) ? this.sawmillSel : null;
    if (!mill) this.sawmillSel = null;
    const well = this.wellSel && this.save.wells.includes(this.wellSel) ? this.wellSel : null;
    if (!well) this.wellSel = null;
    const lodge = this.lodgeSel && this.save.lodges.includes(this.lodgeSel) ? this.lodgeSel : null;
    if (!lodge) this.lodgeSel = null;
    const shop = this.butcherSel && this.save.butchers.includes(this.butcherSel) ? this.butcherSel : null;
    if (!shop) this.butcherSel = null;
    const port = this.portSel && this.save.ports.includes(this.portSel) ? this.portSel : null;
    if (!port) this.portSel = null;
    const tavern = this.tavernSel && this.save.taverns.includes(this.tavernSel) ? this.tavernSel : null;
    if (!tavern) this.tavernSel = null;
    const ship = this.shipSel && this.save.shipyards.includes(this.shipSel) ? this.shipSel : null;
    if (!ship) this.shipSel = null;
    const market = this.marketSel && this.save.markets.includes(this.marketSel) ? this.marketSel : null;
    if (!market) this.marketSel = null;
    const pigpen = this.pigpenSel && this.save.pigpens.includes(this.pigpenSel) ? this.pigpenSel : null;
    if (!pigpen) this.pigpenSel = null;
    const stable = this.stableSel && this.save.stables.includes(this.stableSel) ? this.stableSel : null;
    if (!stable) this.stableSel = null;
    const farm = this.farmSel && this.save.farms.includes(this.farmSel) ? this.farmSel : null;
    if (!farm) this.farmSel = null;
    const church = this.churchSel && this.save.churches.includes(this.churchSel) ? this.churchSel : null;
    if (!church) this.churchSel = null;
    const clinic = this.clinicSel && this.save.clinics.includes(this.clinicSel) ? this.clinicSel : null;
    if (!clinic) this.clinicSel = null;
    const apiary = this.apiarySel && this.save.apiaries.includes(this.apiarySel) ? this.apiarySel : null;
    if (!apiary) this.apiarySel = null;
    if (!camp && !depot && !site && !house && !mill && !well && !lodge && !shop && !port && !apiary && !clinic && !church && !farm && !stable && !pigpen && !market && !ship && !tavern) {
      if (!this.selected) {
        this.hideMenu(box);
        this.menuSig = "";
      }
      return;
    }
    const crew = this.workers.map((w) => w.name + w.role + (w.working ? 1 : 0)).join(",");
    const net = `${Object.keys(this.save.roads).length}/${this.save.camps.length}/${this.save.depots.length}/${this.save.houses.length}`;
    const sickKey = this.workers.filter((w) => w.data.illness).map((w) => w.data.id + w.data.illness!.kind + Math.round(w.data.illness!.sev / 5)).join(",");
    const sig = tavern ? `t${tavern.id}/${RECIPES.map((r) => tavern.dishes[r.id] ?? 0).join("-")}/${Object.values(tavern.pantry).join("-")}/${net}/${crew}` : ship ? `y${ship.id}/${ship.stage}/${Object.values(ship.have).join("-")}/${this.save.depots.reduce((a, d) => a + (d.planks ?? 0) + (d.cuts ?? 0) + (d.honey ?? 0) + (d.berries ?? 0) + d.wood + cropTotal(d), 0)}/${net}` : market ? `k${market.id}/${market.here ? 1 : 0}/${Math.floor(market.clock / 30)}/${Object.values(market.stock).join("-")}/${Object.values(market.wants).join("-")}/${Math.floor(market.purse)}/${this.save.coins}/${this.save.depots.reduce((a, d) => a + depotFree(d), 0)}/${net}` : pigpen ? `g${pigpen.id}/${pigpen.pigs.map((p) => (pigAdult(p) ? 2 : 0) + (pigFed(p) ? 1 : 0) + (pigWatered(p) ? 1 : 0)).join("")}/${Math.floor(pigpen.feed)}/${Math.floor(pigpen.water)}/${pigpen.order}/${pigpen.auto ? 1 : 0}/${this.save.coins >= PIG_PRICE ? 1 : 0}/${net}/${crew}` : stable ? `v${stable.id}/${stable.cows.map((c) => (cowFed(c) ? 1 : 0) + (cowWatered(c) ? 1 : 0)).join("")}/${Math.floor(stable.feed)}/${Math.floor(stable.water)}/${stable.milk}/${net}/${crew}` : farm ? `f${farm.id}/${farm.crop}/${Math.floor(farm.water)}/${farm.plots.map((pl) => (pl.p < 0 ? "e" : pl.p >= 1 ? "r" : Math.floor(pl.p * 25)) + (pl.wet <= 0 ? "d" : "") + (pl.t ?? "-")[0]).join(",")}/${this.farmPick ?? "-"}/${this.season().index}/${net}/${crew}` : church ? `e${church.id}/${church.graves.length}/${this.save.corpses.length}/${net}/${crew}` : clinic ? `n${clinic.id}/${clinic.prevent === false ? 0 : 1}/${this.workers.map((w) => healSkill(w.data.xp ?? 0).level).join("")}/${clinic.berries}/${clinic.honey}/${clinic.tisane}/${clinic.syrup}/${sickKey}/${net}/${crew}` : apiary ? `a${apiary.id}/${apiary.honey}/${Math.floor(apiary.care / 5)}/${this.season().index}/${net}/${crew}` : port ? `p${port.id}/${EXPORT_LIST.map((g) => portStock(port, g) + ":" + portQuota(port, g)).join(",")}/${this.save.depots.reduce((a, d) => a + (d.planks ?? 0) + (d.cuts ?? 0) + (d.honey ?? 0) + (d.berries ?? 0) + cropTotal(d), 0) + this.save.camps.reduce((a, c) => a + c.wood, 0) + this.save.lodges.reduce((a, l) => a + l.meat, 0)}/${Math.floor(port.t / 4)}/${net}/${crew}` : shop ? `b${shop.id}/${shop.meat}/${shop.cuts}/${net}/${crew}` : lodge ? `l${lodge.id}/${lodge.meat}/${crew}/${Math.floor(this.animals.length / 5)}` : well ? `w${well.id}/${well.water}/${net}/${crew}` : mill ? `m${mill.id}/${mill.logs}/${mill.planks}/${net}/${crew}` : house ? `h${house.id}/${house.quarantine ? 1 : 0}/${sickKey}/${house.water ?? 0}/${house.food ?? 0}/${houseMood(this.save, house).mood}/${Math.round(Math.max(0, ...this.workers.filter((w) => w.data.home === house.id).map((w) => w.data.discontent ?? 0)) / 4)}/${this.workers.filter((w) => w.data.home === house.id && w.data.threat !== undefined).length}/${Math.floor(Math.max(0, ...this.workers.filter((w) => w.data.threat !== undefined).map((w) => w.data.threat ?? 0)) / 5)}/${crew}/${this.workers.map((w) => (w.inside ? 1 : 0) + "" + w.data.home).join("")}` : camp ? `c${camp.id}/${camp.wood}/${net}` : site ? `s${site.id}/${site.have}/${Math.floor(site.progress * 20)}/${net}/${crew}` : `d${depot!.id}/${depot!.wood}/${depot!.planks ?? 0}/${depot!.cuts ?? 0}/${depot!.honey ?? 0}/${depot!.berries ?? 0}/${depot!.milk ?? 0}/${depot!.meat ?? 0}/${Object.values(depot!.crops ?? {}).join("-")}/${depot!.level ?? 1}/${net}/${crew}`;
    const crewAt: [string, number] | null = tavern ? ["tavern", tavern.id] : pigpen ? ["pigpen", pigpen.id] : stable ? ["stable", stable.id] : farm ? ["farm", farm.id] : church ? ["church", church.id] : clinic ? ["clinic", clinic.id] : apiary ? ["apiary", apiary.id] : port ? ["port", port.id] : shop ? ["butcher", shop.id] : lodge ? ["lodge", lodge.id] : well ? ["well", well.id] : mill ? ["sawmill", mill.id] : site ? ["site", site.id] : camp ? ["camp", camp.id] : depot ? ["depot", depot.id] : null;
    const work = crewAt && crewAt[0] !== "well" ? `${this.employeesAt(crewAt[0] as WorkplaceKind, crewAt[1]).map((w) => w.data.id).join(",")}${crewAt[0] === "depot" ? "+" + this.employeesAt("gather", crewAt[1]).map((w) => w.data.id).join(",") : ""}|${this.recruitOpen ? this.workers.filter((o) => !o.data.workplace).map((o) => o.data.id).join(",") : "-"}` : "";
    const full = sig + "/" + work + "/" + ((tavern ?? ship ?? market ?? pigpen ?? stable ?? farm ?? church ?? clinic ?? apiary ?? port ?? shop ?? lodge ?? well ?? mill ?? house ?? camp ?? site ?? depot)?.rot ?? 0);
    if (full !== this.menuSig) {
      this.menuSig = full;
      box.textContent = "";
      const div = (cls: string, text?: string) => {
        const d = document.createElement("div");
        d.className = cls;
        if (text !== undefined) d.textContent = text;
        return d;
      };
      const span = (cls: string, text: string) => {
        const s = document.createElement("span");
        s.className = cls;
        s.textContent = text;
        return s;
      };
      // en-tête : un gros pictogramme, le nom, et des puces d'état (vert : bon, rouge : à régler, gris : en attente)
      type Chip = [string, "ok" | "bad" | "idle"];
      const head = (emoji: string, title: string, chips: Chip[] = [], aside: Node | string = "") => {
        const h = div("mHead");
        h.append(span("mEmoji", emoji), span("mTitle", tl(title)));
        if (aside) {
          const a = span("mAside", "");
          a.append(aside); // à droite, sur la même ligne
          h.appendChild(a);
        }
        box.appendChild(h);
        if (chips.length) {
          const row = div("mChips");
          for (const [text, kind] of chips) row.appendChild(span(`mChip ${kind}`, text));
          box.appendChild(row);
        }
      };
      const bar = (value: number, max: number) => {
        const b = div("menuBar");
        const fill = document.createElement("i");
        fill.style.width = `${Math.round((Math.min(value, max) / max) * 100)}%`;
        fill.className = value >= max ? "full" : "";
        b.appendChild(fill);
        box.appendChild(b);
      };
      // une ligne chiffrée, avec ou sans jauge
      const stat = (label: string, value: string, gauge?: [number, number]) => {
        const row = div("mStat");
        row.append(span("", label), span("mVal", value));
        box.appendChild(row);
        if (gauge) bar(gauge[0], gauge[1]);
      };
      const hasRoad = (e: Pos) => roadAt(this.save, e.gx, e.gy);
      const linkChip = (label: string, e: Pos, targets: Pos[]): Chip => (hasRoad(e) && targets.some((t) => this.linkedTo(e, [t])) ? [`Relié · ${label}`, "ok"] : [`Non relié · ${label}`, "bad"]);
      const folksOf = (pred: (w: Worker) => boolean) => this.workers.filter(pred).length;

      if (tavern) {
        const total = dishCount(tavern);
        head("🍺", "Taverne", [[`${total} plat${total > 1 ? "s" : ""} prêt${total > 1 ? "s" : ""}`, total ? "ok" : "idle"], this.employeesAt("tavern", tavern.id).length ? ["Cuisinier au travail", "ok"] : ["Pas de cuisinier", "bad"]]);
        for (const r of RECIPES) {
          const n = tavern.dishes[r.id] ?? 0;
          stat(`${r.emoji} ${r.label}`, `${n} / ${DISH_CAP}`, [n, DISH_CAP]);
          const needs = (Object.entries(r.needs) as [keyof typeof EXPORT_GOODS, number][]).map(([g, q]) => `${q} ${EXPORT_GOODS[g].emoji}`).join(" + ");
          box.appendChild(div("menuRow tiny", `${needs} · ⚡ +${r.energy} énergie · rassasie ${Math.round(r.sated / 60)} min`));
        }
        const pantry = (Object.entries(tavern.pantry) as [keyof typeof EXPORT_GOODS, number][]).filter(([, n]) => n > 0).map(([g, n]) => `${n} ${EXPORT_GOODS[g].emoji}`).join("  ");
        stat("🧺 Garde-manger", pantry || "vide");
      } else if (ship) {
        const done = shipyardDone(ship);
        head("⛵", "Chantier du grand drakkar", [done ? ["Drakkar terminé", "ok"] : [`Étape ${ship.stage + 1} / ${DRAKKAR_STAGES.length}`, "idle"], done ? ["Prêt à appareiller", "ok"] : [DRAKKAR_STAGES[ship.stage].label, "idle"]]);
        if (!done) {
          for (const [g, have, need] of shipyardNeeds(ship)) stat(`${EXPORT_GOODS[g].emoji} ${EXPORT_GOODS[g].label}`, `${have} / ${need}`, [have, need]);
          const give = document.createElement("button");
          give.className = "round menuItem";
          give.textContent = "📦 Livrer depuis les dépôts";
          give.addEventListener("click", () => {
            const n = deliverToShipyard(this.save, ship);
            toast(n > 0 ? `⛵ ${n} marchandise${n > 1 ? "s" : ""} livrée${n > 1 ? "s" : ""} au chantier.` : "Les dépôts n'ont rien de ce qui manque.");
            persist(this.save);
            this.menuSig = "";
          });
          box.appendChild(give);
        } else {
          const go = document.createElement("button");
          go.className = "round menuItem on";
          go.textContent = "⛵ Appareiller vers une île nouvelle";
          go.addEventListener("click", () => {
            if (!window.confirm("Tout le village embarque et quitte cette île pour fonder une colonie sur une île nouvelle.\nLes bâtiments restent ici : seuls les villageois et les pièces voyagent.\n\nAppareiller ?")) return;
            this.setSail();
          });
          box.appendChild(go);
        }
      } else if (market) {
        const secs = Math.max(0, Math.ceil(market.clock));
        const eta = secs >= 60 ? `${Math.ceil(secs / 60)} min` : `${secs} s`;
        head("🛒", "Marché", [market.here ? ["Caravane présente", "ok"] : ["Pas de caravane", "idle"], market.here ? [`Repart dans ${eta}`, secs < 60 ? "bad" : "idle"] : [`Prochaine dans ~${eta}`, "idle"]]);
        if (market.here) {
          const rows = (title: string, list: ExportGood[], mk: (g: ExportGood) => HTMLElement) => {
            const h = div("menuRow", title);
            h.style.fontWeight = "700";
            box.appendChild(h);
            if (!list.length) box.appendChild(div("menuRow tiny", "Plus rien."));
            for (const g of list) box.appendChild(mk(g));
          };
          const pair = (label: string, actions: [string, () => void, boolean][]) => {
            const r = div("mStat");
            r.append(span("", label));
            const b = div("");
            b.style.display = "flex";
            b.style.gap = "6px";
            for (const [text, fn, off] of actions) {
              const btn = document.createElement("button");
              btn.className = "round menuItem";
              btn.textContent = text;
              btn.disabled = off;
              btn.addEventListener("click", () => {
                fn();
                persist(this.save);
                this.menuSig = "";
              });
              b.appendChild(btn);
            }
            r.appendChild(b);
            return r;
          };
          const sells = (Object.keys(market.stock) as ExportGood[]).filter((g) => (market.stock[g] ?? 0) > 0);
          rows("🛒 La caravane vend", sells, (g) => {
            const price = marketBuyPrice(g);
            const left = market.stock[g] ?? 0;
            const buy = (n: number) => () => {
              const got = buyFromCaravan(this.save, market, g, n);
              if (got === 0) toast(this.save.coins < price ? "Pas assez de pièces." : "Plus de place dans les dépôts.");
            };
            return pair(`${EXPORT_GOODS[g].emoji} ${EXPORT_GOODS[g].label} · ${price} 🪙 · reste ${left}`, [["+1", buy(1), this.save.coins < price], ["+5", buy(5), this.save.coins < price]]);
          });
          const buys = (Object.keys(market.wants) as ExportGood[]).filter((g) => (market.wants[g] ?? 0) > 0);
          rows("💰 La caravane achète", buys, (g) => {
            const price = marketSellPrice(g);
            const have = depotGoodTotal(this.save, g);
            const off = have <= 0 || market.purse < price;
            const sell = (n: number) => () => void sellToCaravan(this.save, market, g, n);
            return pair(`${EXPORT_GOODS[g].emoji} ${EXPORT_GOODS[g].label} · ${price} 🪙 · veut ${market.wants[g]} · tu as ${have}`, [["−1", sell(1), off], ["−5", sell(5), off]]);
          });
          stat("🪙 Bourse de la caravane", `${Math.floor(market.purse)}`);
        }
      } else if (pigpen) {
        const adults = adultsOf(pigpen);
        const hungry = pigpen.pigs.filter((p) => !pigFed(p)).length;
        const thirsty = pigpen.pigs.filter((p) => !pigWatered(p)).length;
        head("🐖", "Porcherie", [
          [`${pigpen.pigs.length} / ${PIGS_MAX} cochon${pigpen.pigs.length > 1 ? "s" : ""}`, pigpen.pigs.length ? "ok" : "idle"],
          !pigpen.pigs.length ? ["Aucun cochon", "idle"] : hungry ? [`${hungry} a${hungry > 1 ? "ont" : ""} faim`, "bad"] : thirsty ? [`${thirsty} a${thirsty > 1 ? "ont" : ""} soif`, "bad"] : ["Bien soignés", "ok"],
        ]);
        stat("🥕 Auge (légumes)", `${Math.floor(pigpen.feed)} / ${PIG_FEED_CAP}`, [pigpen.feed, PIG_FEED_CAP]);
        stat("💧 Abreuvoir (eau)", `${Math.floor(pigpen.water)} / ${PIG_WATER_CAP}`, [pigpen.water, PIG_WATER_CAP]);
        stat("🐖 Adultes (prêts à abattre)", `${adults} / ${pigpen.pigs.length}`);
        if (pigpen.pigs.length) {
          const herd = div("mPlots");
          pigpen.pigs.forEach((p, i) => {
            const bad = !pigFed(p) || !pigWatered(p);
            const cell = div(`mPlot${bad ? " dry" : ""}`);
            cell.title = `Cochon ${i + 1}`;
            cell.append(span("mPlotIcon", pigAdult(p) ? "🐖" : "🐷"), span("mPlotPct", !pigFed(p) ? "a faim" : !pigWatered(p) ? "a soif" : pigAdult(p) ? "adulte" : `${Math.floor((p.age / 240) * 100)} %`));
            herd.appendChild(cell);
          });
          box.appendChild(herd);
        }
        const buy = document.createElement("button");
        buy.className = "round menuItem";
        buy.textContent = pigpen.pigs.length >= PIGS_MAX ? "➕ La porcherie est pleine" : `➕ Acheter un porcelet (${PIG_PRICE} 🪙)`;
        buy.disabled = pigpen.pigs.length >= PIGS_MAX;
        buy.addEventListener("click", () => {
          const r = buyPig(this.save, pigpen);
          if (r === "poor") toast("Pas assez de pièces pour acheter un porcelet.");
          persist(this.save);
          this.menuSig = "";
        });
        box.appendChild(buy);
        const kill = document.createElement("button");
        kill.className = "round menuItem";
        kill.textContent = pigpen.order > 0 ? `🔪 À abattre : ${pigpen.order} (cliquer pour ajouter)` : `🔪 Faire abattre un cochon (+${PIG_MEAT} 🍖)`;
        kill.disabled = pigpen.order >= adults;
        kill.addEventListener("click", () => {
          pigpen.order = Math.min(adultsOf(pigpen), pigpen.order + 1);
          persist(this.save);
          this.menuSig = "";
        });
        box.appendChild(kill);
        const auto = document.createElement("button");
        auto.className = `round menuItem${pigpen.auto ? " on" : ""}`;
        auto.textContent = pigpen.auto ? `⚙️ Abattage automatique : oui (garde ${PIG_KEEP} adultes)` : "⚙️ Abattage automatique : non";
        auto.addEventListener("click", () => {
          pigpen.auto = !pigpen.auto;
          persist(this.save);
          this.menuSig = "";
        });
        box.appendChild(auto);
        if (pigpen.pigs.length) {
          const sell = document.createElement("button");
          sell.className = "round menuItem";
          sell.textContent = `➖ Revendre un cochon (+${PIG_SELL} 🪙)`;
          sell.addEventListener("click", () => {
            if (pigpen.pigs.length) {
              pigpen.pigs.pop();
              this.save.coins += PIG_SELL;
              pigpen.order = Math.min(pigpen.order, adultsOf(pigpen));
            }
            persist(this.save);
            this.menuSig = "";
          });
          box.appendChild(sell);
        }
      } else if (stable) {
        const hungry = stable.cows.filter((c) => !cowFed(c)).length;
        const thirsty = stable.cows.filter((c) => !cowWatered(c)).length;
        head("🐄", "Étable", [
          [`${stable.cows.length} / ${STABLE_COWS_MAX} vache${stable.cows.length > 1 ? "s" : ""}`, stable.cows.length ? "ok" : "idle"],
          !stable.cows.length ? ["Aucune vache", "idle"] : hungry ? [`${hungry} a${hungry > 1 ? "ont" : ""} faim`, "bad"] : thirsty ? [`${thirsty} a${thirsty > 1 ? "ont" : ""} soif`, "bad"] : ["Bien soignées", "ok"],
        ]);
        stat("🌿 Auge (herbe)", `${Math.floor(stable.feed)} / ${STABLE_FEED_CAP}`, [stable.feed, STABLE_FEED_CAP]);
        stat("💧 Abreuvoir (eau)", `${Math.floor(stable.water)} / ${STABLE_WATER_CAP}`, [stable.water, STABLE_WATER_CAP]);
        stat("🥛 Lait à ramasser", `${stable.milk} / ${STABLE_MILK_CAP}`, [stable.milk, STABLE_MILK_CAP]);
        // chaque vache : nourrie / a faim, abreuvée / a soif
        if (stable.cows.length) {
          const herd = div("mPlots");
          stable.cows.forEach((c, i) => {
            const bad = !cowFed(c) || !cowWatered(c);
            const cell = div(`mPlot${bad ? " dry" : ""}`);
            cell.title = `Vache ${i + 1}`;
            cell.append(span("mPlotIcon", "🐄"), span("mPlotPct", !cowFed(c) ? "a faim" : !cowWatered(c) ? "a soif" : "contente"));
            herd.appendChild(cell);
          });
          box.appendChild(herd);
        }
        const buy = document.createElement("button");
        buy.className = "round menuItem";
        buy.textContent = stable.cows.length >= STABLE_COWS_MAX ? "➕ L'étable est pleine" : `➕ Acheter une vache (${COW_PRICE} 🪙)`;
        buy.disabled = stable.cows.length >= STABLE_COWS_MAX;
        buy.addEventListener("click", () => {
          const r = buyCow(this.save, stable);
          if (r === "poor") toast("Pas assez de pièces pour acheter une vache.");
          persist(this.save);
          this.menuSig = "";
        });
        box.appendChild(buy);
        if (stable.cows.length) {
          const sell = document.createElement("button");
          sell.className = "round menuItem";
          sell.textContent = `➖ Revendre une vache (+${COW_SELL} 🪙)`;
          sell.addEventListener("click", () => {
            sellCow(this.save, stable);
            persist(this.save);
            this.menuSig = "";
          });
          box.appendChild(sell);
        }
        box.appendChild(div("menuRow tiny", "Les vaches mangent de l'herbe (cultive-la à la ferme, elle va au dépôt) et boivent de l'eau (puits) : nourries et abreuvées, elles donnent du lait."));
      } else if (farm) {
        const n = farmCounts(farm);
        const season = this.season();
        const factor = cropSeasonFactor(farm.crop, season.index);
        head("🌾", "Ferme", [
          [`${FARM_CROPS[farm.crop].emoji} ${FARM_CROPS[farm.crop].label}`, "ok"],
          factor === 0 ? [`Rien ne pousse (${season.rules.label.toLowerCase()})`, "bad"] : factor < 0.8 ? ["Pousse lentement", "idle"] : ["Bonne saison", "ok"],
          n.dry > 0 ? [`💧 ${n.dry} parcelle${n.dry > 1 ? "s" : ""} sèche${n.dry > 1 ? "s" : ""}`, farm.water < 1 ? "bad" : "idle"] : n.growing > 0 ? ["Bien arrosé", "ok"] : ["Au repos", "idle"],
        ]);
        stat("📈 Avancement moyen", `${Math.round(n.avg * 100)} %`, [n.avg * 100, 100]);
        stat("💧 Cuve d'eau", `${Math.floor(farm.water)} / ${FARM_TANK_CAP}`, [farm.water, FARM_TANK_CAP]);
        // chaque parcelle : sa culture, son avancement en %, et une goutte si elle a soif ; un clic sur une parcelle ouvre le choix de ce qu'on y met
        const grid = div("mPlots");
        farm.plots.forEach((pl, i) => {
          const cell = div(`mPlot${pl.p < 0 ? " empty" : pl.p >= 1 ? " ripe" : plotDry(pl) ? " dry" : ""}${this.farmPick === i ? " sel" : ""}`);
          cell.title = pl.p < 0 ? `Parcelle ${i + 1} : vide · ${pl.t ? "à semer : " + FARM_CROPS[pl.t].label : "à choisir"} (clique pour choisir)` : `Parcelle ${i + 1} : ${FARM_CROPS[pl.c].label}, ${Math.floor(Math.min(1, pl.p) * 100)} %${pl.wet <= 0 ? " · sèche" : ""} (clique pour choisir la suite)`;
          cell.append(span("mPlotIcon", pl.p < 0 ? (pl.t ? FARM_CROPS[pl.t].emoji : "＋") : FARM_CROPS[pl.c].emoji), span("mPlotPct", pl.p < 0 ? (pl.t ? "à semer" : "à choisir") : pl.p >= 1 ? "mûr" : `${Math.floor(pl.p * 100)} %`));
          if (pl.p >= 0 && pl.t) cell.appendChild(span("mPlotNext", `→ ${FARM_CROPS[pl.t].emoji}`)); // la culture prévue ensuite
          cell.addEventListener("click", () => {
            this.farmPick = this.farmPick === i ? null : i;
            this.menuSig = "";
          });
          if (plotDry(pl)) cell.appendChild(span("mPlotDrop", "💧"));
          grid.appendChild(cell);
        });
        box.appendChild(grid);
        // le choix de la parcelle cliquée : quel légume y mettre
        const pick = this.farmPick;
        if (pick !== null && farm.plots[pick]) {
          const pl = farm.plots[pick];
          const panel = div("mPick");
          panel.appendChild(div("mPickTitle", `Parcelle ${pick + 1} · ${pl.p < 0 ? "vide" : `${FARM_CROPS[pl.c].label} ${pl.p >= 1 ? "mûr" : Math.floor(pl.p * 100) + " %"}`}`));
          panel.appendChild(div("menuRow tiny", pl.p < 0 ? "Que veux-tu y mettre ?" : "Que veux-tu y mettre après la récolte ?"));
          const choices = div("mCrops");
          for (const id of Object.keys(FARM_CROPS) as FarmCrop[]) {
            const c = FARM_CROPS[id];
            const b = document.createElement("button");
            b.className = `round mCropBtn${pl.t === id ? " on" : ""}`;
            b.append(span("", `${c.emoji} ${c.label}`), span("mCropSub", `${c.yield} · ${c.growSec} s · ${c.price} 🪙`));
            b.addEventListener("click", () => {
              pl.t = id;
              this.farmPick = null;
              persist(this.save);
              this.menuSig = "";
            });
            choices.appendChild(b);
          }
          panel.appendChild(choices);
          const none = document.createElement("button");
          none.className = "round menuItem";
          none.textContent = "✖ Rien (laisser vide)";
          none.addEventListener("click", () => {
            pl.t = null;
            this.farmPick = null;
            persist(this.save);
            this.menuSig = "";
          });
          panel.appendChild(none);
          box.appendChild(panel);
        } else box.appendChild(div("menuRow tiny", "Clique sur une parcelle pour choisir le légume à y mettre."));
        // tous les champs d'un coup
        const allRow = div("mAllRow");
        allRow.appendChild(span("mAllLabel", "Tout planter en :"));
        for (const id of Object.keys(FARM_CROPS) as FarmCrop[]) {
          const b = document.createElement("button");
          b.className = "round mAllBtn";
          b.textContent = FARM_CROPS[id].emoji;
          b.title = `Mettre tous les champs en ${FARM_CROPS[id].label.toLowerCase()}`;
          b.addEventListener("click", () => {
            for (const q of farm.plots) q.t = id;
            persist(this.save);
            this.menuSig = "";
          });
          allRow.appendChild(b);
        }
        box.appendChild(allRow);
      } else if (church) {
        const waiting = this.save.corpses.length;
        head("⛪", "Église", [
          linkChip("maisons", churchEntrance(church), this.save.houses.map(houseEntrance)),
          church.graves.length >= CHURCH_GRAVES ? ["Cimetière plein", "bad"] : waiting ? [`${waiting} défunt${waiting > 1 ? "s" : ""} à enterrer`, "bad"] : ["Tout est en ordre", "ok"],
        ]);
        stat("⚰️ Tombes", `${church.graves.length} / ${CHURCH_GRAVES}`, [church.graves.length, CHURCH_GRAVES]);
        stat("🕯️ Défunts en attente", String(waiting));
        for (const gr of church.graves.slice(-6).reverse()) stat(`✝ ${vn(gr.name)}`, `${gr.age} ans · ${gr.cause}`);
      } else if (clinic) {
        const sickList = this.workers.filter((w) => w.data.illness);
        head("🩺", "Maison du soigneur", [
          sickList.length ? [`${sickList.length} malade${sickList.length > 1 ? "s" : ""}`, "bad"] : ["Tout le monde va bien", "ok"],
        ]);
        stat("🫐 Baies", `${clinic.berries} / ${CLINIC_BERRY_CAP}`, [clinic.berries, CLINIC_BERRY_CAP]);
        stat("🍯 Miel", `${clinic.honey} / ${CLINIC_HONEY_CAP}`, [clinic.honey, CLINIC_HONEY_CAP]);
        stat(`${REMEDIES.tisane.emoji} Tisanes`, `${clinic.tisane} / ${CLINIC_REMEDY_CAP}`, [clinic.tisane, CLINIC_REMEDY_CAP]);
        stat(`${REMEDIES.syrup.emoji} Sirops`, `${clinic.syrup} / ${CLINIC_REMEDY_CAP}`, [clinic.syrup, CLINIC_REMEDY_CAP]);
        for (const w of sickList) {
          const il = w.data.illness!;
          stat(`${ILLNESSES[il.kind].emoji} ${w.name}`, `${ILLNESSES[il.kind].label} · ${Math.round(il.sev)} %`, [il.sev, 100]);
        }
      } else if (apiary) {
        const honeyNow = this.season().rules.honey;
        head("🐝", "Rucher", [
          honeyNow === 0 ? ["Abeilles endormies", "idle"] : apiary.care <= 0 ? ["À l'abandon", "bad"] : apiary.care < TEND_BELOW ? ["À soigner", "bad"] : apiary.honey >= HONEY_CAP ? ["Plein", "bad"] : ["Butinent", "ok"],
        ]);
        stat("🍯 Miel", `${apiary.honey} / ${HONEY_CAP}`, [apiary.honey, HONEY_CAP]);
        stat("😠 Maisons gênées", String(housesNear(this.save, apiary.gx + 1, apiary.gy + 1, MOOD.nuisance.apiary.radius).length));
        // le soin baisse tout seul : la jauge se remplit quand il faut s'en occuper (rouge quand les ruches sont à l'abandon)
        stat("🧑‍🌾 Soin à apporter", `${Math.round(100 - apiary.care)} %`, [100 - apiary.care, 100]);
      } else if (port) {
        const e = portEntrance(port);
        const f = port.t / SHIP_CYCLE;
        const secs = (frac: number) => Math.max(0, Math.round((((frac - f) % 1) + 1) % 1 * SHIP_CYCLE));
        head("⚓", "Port", [
          f >= SHIP_ARRIVE - 0.02 && f < SHIP_DOCKED ? ["Bateau en approche", "ok"] : f >= SHIP_DOCKED && f < SHIP_DEPART ? ["Chargement", "ok"] : ["Bateau au large", "idle"],
          linkChip("dépôts", e, this.save.depots.map(depotEntrance)),
        ]);
        stat("😠 Maisons gênées", String(housesNear(this.save, port.gx + 1.5, port.gy + 1.5, MOOD.nuisance.port.radius).length));
        stat("⏱ Départ du bateau", f >= SHIP_DOCKED && f < SHIP_DEPART ? `${secs(SHIP_DEPART)} s` : `${secs(SHIP_DEPART)} s`);
        // ce qui est disponible, par ressource, dans tous les bâtiments où un porteur peut la prendre
        const sources: ["depot" | "sawmill" | "butcher" | "camp" | "lodge", { id: number; gx: number; gy: number; rot?: number }[]][] = [
          ["depot", this.save.depots],
          ["sawmill", this.save.sawmills],
          ["butcher", this.save.butchers],
          ["camp", this.save.camps],
          ["lodge", this.save.lodges],
        ];
        const available = (g: ExportGood) => sources.reduce((a, [k, list]) => a + list.reduce((b, o) => b + (goodsOf(k, o as never)[g] ?? 0), 0), 0);
        const entranceOf = (k: "depot" | "sawmill" | "butcher" | "camp" | "lodge", o: { id: number; gx: number; gy: number; rot?: number }): Pos => (k === "depot" ? depotEntrance(o) : k === "sawmill" ? sawmillEntrance(o) : k === "butcher" ? butcherEntrance(o) : k === "camp" ? campEntrance(o) : lodgeEntrance(o));
        const nSources = sources.reduce((a, [, l]) => a + l.length, 0);
        const nLinkedSrc = sources.reduce((a, [k, l]) => a + l.filter((o) => this.linkedTo(e, [entranceOf(k, o)])).length, 0);
        const wanted = EXPORT_LIST.reduce((a, g) => a + portQuota(port, g), 0);
        const waiting = EXPORT_LIST.reduce((a, g) => a + portStock(port, g), 0);
        if (wanted > 0) stat("📦 Au quai", `${waiting} / ${wanted}`, [waiting, wanted]);
        stat("💰 Gain maximum par bateau", `${EXPORT_LIST.reduce((a, g) => a + portQuota(port, g) * EXPORT_GOODS[g].price, 0)} 🪙`);
        if (nSources && !nLinkedSrc) box.appendChild(div("menuRow tiny", "⚠ Aucun bâtiment n'est relié au port par un chemin : les porteurs ne pourront rien apporter."));
        else if (nLinkedSrc < nSources) box.appendChild(div("menuRow tiny", `${nLinkedSrc} bâtiment${nLinkedSrc > 1 ? "s" : ""} sur ${nSources} relié${nLinkedSrc > 1 ? "s" : ""} au port.`));
        box.appendChild(div("menuRow tiny", "Règle combien de chaque ressource part par bateau (0 : pas d'export). Maj + clic : de 5 en 5."));
        // combien exporter par bateau, ressource par ressource (0 : on n'exporte pas) ; Maj + clic : de 5 en 5
        const stepper = (g: ExportGood) => {
          const def = EXPORT_GOODS[g];
          const value = portQuota(port, g);
          const row = div("mStep");
          const ctl = div("mCtl");
          const btn = (text: string, delta: number) => {
            const b = document.createElement("button");
            b.className = "round mStepBtn";
            b.textContent = text;
            b.addEventListener("click", (ev) => {
              port.quota[g] = Math.max(0, Math.min(PORT_CAP, value + delta * (ev.shiftKey ? 5 : 1)));
              persist(this.save);
              this.menuSig = "";
            });
            return b;
          };
          ctl.append(btn("−", -1), span("mStepVal", String(value)), btn("+", 1));
          row.append(span("mStepLabel", `${def.emoji} ${def.label}`), ctl);
          box.appendChild(row);
          box.appendChild(div("menuRow tiny", `${def.price} 🪙 la pièce · ${available(g)} en stock${value > 0 ? ` · ${portStock(port, g)} au quai` : ""}`));
        };
        for (const g of EXPORT_LIST) stepper(g);
      } else if (shop) {
        const e = butcherEntrance(shop);
        head("🥩", "Boucherie", [
          this.staffAt("butcher", shop.id) === 0 ? ["Sans ouvrier", "bad"] : butcherWorking(shop) ? ["En marche", "ok"] : shop.cuts >= BUTCHER_CUTS_CAP ? ["Stock plein", "bad"] : ["En attente", "idle"],
          linkChip("viande (chasseurs, dépôts)", e, [...this.save.lodges.map(lodgeEntrance), ...this.save.depots.map(depotEntrance)]),
        ]);
        stat("🍖 Viande à préparer", `${shop.meat} / ${BUTCHER_MEAT_CAP}`, [shop.meat, BUTCHER_MEAT_CAP]);
        stat("🥩 Viande préparée", `${shop.cuts} / ${BUTCHER_CUTS_CAP}`, [shop.cuts, BUTCHER_CUTS_CAP]);
      } else if (lodge) {
        const e = lodgeEntrance(lodge);
        const around = this.animals.filter((a) => Math.hypot(a.x - (e.gx + 0.5), a.y - (e.gy + 0.5)) <= HUNT_RADIUS).length;
        head("🏹", "Camp de chasseur", [around ? ["Gibier à portée", "ok"] : ["Pas de gibier", "idle"], lodge.meat >= LODGE_CAP ? ["Plein", "bad"] : ["Place libre", "idle"]]);
        stat("🍖 Viande", `${lodge.meat} / ${LODGE_CAP}`, [lodge.meat, LODGE_CAP]);
        stat("Gibier alentour", String(around));
        stat("😠 Maisons gênées", String(housesNear(this.save, lodge.gx + 1, lodge.gy + 1, MOOD.nuisance.lodge.radius).length));
        stat("Chasseurs", String(folksOf((w) => w.data.job?.type === "hunt" && w.data.job.lodgeId === lodge.id)));
      } else if (well) {
        const e = wellEntrance(well);
        head("⛲", "Puits", [linkChip("maisons", e, this.save.houses.map(houseEntrance))]);
        stat("💧 Eau", `${well.water} / ${WELL_CAP}`, [well.water, WELL_CAP]);
      } else if (mill) {
        const e = sawmillEntrance(mill);
        head("🏭", "Scierie", [
          this.staffAt("sawmill", mill.id) === 0 ? ["Sans ouvrier", "bad"] : sawmillWorking(mill) ? ["En marche", "ok"] : mill.planks >= SAWMILL_PLANKS_CAP ? ["Stock plein", "bad"] : ["En attente", "idle"],
          linkChip("camps", e, this.save.camps.map(campEntrance)),
        ]);
        stat("🪵 Bûches", `${mill.logs} / ${SAWMILL_LOGS_CAP}`, [mill.logs, SAWMILL_LOGS_CAP]);
        stat("😠 Maisons gênées", String(housesNear(this.save, mill.gx + 1.5, mill.gy + 1.5, MOOD.nuisance.sawmill.radius).length));
        stat("🪚 Planches", `${mill.planks} / ${SAWMILL_PLANKS_CAP}`, [mill.planks, SAWMILL_PLANKS_CAP]);
      } else if (house) {
        const folks = this.workers.filter((w) => w.data.home === house.id);
        const mood = houseMood(this.save, house);
        head("🏠", "Maison", [
          ...folks.filter((w) => w.data.illness).map((w): Chip => [`${ILLNESSES[w.data.illness!.kind].emoji} ${w.name} · ${ILLNESSES[w.data.illness!.kind].label} ${Math.round(w.data.illness!.sev)} %`, w.data.illness!.sev >= SICK_BED ? "bad" : "idle"]),
          ...folks.filter((w) => w.data.threat !== undefined).map((w): Chip => [`💢 ${w.name} menace de partir · ${Math.max(0, Math.round(w.data.threat ?? 0))} s`, "bad"]),
          ...mood.causes.slice(0, 3).map((c): Chip => [`${c.emoji} ${c.label} −${c.pen}`, "bad"]),
        ], (() => {
          // les habitants : un clic sélectionne le villageois et la caméra le suit
          const who = document.createDocumentFragment();
          if (!folks.length) who.append("Personne");
          folks.forEach((w, i) => {
            if (i) who.append(" · ");
            const b = document.createElement("button");
            b.className = "mWhoBtn";
            b.textContent = w.name;
            b.addEventListener("click", () => {
              this.selectWorker(w);
              this.follow = true;
              this.menuSig = "";
            });
            who.appendChild(b);
          });
          return who;
        })());
        const worst = Math.round(Math.max(0, ...folks.map((w) => w.data.discontent ?? 0))); // le plus mécontent des habitants
        stat("😠 Mécontentement", `${worst} %`, [worst, 100]);
        // sous chaque réserve : une mention discrète de celui qui est parti en chercher (ils y vont seuls)
        const supply = (food: boolean, label: string, value: number, cap: number) => {
          stat(label, `${value} / ${cap}`);
          const away = folks.filter((w) => w.data.job?.type === "water" && !!w.data.job.food === food);
          if (away.length) box.appendChild(div("menuRow tiny", `${away.map((w) => w.name).join(" et ")} ${away.length > 1 ? "sont partis" : "est parti"} chercher ${food ? "à manger" : "de l'eau"}…`));
          bar(value, cap);
        };
        supply(true, "🥩 Nourriture", house.food ?? 0, HOUSE_FOOD_CAP);
        supply(false, "💧 Eau", house.water ?? 0, HOUSE_WATER_CAP);
        for (const w of folks.filter((o) => o.inside)) {
          const b = document.createElement("button");
          b.className = "round menuItem";
          b.textContent = `↩ Faire sortir ${w.name}`;
          b.addEventListener("click", () => this.leaveHome(w, house));
          box.appendChild(b);
        }
      } else if (site) {
        const names: Record<string, [string, string]> = {
          camp: ["🏕️", "camp de bûcheron"],
          house: ["🏠", "maison"],
          sawmill: ["🏭", "scierie"],
          well: ["⛲", "puits"],
          lodge: ["🏹", "camp de chasseur"],
          butcher: ["🥩", "boucherie"],
          port: ["⚓", "port"],
          apiary: ["🐝", "rucher"],
          clinic: ["🩺", "maison du soigneur"],
          church: ["⛪", "église"],
          farm: ["🌾", "ferme"],
          stable: ["🐄", "étable"],
          pigpen: ["🐖", "porcherie"],
          market: ["🛒", "marché"],
          shipyard: ["⛵", "chantier du drakkar"],
          tavern: ["🍺", "taverne"],
          pantry: ["🥫", "garde-manger"],
          depot: ["📦", "dépôt"],
        };
        const [emoji, name] = names[site.kind];
        const chips: Chip[] = [];
        if (site.need > 0 && !siteReady(site)) chips.push(this.buildRoute(site.id, false).ok ? ["Relié · matériaux", "ok"] : ["Non relié · matériaux", "bad"]);
        chips.push(siteReady(site) ? ["Prêt à construire", "ok"] : ["Fondations", "idle"]);
        head(emoji, `Chantier · ${name}`, chips);
        if (site.need > 0) stat(site.mat === "plank" ? "🪚 Planches livrées" : "🪵 Bois livré", `${site.have} / ${site.need}`, [site.have, site.need]);
        stat("🔨 Construction", `${Math.floor(site.progress * 100)} %`, [site.progress, 1]);
        stat("Bâtisseurs", String(folksOf((w) => w.data.job?.type === "build" && w.data.job.siteId === site.id)));
      } else if (camp) {
        head("🏕️", "Camp de bûcheron", [linkChip("scierie", campEntrance(camp), this.save.sawmills.map(sawmillEntrance)), camp.wood >= CAMP_CAPACITY ? ["Plein", "bad"] : ["Place libre", "idle"]]);
        stat("🪵 Bois", `${camp.wood} / ${CAMP_CAPACITY}`, [camp.wood, CAMP_CAPACITY]);
        stat("Bûcherons", String(folksOf((w) => w.role === "wood" && w.working)));
      } else if (depot) {
        const planks = depot.planks ?? 0;
        const cuts = (depot.cuts ?? 0) + (depot.honey ?? 0) + (depot.berries ?? 0) + (depot.milk ?? 0) + (depot.meat ?? 0) + cropTotal(depot); // places prises par la viande préparée, le miel et les baies
        const e = depotEntrance(depot);
        head(depot.pantry ? "🥫" : "📦", depot.pantry ? "Garde-manger" : "Dépôt", [linkChip("usines", e, [...this.save.sawmills.map(sawmillEntrance), ...this.save.butchers.map(butcherEntrance)]), (depotCapacity(depot) - depotFree(depot)) >= depotCapacity(depot) ? ["Plein", "bad"] : ["Place libre", "idle"], [`Niveau ${depotLevel(depot)}`, "idle"]]);
        stat("Places", `${(depotCapacity(depot) - depotFree(depot))} / ${depotCapacity(depot)}`, [(depotCapacity(depot) - depotFree(depot)), depotCapacity(depot)]);
        if (!depot.pantry) stat("🪚 Planches", String(planks));
        stat("🥩 Viande préparée", String(depot.cuts ?? 0));
        stat("🍯 Miel", String(depot.honey ?? 0));
        stat("🫐 Baies", String(depot.berries ?? 0));
        if ((depot.milk ?? 0) > 0 || depot.pantry) stat("🥛 Lait", String(depot.milk ?? 0));
        stat("🍖 Viande brute", String(depot.meat ?? 0));
        for (const id of Object.keys(FARM_CROPS) as FarmCrop[]) if ((depot.crops?.[id] ?? 0) > 0) stat(`${FARM_CROPS[id].emoji} ${FARM_CROPS[id].label}`, String(depot.crops?.[id]));
      }
      // les employés de ce bâtiment : on les voit, on peut les virer, et recruter parmi les villageois sans emploi
      const crewList = (kind: WorkplaceKind, id: number) => {
        const emp = this.employeesAt(kind, id);
        const slots = JOBS[kind].slots;
        const sec = div("mCrew");
        sec.appendChild(div("mCrewTitle", `${JOBS[kind].label}s · ${emp.length} / ${slots}`));
        if (!emp.length) sec.appendChild(div("mNone", "Personne"));
        const emojis: Record<string, string> = { none: "🧑‍🌾", wood: "🪓", haul: "📦", build: "🔨", water: "💧", hunt: "🏹", bee: "🐝", craft: "🛠️" };
        for (const w of emp) {
          const row = div("mWork");
          const who = div("mWho");
          const act = span("mAct", w.activity);
          act.dataset.wid = String(w.data.id);
          who.append(span("mWhoName", `${emojis[w.role] ?? "🧑‍🌾"} ${w.name} · ${JOBS[kind].label}${kind === "clinic" ? " · " + healSkill(w.data.xp ?? 0).label : ""}`), act);
          const fire = document.createElement("button");
          fire.className = "round mFire";
          fire.textContent = "Virer";
          fire.title = "Il perd son emploi et redevient disponible";
          fire.addEventListener("click", () => {
            this.fire(w);
            this.menuSig = "";
          });
          row.append(who, fire);
          sec.appendChild(row);
        }
        // recruter
        const full = emp.length >= slots;
        const rb = document.createElement("button");
        rb.className = "round menuItem";
        rb.textContent = full ? "Tous les postes sont pris" : this.recruitOpen ? "➕ Recruter ▴" : "➕ Recruter ▾";
        rb.disabled = full;
        rb.addEventListener("click", () => {
          this.recruitOpen = !this.recruitOpen;
          this.menuSig = "";
        });
        sec.appendChild(rb);
        if (this.recruitOpen && !full) {
          const list = div("jobList");
          const free = this.workers.filter((o) => !o.data.workplace);
          if (!free.length) list.appendChild(div("mNone", "Aucun villageois sans emploi"));
          for (const o of free) {
            const row = div("mWork");
            const who = div("mWho");
            who.append(span("mWhoName", `🧑‍🌾 ${o.name}`), span("mAct", `Sans emploi · fatigue ${Math.round(100 - o.energy)} %`));
            const hireBtn = document.createElement("button");
            hireBtn.className = "round mFire";
            hireBtn.textContent = "Embaucher";
            hireBtn.addEventListener("click", () => {
              if (this.hire(o, kind, id)) this.recruitOpen = false;
              this.menuSig = "";
            });
            row.append(who, hireBtn);
            list.appendChild(row);
          }
          sec.appendChild(list);
        }
        box.appendChild(sec);
      };
      if (tavern) crewList("tavern", tavern.id);
      else if (pigpen) crewList("pigpen", pigpen.id);
      else if (stable) crewList("stable", stable.id);
      else if (farm) crewList("farm", farm.id);
      else if (church) crewList("church", church.id);
      else if (clinic) crewList("clinic", clinic.id);
      else if (apiary) crewList("apiary", apiary.id);
      else if (port) crewList("port", port.id);
      else if (shop) crewList("butcher", shop.id);
      else if (lodge) crewList("lodge", lodge.id);
      else if (mill) crewList("sawmill", mill.id);
      else if (site) crewList("site", site.id);
      else if (camp) crewList("camp", camp.id);
      else if (depot) {
        crewList("depot", depot.id);
        crewList("gather", depot.id);
      }
      this.addMenuActions(box, (tavern ?? ship ?? market ?? pigpen ?? stable ?? farm ?? church ?? clinic ?? apiary ?? port ?? shop ?? lodge ?? well ?? mill ?? house ?? camp ?? site ?? depot)!);
    }
    // ce que chacun fait se met à jour en place, sans refaire le menu
    box.querySelectorAll<HTMLElement>(".mAct").forEach((el) => {
      const w = this.workers.find((k) => String(k.data.id) === el.dataset.wid);
      if (!w) return;
      const txt = w.activity;
      if (el.textContent !== txt) el.textContent = txt;
      el.classList.toggle("idle", txt.startsWith("Rien à faire"));
    });
    const cue: Cue | "sawIdle" | "sawWork" | "butcherWork" | "siteIdle" = stable || pigpen || farm
      ? "carry"
      : church
      ? "bell"
      : clinic || apiary
      ? "bee"
      : port
        ? "bell"
        : shop
          ? butcherWorking(shop) && this.staffAt("butcher", shop.id) > 0 ? "butcherWork" : "eat"
          : lodge
            ? "hunt"
            : well
              ? "water"
              : mill
                ? sawmillWorking(mill) && this.staffAt("sawmill", mill.id) > 0 ? "sawWork" : "sawIdle"
                : house
                  ? this.workers.some((w) => w.inside && w.data.home === house.id) ? "rest" : "door"
                  : camp
                    ? camp.wood > 0 ? "wood" : "idle"
                    : site
                      ? site.progress > 0 ? "hammer" : "siteIdle"
                      : "carry"; // un dépôt : des charges qu'on pose
    this.showMenu(box, full.split("/")[0], cue);
    // le menu reste toujours en haut à droite de l'écran (voir #campMenu) : il ne cache aucun bâtiment alentour
  }

  // Le menu entre en glissant depuis la droite (et ses lignes une à une) ; il rejoue cette entrée quand on passe à un autre bâtiment.
  private showMenu(box: HTMLElement, key: string, cue?: Cue | "sawIdle" | "sawWork" | "butcherWork" | "siteIdle") {
    clearTimeout(this.menuHideT);
    const wasHidden = box.style.display !== "flex" || box.classList.contains("out");
    box.classList.remove("out");
    box.style.display = "flex";
    if (wasHidden || key !== this.menuKey) {
      if (cue) play(cue); // un son qui correspond à ce que fait le villageois ou le bâtiment
      if (this.menuKey !== "") this.recruitOpen = false; // un autre bâtiment : la liste de recrutement se referme
      this.menuKey = key;
      box.classList.remove("in");
      void box.offsetWidth;
      box.classList.add("in");
      clearTimeout(this.menuInT);
      this.menuInT = window.setTimeout(() => box.classList.remove("in"), 900); // ensuite les mises à jour du menu ne rejouent pas l'animation
    }
  }

  // ...et sort en glissant vers la droite.
  private hideMenu(box: HTMLElement) {
    if (box.style.display === "none" || box.classList.contains("out")) return;
    clearTimeout(this.menuInT);
    box.classList.remove("in");
    box.classList.add("out");
    this.menuKey = "";
    this.recruitOpen = false;
    this.menuHideT = window.setTimeout(() => {
      box.style.display = "none";
      box.classList.remove("out");
    }, 170);
  }

  // La fenêtre du port : un tableau par ressource (stock, ce qu'on exporte par bateau, le stock minimum à garder). Le jeu se met en pause pendant qu'elle est ouverte.
  private openPort(port: Port) {
    this.portOpen = port;
    this.portBuiltFor = null;
    this.paused = true;
    this.renderPort();
    (document.getElementById("portModal") as HTMLElement).hidden = false;
  }

  private closePort() {
    if (!this.portOpen) return;
    this.portOpen = null;
    this.paused = false;
    this.lastT = performance.now();
    persist(this.save);
    (document.getElementById("portModal") as HTMLElement).hidden = true;
  }

  // Le tableau est construit une fois ; ensuite on ne change que les chiffres (pas de reconstruction : aucun clignotement).
  private portCells: { stock: HTMLElement; can: HTMLElement; dock: HTMLElement; quota: HTMLElement; reserve: HTMLElement; g: ExportGood }[] = [];
  private portBuiltFor: Port | null = null;

  private renderPort() {
    const port = this.portOpen;
    if (!port || !this.save.ports.includes(port)) return this.closePort();
    const s = this.save;
    const body = document.getElementById("portBody") as HTMLElement;
    const sub = document.getElementById("portSub") as HTMLElement;
    const f = port.t / SHIP_CYCLE;
    const secs = (frac: number) => Math.max(0, Math.round(((((frac - f) % 1) + 1) % 1) * SHIP_CYCLE));
    const state = f >= SHIP_ARRIVE - 0.02 && f < SHIP_DOCKED ? "⛵ Bateau en approche" : f >= SHIP_DOCKED && f < SHIP_DEPART ? "⛵ Chargement" : "🌊 Bateau au large";
    const maxGain = EXPORT_LIST.reduce((a, g) => a + portQuota(port, g) * EXPORT_GOODS[g].price, 0);
    const subText = `${state} · départ dans ${secs(SHIP_DEPART)} s · gain maximum ${maxGain} 🪙`;
    if (sub.textContent !== subText) sub.textContent = subText;
    const set = (el: HTMLElement, text: string) => {
      if (el.textContent !== text) el.textContent = text;
    };
    if (this.portBuiltFor !== port) {
      this.portBuiltFor = port;
      this.portCells = [];
      body.textContent = "";
      const note = document.createElement("p");
      note.className = "portNote";
      const linked = this.linkedTo(portEntrance(port), s.depots.map(depotEntrance));
      note.textContent = `Pour chaque ressource, règle combien part par bateau (0 : pas d'export) et le stock minimum à garder au village : seul ce qui dépasse ce minimum est exporté. Maj + clic : de 5 en 5.${linked ? "" : " ⚠ Aucun dépôt n'est relié au port par un chemin : les porteurs ne pourront rien apporter."}`;
      body.appendChild(note);
      const table = document.createElement("table");
      const head = table.createTHead().insertRow();
      for (const t of ["Ressource", "Prix", "En stock", "Exporter par bateau", "Stock minimum à garder", "Peut partir", "Au quai"]) {
        const th = document.createElement("th");
        th.textContent = t;
        head.appendChild(th);
      }
      const tbody = table.createTBody();
      const stepper = (td: HTMLElement, get: () => number, put: (v: number) => void) => {
        const box = document.createElement("span");
        box.className = "pStep";
        const v = document.createElement("b");
        const mk = (text: string, delta: number) => {
          const b = document.createElement("button");
          b.className = "round";
          b.textContent = text;
          b.addEventListener("click", (ev) => {
            put(Math.max(0, Math.min(PORT_CAP, get() + delta * (ev.shiftKey ? 5 : 1))));
            persist(this.save);
            this.renderPort();
          });
          return b;
        };
        box.append(mk("−", -1), v, mk("+", 1));
        td.appendChild(box);
        return v;
      };
      for (const g of EXPORT_LIST) {
        const def = EXPORT_GOODS[g];
        const tr = tbody.insertRow();
        tr.insertCell().textContent = `${def.emoji} ${def.label}`;
        tr.insertCell().textContent = `${def.price} 🪙`;
        const stock = tr.insertCell();
        const quota = stepper(tr.insertCell(), () => portQuota(port, g), (v) => (port.quota[g] = v));
        const reserve = stepper(tr.insertCell(), () => portReserve(port, g), (v) => ((port.reserve ??= {})[g] = v));
        const can = tr.insertCell();
        const dock = tr.insertCell();
        this.portCells.push({ stock, can, dock, quota, reserve, g });
      }
      body.appendChild(table);
    }
    for (const c of this.portCells) {
      const g = c.g;
      set(c.stock, String(villageStock(s, g)));
      set(c.quota, String(portQuota(port, g)));
      set(c.reserve, String(portReserve(port, g)));
      set(c.can, String(exportable(s, port, g)));
      set(c.dock, portQuota(port, g) > 0 ? `${portStock(port, g)} / ${portQuota(port, g)}` : "—");
    }
  }

  // Le tableau des villageois : le jeu se met en pause pendant qu'il est ouvert.
  private openFolk() {
    this.paused = true;
    this.renderFolk();
    (document.getElementById("folkModal") as HTMLElement).hidden = false;
  }

  private closeFolk() {
    this.paused = false;
    this.lastT = performance.now(); // pas de saut de temps à la reprise
    (document.getElementById("folkModal") as HTMLElement).hidden = true;
  }

  private renderFolk() {
    const s = this.save;
    const body = document.getElementById("folkBody") as HTMLElement;
    const sub = document.getElementById("folkSub") as HTMLElement;
    const sick = this.workers.filter((w) => w.data.illness).length;
    const jobless = this.workers.filter((w) => !w.data.workplace).length;
    sub.textContent = `${this.workers.length} villageois · ${s.houses.length * HOUSE_CAPACITY} places en maison · ${sick} malade${sick > 1 ? "s" : ""} · ${jobless} sans emploi`;
    type Row = { w: Worker; name: string; age: number; job: string; state: string; health: string; hv: number; tired: number; thirst: number; hunger: number; mood: number; home: string };
    const rows: Row[] = this.workers.map((w) => {
      const il = w.data.illness;
      return {
        w,
        name: w.name,
        age: Math.floor(w.data.age ?? 25),
        job: w.data.workplace ? JOBS[w.data.workplace.kind].label : "Sans emploi",
        state: w.activity,
        health: il ? `${ILLNESSES[il.kind].emoji} ${ILLNESSES[il.kind].label} ${Math.round(il.sev)} %` : (w.data.protect ?? 0) > 0 ? "🛡️ Protégé" : "En forme",
        hv: il ? il.sev : -1,
        tired: Math.round(100 - w.energy),
        thirst: Math.round(w.data.thirst ?? 0),
        hunger: Math.round(w.data.hunger ?? 0),
        mood: Math.round(w.data.discontent ?? 0),
        home: w.data.home != null ? "Oui" : "Sans maison",
      };
    });
    const { key, dir } = this.folkSort;
    const sortVal = (r: Row): number | string => (key === "health" ? r.hv : (r as unknown as Record<string, number | string>)[key]);
    rows.sort((a, b) => {
      const x = sortVal(a);
      const y = sortVal(b);
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "fr")) * dir;
    });
    const cols: [string, string][] = [["name", "Prénom"], ["age", "Âge"], ["job", "Emploi"], ["state", "Activité"], ["health", "Santé"], ["tired", "Fatigue"], ["thirst", "Soif"], ["hunger", "Faim"], ["mood", "Colère"], ["home", "Maison"]];
    const table = document.createElement("table");
    const head = table.createTHead().insertRow();
    for (const [k, label] of cols) {
      const th = document.createElement("th");
      th.textContent = label + (k === key ? (dir === 1 ? " ▲" : " ▼") : "");
      th.addEventListener("click", () => {
        this.folkSort = { key: k, dir: k === key ? (dir === 1 ? -1 : 1) : 1 };
        this.renderFolk();
      });
      head.appendChild(th);
    }
    const tbody = table.createTBody();
    const meter = (td: HTMLElement, pct: number) => {
      const m = document.createElement("span");
      m.className = "meter";
      const i = document.createElement("i");
      i.style.width = `${Math.min(100, pct)}%`;
      if (pct >= 75) i.className = "full";
      m.appendChild(i);
      td.append(m, `${pct} %`);
    };
    for (const r of rows) {
      const tr = tbody.insertRow();
      if (r.w.data.illness) tr.className = "sick";
      tr.addEventListener("click", () => {
        this.closeFolk();
        this.selectWorker(r.w);
        this.follow = true; // la caméra va le chercher
      });
      const tdName = tr.insertCell();
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = CREW_COLORS[r.w.data.color % CREW_COLORS.length];
      tdName.append(dot, r.name);
      tr.insertCell().textContent = `${r.age} ans${r.age >= AGE_ELDER ? " 🧓" : ""}`;
      tr.insertCell().textContent = r.job;
      tr.insertCell().textContent = r.state;
      const th = tr.insertCell();
      th.textContent = r.health;
      th.className = r.hv >= 0 ? "bad" : "good";
      meter(tr.insertCell(), r.tired);
      meter(tr.insertCell(), r.thirst);
      meter(tr.insertCell(), r.hunger);
      meter(tr.insertCell(), r.mood);
      const tdHome = tr.insertCell();
      tdHome.textContent = r.home;
      if (r.home !== "Oui") tdHome.className = "bad";
    }
    body.textContent = "";
    body.appendChild(table);
  }

  // Menu du villageois sélectionné (même place que celui des bâtiments : en haut à droite) : son métier, sa fatigue, de quoi le mettre au repos.
  private updateWorkerMenu() {
    const w = this.selected;
    const box = document.getElementById("campMenu") as HTMLElement;
    if (!w || this.campSel || this.depotSel || this.siteSel || this.houseSel || this.sawmillSel || this.wellSel || this.lodgeSel || this.butcherSel || this.clinicSel || this.portSel || this.apiarySel || this.churchSel || this.farmSel) return;
    const job = w.data.job ?? w.data.resume?.job ?? null;
    const role = w.data.job ? w.role : w.data.resume?.role ?? w.role;
    const jobs: Record<string, string> = { none: "Villageois", wood: "Bûcheron", haul: "Porteur", build: "Bâtisseur", water: "Corvée", hunt: "Chasseur", bee: "Apiculteur", gather: "Cueilleur", heal: "Soigneur", bury: "Fossoyeur", farm: "Fermier", tend: "Éleveur", swine: "Porcher", cook: "Cuisinier" };
    let metier = w.data.workplace ? JOBS[w.data.workplace.kind].label : jobs[role] ?? "Villageois"; // son métier est celui de son emploi
    if (role === "water" && job?.type === "water") metier = job.dine !== undefined ? "Au repas" : job.food ? "Corvée de vivres" : "Corvée d'eau";
    const emojis: Record<string, string> = { none: "🧑‍🌾", wood: "🪓", haul: "📦", build: "🔨", water: "💧", hunt: "🏹", bee: "🐝", craft: "🛠️", gather: "🫐", heal: "🩺", bury: "⛪", farm: "🌾", tend: "🥛", swine: "🐖", cook: "🍲" };
    const tired = Math.round(100 - w.energy);
    const state = w.data.visit ? (w.inside ? "Boit et mange" : "Rentre boire ou manger") : w.inside ? (w.resting ? "Se repose" : w.fem ? "Chez elle" : "Chez lui") : w.resting ? "Rentre se reposer" : w.moving ? "En route" : w.working ? "Au travail" : "Disponible";
    const sv = this.save;
    const sig = `v${w.name}|${Math.floor(w.data.age ?? 25)}|${role}|${metier}|${healSkill(w.data.xp ?? 0).level}${Math.floor((w.data.xp ?? 0) / 2)}|${Math.ceil((w.data.protect ?? 0) / 30)}|${w.data.illness ? w.data.illness.kind + Math.round(w.data.illness.sev / 4) : "-"}|${w.data.workplace ? w.data.workplace.kind + w.data.workplace.id : "-"}|${Math.round(tired / 4)}|${Math.round((w.data.thirst ?? 0) / 4)}|${Math.round((w.data.hunger ?? 0) / 4)}|${Math.round((w.data.discontent ?? 0) / 4)}|${w.data.threat !== undefined ? Math.round((w.data.threat ?? 0) / 3) : "-"}|${state}|${w.data.carry}|${w.data.home ?? "-"}|${w.working ? 1 : 0}|${this.jobMenuOpen}|${sv.depots.length}${sv.sawmills.length}${sv.butchers.length}${sv.lodges.length}${sv.apiaries.length}${sv.sites.length}`;
    // ce que fait le villageois : son clic sonne comme son activité
    const cue: Cue =
      (w.data.discontent ?? 0) >= 50
        ? "angry"
        : w.data.visit
          ? "eat"
          : w.inside || w.resting
            ? "rest"
            : w.data.job?.type === "water"
              ? "water"
              : w.role === "build"
                ? "hammer"
                : w.role === "craft"
                  ? "saw"
                  : w.role === "wood" && w.working
                    ? "wood"
                    : w.role === "hunt"
                      ? "hunt"
                      : w.role === "bee"
                        ? "bee"
                        : w.data.carry > 0
                          ? "carry"
                          : w.moving
                            ? "walk"
                            : "idle";
    this.showMenu(box, "v" + w.name, cue);
    if (sig === this.menuSig) return;
    this.menuSig = sig;
    box.textContent = "";
    const div = (cls: string, text?: string) => {
      const d = document.createElement("div");
      d.className = cls;
      if (text !== undefined) d.textContent = text;
      return d;
    };
    const span = (cls: string, text: string) => {
      const s = document.createElement("span");
      s.className = cls;
      s.textContent = text;
      return s;
    };
    const h = div("mHead");
    h.append(span("mEmoji", emojis[role] ?? "🧑‍🌾"), span("mTitle", w.name), span("mAge", `${Math.floor(w.data.age ?? 25)} ans`), span("mAside", metier)); // son métier, à droite du prénom
    box.appendChild(h);
    const chips = div("mChips");
    if (w.data.illness) chips.appendChild(span(`mChip ${w.data.illness.sev >= SICK_BED ? "bad" : "idle"}`, `${ILLNESSES[w.data.illness.kind].emoji} ${ILLNESSES[w.data.illness.kind].label}`));
    chips.appendChild(span(`mChip ${tired >= 75 ? "bad" : w.working || w.moving ? "ok" : "idle"}`, tired >= 75 ? "Épuisé" : state));
    box.appendChild(chips);
    const stat = (label: string, value: string) => {
      const row = div("mStat");
      row.append(span("", label), span("mVal", value));
      box.appendChild(row);
    };
    stat("Fatigue", `${tired} %`);
    const b = div("menuBar");
    const fill = document.createElement("i");
    fill.style.width = `${tired}%`;
    fill.className = tired >= 75 ? "full" : "";
    b.appendChild(fill);
    box.appendChild(b);
    if ((w.data.age ?? 25) >= AGE_ELDER) stat("🧓 Grand âge", w.fem ? "âgée" : "âgé");
    const meter = (label: string, pct: number) => {
      stat(label, `${pct} %`);
      const mb = div("menuBar");
      const mf = document.createElement("i");
      mf.style.width = `${pct}%`;
      mf.className = pct >= 75 ? "full" : "";
      mb.appendChild(mf);
      box.appendChild(mb);
    };
    meter("💧 Soif", Math.round(w.data.thirst ?? 0));
    meter("🥩 Faim", Math.round(w.data.hunger ?? 0));
    if ((w.data.protect ?? 0) > 0) stat("🛡️ Protégé", `${Math.ceil((w.data.protect ?? 0) / 60)} min`);
    if (w.role === "heal" || (w.data.xp ?? 0) > 0) {
      const sk = healSkill(w.data.xp ?? 0);
      stat("🩺 Expérience", `${sk.label} · ${Math.floor(w.data.xp ?? 0)}${sk.to ? ` / ${sk.to}` : ""}`);
      if (sk.to) {
        const xb = div("menuBar");
        const xf = document.createElement("i");
        xf.style.width = `${Math.min(100, (((w.data.xp ?? 0) - sk.from) / (sk.to - sk.from)) * 100)}%`;
        xb.appendChild(xf);
        box.appendChild(xb);
      }
    }
    if (w.data.illness) meter(`${ILLNESSES[w.data.illness.kind].emoji} ${ILLNESSES[w.data.illness.kind].label}`, Math.round(w.data.illness.sev));
    const unrest = Math.round(w.data.discontent ?? 0);
    stat("😠 Mécontentement", `${unrest} %`);
    const ub = div("menuBar");
    const uf = document.createElement("i");
    uf.style.width = `${unrest}%`;
    uf.className = unrest >= 75 ? "full" : "";
    ub.appendChild(uf);
    box.appendChild(ub);
    if (w.data.threat !== undefined) stat("💢 Menace de partir", `${Math.max(0, Math.round(w.data.threat))} s`);
    if (w.data.carry > 0) stat("Porte", `${w.data.carry} ${w.data.cargo === "plank" ? "🪚" : w.data.cargo === "water" ? "💧" : w.data.cargo === "meat" ? "🍖" : w.data.cargo === "cuts" ? "🥩" : w.data.cargo === "honey" ? "🍯" : w.data.cargo === "berries" ? "🫐" : w.data.cargo && w.data.cargo in FARM_CROPS ? FARM_CROPS[w.data.cargo as FarmCrop].emoji : "🪵"}`);
    // changer de travail : la liste des travaux possibles, d'après ce qui existe au village
    const change = document.createElement("button");
    change.className = "round menuItem";
    change.textContent = this.jobMenuOpen ? "🔁 Changer d'emploi ▴" : "🔁 Changer d'emploi ▾";
    change.addEventListener("click", () => {
      this.jobMenuOpen = !this.jobMenuOpen;
      this.menuSig = "";
    });
    box.appendChild(change);
    if (this.jobMenuOpen) {
      const list = div("jobList");
      const pick = (label: string, fn: () => void) => {
        const b = document.createElement("button");
        b.className = "round menuItem jobOpt";
        b.textContent = label;
        b.addEventListener("click", () => {
          fn();
          this.jobMenuOpen = false;
          this.menuSig = "";
        });
        list.appendChild(b);
      };
      // les postes encore libres, d'après les bâtiments qui existent
      const places: { kind: WorkplaceKind; id: number; emoji: string; name: string }[] = [
        ...sv.camps.map((m) => ({ kind: "camp" as const, id: m.id, emoji: "🪓", name: "camp de bûcheron" })),
        ...sv.lodges.map((m) => ({ kind: "lodge" as const, id: m.id, emoji: "🏹", name: "camp de chasseur" })),
        ...sv.apiaries.map((m) => ({ kind: "apiary" as const, id: m.id, emoji: "🐝", name: "rucher" })),
        ...sv.clinics.map((m) => ({ kind: "clinic" as const, id: m.id, emoji: "🩺", name: "maison du soigneur" })),
        ...sv.churches.map((m) => ({ kind: "church" as const, id: m.id, emoji: "⛪", name: "église" })),
        ...sv.farms.map((m) => ({ kind: "farm" as const, id: m.id, emoji: "🌾", name: "ferme" })),
        ...sv.taverns.map((m) => ({ kind: "tavern" as const, id: m.id, emoji: "🍲", name: "taverne" })),
        ...sv.pigpens.map((m) => ({ kind: "pigpen" as const, id: m.id, emoji: "🐖", name: "porcherie" })),
        ...sv.stables.map((m) => ({ kind: "stable" as const, id: m.id, emoji: "🐄", name: "étable" })),
        { kind: "site" as const, id: 0, emoji: "🔨", name: "chantiers" },
        ...sv.depots.map((m) => ({ kind: "depot" as const, id: m.id, emoji: "📦", name: "dépôt" })),
        ...sv.depots.map((m) => ({ kind: "gather" as const, id: m.id, emoji: "🫐", name: "dépôt (cueillette)" })),
        ...sv.ports.map((m) => ({ kind: "port" as const, id: m.id, emoji: "⚓", name: "port" })),
        ...sv.sawmills.map((m) => ({ kind: "sawmill" as const, id: m.id, emoji: "🏭", name: "scierie" })),
        ...sv.butchers.map((m) => ({ kind: "butcher" as const, id: m.id, emoji: "🥩", name: "boucherie" })),
      ];
      let any = false;
      // les porteurs (de dépôt ou de port) et les cueilleurs ne dépendent pas d'un bâtiment précis : un seul choix chacun, au premier poste libre
      const pooled: Partial<Record<WorkplaceKind, string>> = { depot: "p", port: "p", gather: "g", site: "b" };
      const shown = new Set<string>();
      for (const p of places) {
        const here = w.data.workplace?.kind === p.kind && w.data.workplace.id === p.id;
        if (here || this.employeesAt(p.kind, p.id).length >= JOBS[p.kind].slots) continue;
        const pool = pooled[p.kind];
        if (pool) {
          const isMine = pool === "p" ? w.data.workplace?.kind === "depot" || w.data.workplace?.kind === "port" : pool === "b" ? w.data.workplace?.kind === "site" : w.data.workplace?.kind === "gather";
          if (isMine || shown.has(pool)) continue;
          shown.add(pool);
          any = true;
          pick(pool === "p" ? "📦 Porteur · transporte tout" : pool === "b" ? "🔨 Bâtisseur · construit les chantiers" : "🫐 Cueilleur · ramasse les baies", () => this.hire(w, p.kind, p.id));
          continue;
        }
        any = true;
        const same = places.filter((q) => q.kind === p.kind);
        pick(`${p.emoji} ${JOBS[p.kind].label} · ${p.name}${same.length > 1 ? " " + (same.indexOf(p) + 1) : ""}`, () => this.hire(w, p.kind, p.id));
      }
      if (!any) list.appendChild(div("mNone", "Aucun poste libre"));
      if (w.data.workplace) pick("🧑‍🌾 Sans emploi (quitter son poste)", () => this.fire(w));
      box.appendChild(list);
    }
  }

  // Barre d'équipe : une pastille par personnage, son état, et le recrutement.
  private updateCrew() {
    const sel = this.selected;
    const sig = this.workers.map((w) => w.name + (w === sel ? "*" : "") + w.status + (w.data.home ?? "-")).join("|") + "/" + this.save.coins + "/" + this.save.houses.length;
    if (sig === this.crewSig) return;
    this.crewSig = sig;
    const box = document.getElementById("crew") as HTMLElement;
    box.textContent = "";
  }

  private updateHud() {
    const setNum = (id: string, v: number) => {
      const el = document.getElementById(id) as HTMLElement;
      if (el.textContent === String(v)) return;
      const first = el.textContent === "0" && v === 0;
      el.textContent = String(v);
      const pill = el.parentElement;
      if (pill && !first) {
        pill.classList.remove("bump");
        void pill.offsetWidth;
        pill.classList.add("bump");
      }
    };
    const hour = clockHour(this.save.clock);
    const dk = darkness(hour);
    const hh = Math.floor(hour);
    const mm = Math.floor((hour - hh) * 60 / 10) * 10; // toutes les 10 minutes de jeu
    const label = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    const icon = dk > 0.8 ? "🌙" : dk > 0.05 ? (hour < 12 ? "🌅" : "🌇") : "☀️";
    const clockEl = document.getElementById("clock") as HTMLElement;
    if (clockEl.textContent !== label) clockEl.textContent = label;
    const clockIcon = document.getElementById("clockIcon") as HTMLElement;
    if (clockIcon.textContent !== icon) clockIcon.textContent = icon;
    const se = this.season();
    const calendar = document.getElementById("calendar") as HTMLElement;
    const seasonText = `${se.rules.label}`;
    const seasonIcon = document.getElementById("seasonIcon") as HTMLElement;
    const seasonName = document.getElementById("seasonName") as HTMLElement;
    if (seasonName.textContent !== seasonText) seasonName.textContent = seasonText;
    if (seasonIcon.textContent !== se.rules.emoji) seasonIcon.textContent = se.rules.emoji;
    calendar.title = `${se.rules.label} : ${se.rules.blurb}`;
    const dateText = `Jour ${clockDay(this.save.clock)} · année ${se.year} · ${se.dayInSeason}/${SEASON_DAYS}`;
    const calDate = document.getElementById("calDate") as HTMLElement;
    if (calDate.textContent !== dateText) calDate.textContent = dateText;
    (document.getElementById("calBar") as HTMLElement).style.width = `${Math.round(se.prog * 100)}%`; // avancement de la saison
    if (this.seasonSeen !== se.index) {
      // nouvelle saison (pas d'annonce au chargement de la partie)
      if (this.seasonSeen >= 0) toast(`${se.rules.emoji} ${se.rules.label} : ${se.rules.blurb}`);
      this.seasonSeen = se.index;
    }
    const folks = this.workers.length;
    const beds = this.save.houses.length * HOUSE_CAPACITY;
    const homeless = this.workers.filter((w) => w.data.home == null).length;
    const popEl = document.getElementById("pop") as HTMLElement;
    const popText = `${folks} / ${beds}`;
    if (popEl.textContent !== popText) {
      popEl.textContent = popText;
      const pill = popEl.parentElement;
      if (pill) {
        pill.classList.remove("bump");
        void pill.offsetWidth;
        pill.classList.add("bump");
      }
    }
    (popEl.parentElement as HTMLElement).title = `${folks} villageois pour ${beds} places en maison${homeless ? ` · ${homeless} sans maison` : ""}`;
    setNum("coins", this.save.coins);
    const cap = storageCapacity(this.save);
    const entries = Object.entries(this.save.goods);
    if (this.save.sawmills.length || planksStock(this.save) > 0) entries.push(["planks", planksStock(this.save)]);
    if (this.save.butchers.length || cutsStock(this.save) > 0) entries.push(["cuts", cutsStock(this.save)]); // la viande préparée : boucheries et dépôts
    if (this.save.apiaries.length || honeyStock(this.save) > 0) entries.push(["honey", honeyStock(this.save)]); // le miel : ruchers et dépôts
    const sickN = this.workers.filter((w) => w.data.illness).length;
    if (sickN > 0) entries.push(["sick", sickN]); // les malades
    const fluN = this.workers.filter((w) => w.data.illness?.kind === "flu").length;
    if (fluN > 0) entries.push(["flu", fluN]); // l'épidémie de grippe
    const milkN = this.save.depots.reduce((a, d) => a + (d.milk ?? 0), 0);
    if (milkN > 0) entries.push(["milk", milkN]); // le lait des dépôts
    for (const [id, n] of Object.entries(cropStock(this.save))) if (n > 0) entries.push([id, n]); // les récoltes : blé, maïs, tomates, carottes
    if (berryStock(this.save) > 0) entries.push(["berries", berryStock(this.save)]); // les baies : dans les dépôts
    if (this.save.lodges.length) entries.push(["meat", meatStock(this.save)]); // la viande est celle des camps de chasseur // les planches sont celles des scieries
    const goods = entries
      .filter(([k, n]) => n > 0 || (k === "cuts" && (this.save.butchers.length > 0 || cutsStock(this.save) > 0)) || (k === "honey" && (this.save.apiaries.length > 0 || honeyStock(this.save) > 0)) || (k === "meat" && this.save.lodges.length > 0) || (k === "planks" && (this.save.sawmills.length > 0 || planksStock(this.save) > 0)))
      .map(([k, n]) => `${GOOD_EMOJIS[k] ?? k} ${k === "wood" ? `${n}/${cap}` : n}`)
      .join("|");
    if (goods === this.goodsSig) return;
    this.goodsSig = goods;
    const box = document.getElementById("goods") as HTMLElement;
    box.textContent = "";
    const now = goods.split("|").filter(Boolean);
    now.forEach((g, i) => {
      const pill = document.createElement("div");
      pill.className = "pill" + (this.goodsPrev.length && this.goodsPrev[i] !== g ? " bump" : ""); // seules les pastilles qui changent rebondissent
      pill.textContent = g;
      box.appendChild(pill);
    });
    this.goodsPrev = now;
  }
}
