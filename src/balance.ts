// Équilibrage du jeu : tous les chiffres qui règlent l'économie, au même endroit.
//
// Repères de rythme (un bûcheron coupe à peu près 20 bûches par minute, un arbre en donne 2 à 4) :
//   • une scierie scie 12 planches par minute et absorbe donc 24 bûches par minute : un bûcheron pour une scierie ;
//   • une maison coûte 8 planches = 16 bûches, soit moins d'une minute de bûcheron... mais il faut tout transporter et construire ;
//   • un habitant boit 1 eau par minute et mange 1 portion par minute et demie : un puits abreuve plus de 10 habitants,
//     un chasseur nourrit largement tout le village ;
//   • les pièces ne viennent plus que de l'export au port : le village doit produire et stocker de quoi vendre ;

// ---------- départ ----------
export const START_COINS = 1000; // pour les essais (160 suffisaient pour camp, scierie, maison et quelques chemins)
export const MAX_CREW = 10; // villageois au maximum
export const ARRIVAL_SEC = 90; // tant qu'une maison a une place libre, un villageois arrive toutes les 90 s
export const HOUSE_CAPACITY = 2; // villageois logés par maison

// ---------- constructions : pièces, matériaux à livrer, temps de construction (s) ----------
// Camps, scierie et puits se font avec des bûches ; maisons, dépôts et boucherie avec des planches (donc après la scierie).
export const COSTS = {
  road: { coins: 1, mat: 0, sec: 0 }, // par case
  camp: { coins: 25, mat: 0, sec: 6 }, // camp de bûcheron
  lodge: { coins: 25, mat: 0, sec: 6 }, // camp de chasseur
  well: { coins: 20, mat: 8, sec: 8 }, // bûches
  sawmill: { coins: 40, mat: 10, sec: 12 }, // bûches
  house: { coins: 30, mat: 8, sec: 8 }, // planches
  butcher: { coins: 40, mat: 10, sec: 12 }, // planches
  depot: { coins: 0, mat: 12, sec: 10 }, // planches
  apiary: { coins: 30, mat: 6, sec: 8 }, // planches ; un rucher de quatre ruches
  port: { coins: 60, mat: 14, sec: 14 }, // planches ; sur la côte seulement
  clinic: { coins: 40, mat: 8, sec: 8 }, // planches ; la maison du soigneur
  church: { coins: 70, mat: 16, sec: 16 }, // planches ; l'église et son cimetière
  farm: { coins: 90, mat: 20, sec: 18 }, // planches ; la ferme (5 × 5 cases, douze parcelles)
  stable: { coins: 70, mat: 16, sec: 14 }, // planches ; l'étable (4 × 4 cases) et son enclos
  market: { coins: 50, mat: 12, sec: 12 }, // planches ; le marché (3 × 3 cases) où passe la caravane
  pigpen: { coins: 60, mat: 14, sec: 12 }, // planches ; la porcherie (4 × 4 cases) et son enclos
};

// ---------- villageois ----------
export const SPEED = 3.4; // cases par seconde
export const CHOP_SECONDS = 1.6; // temps pour abattre un arbre
export const LOAD_SECONDS = 0.8; // temps pour charger ou décharger
export const CARRY_MAX = 6; // bois qu'un bûcheron porte
export const HAUL_MAX = 8; // ce qu'un porteur prend d'un coup
export const IDLE_HOME_SEC = 20; // à ne rien faire, un villageois rentre chez lui au bout de ce temps

// fatigue : énergie de 0 à 100
export const DRAIN = 0.28; // perdue par seconde en marchant ou en travaillant (environ 6 minutes avant l'épuisement)
export const REST_RATE = 3; // regagnée par seconde chez soi (une demi-minute pour se remettre)
export const IDLE_RATE = 0; // à l'arrêt, dehors, on ne récupère rien : il faut rentrer se reposer chez soi
export const TIRED = 25; // en dessous, il avance moins vite
export const EXHAUSTED = 8; // en dessous, il rentre se reposer
export const WAKE_AT = 95; // énergie à retrouver avant de repartir au travail

// ---------- stockage ----------
export const CAMP_CAPACITY = 20; // bûches d'un camp de bûcheron
// Améliorations d'un dépôt : niveau 1 (de base), 2 et 3. Passer au niveau suivant coûte des pièces et des planches (prises dans les stocks).
export const DEPOT_LEVELS = [
  { cap: 60, coins: 0, planks: 0 },
  { cap: 120, coins: 40, planks: 12 },
  { cap: 200, coins: 80, planks: 24 },
];
export const DEPOT_CAPACITY = 60; // places d'un dépôt (planches et viande préparée)

// ---------- scierie ----------
export const SAWMILL_LOGS_CAP = 24; // bûches en attente
export const SAWMILL_PLANKS_CAP = 24; // planches stockées
export const LOGS_PER_PLANK = 2;
export const PLANK_SEC = 5; // temps pour scier une planche

// ---------- eau ----------
export const WELL_CAP = 12; // réserve d'un puits
export const WELL_REFILL_SEC = 4; // il se remplit d'une unité toutes les 4 s
export const HOUSE_WATER_CAP = 8; // réserve d'une maison
export const HOUSE_WATER_START = 6; // une maison neuve est déjà approvisionnée
export const WATER_SEC = 60; // un habitant boit une unité toutes les 60 s
// Soif et faim personnelles : de 0 % (comblé) à 100 %. Passé NEED_GO, le villageois rentre chez lui boire ou manger (1 unité de la réserve de sa maison) ;
// si la maison n'a rien, il reste assoiffé ou affamé et, passé NEED_BAD, son mécontentement monte.
export const THIRST_FULL_SEC = 240; // de comblé à 100 % de soif
export const HUNGER_FULL_SEC = 360;
export const NEED_GO = 60; // % à partir duquel il rentre chez lui
export const NEED_BAD = 80; // % : il traîne, et sans rien à la maison il s'énerve
export const NEED_UNREST = 0.5; // points de mécontentement par seconde quand sa maison ne peut pas le satisfaire
export const WATER_MAX = 4; // eau portée par un habitant en corvée

// ---------- chasse et viande ----------
export const LODGE_CAP = 16; // viande d'un camp de chasseur
export const HUNT_CARRY = 4; // viande portée par un chasseur avant de rentrer
export const HUNT_RADIUS = 18; // rayon de chasse autour du camp, en cases
export const HUNT_RANGE = 2.2; // distance de tir, en cases
export const AIM_SECONDS = 0.9; // temps pour viser
export const BUTCHER_MEAT_CAP = 20; // viande brute en attente à la boucherie
export const BUTCHER_CUTS_CAP = 20; // viande préparée stockée à la boucherie
export const CUT_SEC = 6; // temps pour préparer une portion

// ---------- nourriture des foyers ----------
export const HOUSE_FOOD_CAP = 8; // réserve d'une maison
export const HOUSE_FOOD_START = 4; // une maison neuve a déjà de quoi manger un peu
export const FOOD_SEC = 90; // un habitant mange une portion toutes les 90 s
export const FOOD_MAX = 4; // nourriture portée par un habitant en corvée

// ---------- port : l'export ----------
export const PORT_CAP = 24; // quantité maximale qu'on peut choisir d'exporter par bateau et par marchandise
export const PORT_QUOTA_DEFAULT = 0; // quantité exportée par bateau au départ : rien, c'est au joueur de régler chaque marchandise dans le menu du port
export const SHIP_CYCLE = 120; // un bateau passe toutes les 120 s
// Tout ce que le port peut exporter : chaque ressource a son prix et son propre réglage « par bateau ». Les identifiants sont ceux de ce que portent les villageois.
export const EXPORT_GOODS = {
  wood: { label: "Bûches", emoji: "🪵", price: 1 }, // prises dans les camps de bûcheron
  plank: { label: "Planches", emoji: "🪚", price: 2 }, // dépôts et scieries
  meat: { label: "Viande brute", emoji: "🍖", price: 2 }, // camps de chasseur
  cuts: { label: "Viande préparée", emoji: "🥩", price: 3 }, // dépôts et boucheries
  honey: { label: "Miel", emoji: "🍯", price: 4 },
  berries: { label: "Baies", emoji: "🫐", price: 2 },
  wheat: { label: "Blé", emoji: "🌾", price: 2 },
  corn: { label: "Maïs", emoji: "🌽", price: 3 },
  tomato: { label: "Tomates", emoji: "🍅", price: 4 },
  carrot: { label: "Carottes", emoji: "🥕", price: 2 },
  grass: { label: "Herbe", emoji: "🌿", price: 1 },
  milk: { label: "Lait", emoji: "🥛", price: 3 },
} as const;
export type ExportGood = keyof typeof EXPORT_GOODS;
export const PRICE_PLANK = 2; // pièces par planche exportée
export const PRICE_CUTS = 3; // pièces par viande préparée exportée
export const PRICE_HONEY = 4; // pièces par pot de miel exporté
export const PRICE_BERRIES = 2; // pièces par baie exportée
// (le prix d'une récolte dépend de la culture : voir FARM_CROPS)

// ---------- faune ----------
export const POPULATION = { rabbit: 36, deer: 10, boar: 6 }; // effectif d'origine
export const MEAT = { rabbit: 1, deer: 3, boar: 2 }; // portions de viande par animal chassé
export const REPOP_SEC = 30; // toutes les 30 s, une espèce qui manque d'individus en regagne un

// ---------- apiculture ----------
export const HONEY_CAP = 16; // pots de miel qu'un rucher peut garder
export const HONEY_SEC = 30; // secondes pour un pot de miel, ruches parfaitement soignées (avant le facteur de saison)
export const HIVE_CARE_SEC = 150; // sans soin, les ruches sont à l'abandon au bout de ce temps (hors hiver)
export const TEND_BELOW = 70; // l'apiculteur va soigner les ruches quand le soin tombe sous ce niveau (en %)
export const TEND_SEC = 6; // durée d'un soin
export const HARVEST_MIN = 4; // pots à partir desquels il récolte
export const HARVEST_MAX = 8; // pots qu'il porte d'un coup
export const HARVEST_SEC = 3; // durée d'une récolte

// ---------- emploi ----------
// Chaque bâtiment qui emploie des villageois a un nombre de postes. On recrute un villageois sans emploi depuis le menu du bâtiment,
// et on peut le virer. La scierie et la boucherie ne fonctionnent que si au moins un employé y travaille (chaque employé en plus
// double la cadence : 2 postes = 2 fois plus vite).
export const JOBS = {
  camp: { slots: 3, label: "Bûcheron" }, // coupe les arbres autour du camp et les y dépose
  lodge: { slots: 2, label: "Chasseur" },
  apiary: { slots: 1, label: "Apiculteur" },
  site: { slots: 3, label: "Bâtisseur" },
  depot: { slots: 3, label: "Porteur" }, // transporte tout, d'un bâtiment à l'autre
  port: { slots: 2, label: "Porteur" },
  sawmill: { slots: 2, label: "Scieur" },
  butcher: { slots: 2, label: "Boucher" },
  pigpen: { slots: 2, label: "Porcher" }, // nourrit et fait boire les cochons, les abat quand on le demande et rapporte la viande au dépôt
  stable: { slots: 2, label: "Éleveur" }, // nourrit et fait boire les vaches, trait le lait et le range au dépôt
  farm: { slots: 3, label: "Fermier" }, // sème, fait pousser et récolte les parcelles, puis range la récolte au dépôt
  church: { slots: 2, label: "Fossoyeur" }, // va chercher les défunts devant leur maison et les met au cimetière
  clinic: { slots: 2, label: "Soigneur" }, // prépare des remèdes avec des baies et du miel, et soigne les malades
  gather: { slots: 2, label: "Cueilleur" }, // employé d'un dépôt : cueille les baies alentour et les y range
};
export type WorkplaceKind = keyof typeof JOBS;
export const LUMBER_RADIUS = 10; // un bûcheron employé coupe dans ce rayon (en cases) autour de son camp

// ---------- âge ----------
// Chaque villageois vieillit avec le temps du jeu : AGE_YEARS_PER_DAY ans par jour (un jour = DAY_SEC secondes). Il meurt de vieillesse à son espérance de vie
// (tirée au hasard entre LIFESPAN_MIN et LIFESPAN_MAX). Les anciens vont moins vite, se fatiguent plus et tombent plus souvent malades.
export const AGE_YEARS_PER_DAY = 5; // (jours de 600 s : on vieillit au même rythme réel qu'avec 2 ans par jour de 240 s)
export const AGE_START = [20, 38]; // âge des premiers villageois
export const AGE_ARRIVAL = [18, 30]; // âge de ceux qui arrivent ensuite
export const LIFESPAN_MIN = 70;
export const LIFESPAN_MAX = 90;
export const AGE_ELDER = 60; // à partir de là : « âgé »
export const AGE_WARN = 5; // prévenu cinq ans avant la fin

// ---------- marché et caravane ----------
// Le marché (3 × 3 cases) reçoit de temps en temps une caravane de marchands : elle reste un moment, vend des marchandises (plus cher que le port ne les paie)
// et en achète d'autres (mieux que le port), puis repart avec ses stocks. Pas besoin d'employé : le joueur achète et vend depuis le menu du marché.
export const MARKET_FIRST_SEC = 90; // la première caravane arrive peu après la construction
export const MARKET_GAP_SEC: [number, number] = [600, 1000]; // entre deux caravanes (une journée = 600 s)
export const MARKET_STAY_SEC = 330; // elle reste ce temps-là
export const MARKET_BUY_MULT = 2; // le joueur paie le prix d'export × 2
export const MARKET_SELL_MULT = 1.5; // la caravane paie le prix d'export × 1,5
export const MARKET_PURSE = 150; // pièces que la caravane peut dépenser chez toi
export const MARKET_WANTS = 10; // unités qu'elle voudrait acheter de chaque marchandise recherchée

// ---------- porcherie et cochons ----------
// La porcherie (4 × 4 cases) élève des cochons pour leur viande. On achète des porcelets ; ils mangent des légumes de la ferme (les mêmes que les villageois) et boivent de l'eau ;
// bien nourris et abreuvés ils grandissent, et deux adultes bien soignés font de nouveaux porcelets. Un porcher apporte les légumes et l'eau, et abat les adultes
// quand on le demande (ou tout seul au-delà de PIG_KEEP adultes si l'abattage automatique est activé) : la viande brute va au dépôt, où le boucher la prend.
export const PIGPEN_SIZE = 4;
export const PIGS_MAX = 8;
export const PIG_PRICE = 40; // un porcelet
export const PIG_SELL = 15; // si on démonte la porcherie, chaque cochon est revendu
export const PIG_ADULT_SEC = 240; // un porcelet bien nourri est adulte au bout de 4 minutes
export const PIG_EAT_SEC = 60; // un cochon mange un légume toutes les 60 s
export const PIG_DRINK_SEC = 45; // et boit une unité d'eau toutes les 45 s
export const PIG_BREED_SEC = 150; // deux adultes bien soignés : un porcelet toutes les 150 s (s'il reste de la place)
export const PIG_MEAT = 4; // viande brute d'un cochon adulte
export const PIG_FEED_CAP = 24; // l'auge : légumes en réserve
export const PIG_WATER_CAP = 24; // l'abreuvoir : eau en réserve
export const PIG_KEEP = 2; // abattage automatique : on garde ce nombre d'adultes pour la reproduction
export const SWINE_CARRY = 8; // ce qu'un porcher porte (légumes, eau)

// ---------- étable et vaches ----------
// L'étable (4 × 4 cases) abrite des vaches (achetées une à une). Une vache mange de l'herbe (cultivée à la ferme, rangée au dépôt) et boit de l'eau (du puits) ;
// bien nourrie et abreuvée, elle donne du lait. Un éleveur apporte l'herbe et l'eau, trait les vaches et range le lait au dépôt : c'est de la nourriture, et le port l'achète.
export const STABLE_SIZE = 4;
export const STABLE_COWS_MAX = 6;
export const COW_PRICE = 50; // une vache
export const COW_SELL = 25; // on la revend la moitié
export const STABLE_FEED_CAP = 24; // l'auge : herbe en réserve
export const STABLE_WATER_CAP = 24; // l'abreuvoir : eau en réserve
export const STABLE_MILK_CAP = 20; // le lait trait à ramasser
export const COW_EAT_SEC = 70; // une vache mange une unité d'herbe toutes les 70 s
export const COW_DRINK_SEC = 50; // et boit une unité d'eau toutes les 50 s
export const MILK_SEC = 45; // une vache nourrie et abreuvée donne 1 lait toutes les 45 s (×saison)
export const MILK_SEASON = [1.1, 1.0, 0.9, 0.7]; // printemps, été, automne, hiver
export const HERDER_CARRY = 8; // ce qu'un éleveur porte (herbe, eau, lait)

// ---------- ferme ----------
// Une ferme (5 × 5 cases) a douze parcelles où l'on cultive UNE culture à la fois (au choix : blé, maïs, tomates ou carottes). Un fermier sème, ARROSE (l'eau vient
// d'un puits, via la cuve de la ferme : sans eau, ça ne pousse pas), attend, récolte et range la récolte dans un dépôt. Les récoltes sont de la nourriture pour les maisons, et le port les exporte.
// season : vitesse de pousse au printemps, été, automne, hiver (0 : rien ne pousse).
export const FARM_CROPS = {
  wheat: { label: "Blé", emoji: "🌾", growSec: 160, yield: 6, price: 2, season: [1.0, 1.2, 0.8, 0] },
  corn: { label: "Maïs", emoji: "🌽", growSec: 210, yield: 5, price: 3, season: [0.8, 1.4, 0.7, 0] },
  tomato: { label: "Tomates", emoji: "🍅", growSec: 250, yield: 4, price: 4, season: [0.7, 1.5, 0.5, 0] },
  carrot: { label: "Carottes", emoji: "🥕", growSec: 120, yield: 6, price: 2, season: [1.2, 0.8, 1.0, 0.3] },
  grass: { label: "Herbe", emoji: "🌿", growSec: 90, yield: 8, price: 1, season: [1.3, 1.0, 0.9, 0.3] }, // pour les vaches : pas pour les hommes
} as const;
export type FarmCrop = keyof typeof FARM_CROPS;
export const FARM_SIZE = 5; // la ferme occupe 5 × 5 cases
export const FARM_PLOTS = 12; // parcelles (4 × 3)
export const WET_SEC = 150; // une parcelle arrosée reste humide ce temps (s) ; sèche, la pousse s'arrête
export const DRY_BELOW = 0.3; // sous cette humidité, la parcelle réclame de l'eau
export const FARM_TANK_CAP = 20; // la cuve de la ferme, remplie au puits par le fermier ; chaque arrosage prend 1 unité
export const FARM_FETCH = 8; // eau qu'un fermier rapporte du puits en un voyage
export const SOW_SEC = 2; // semer une parcelle
export const REAP_SEC = 2.5; // récolter une parcelle
export const FARM_CARRY = 12; // récolte qu'un fermier porte avant d'aller la ranger

// ---------- église et cimetière ----------
// Quand un villageois meurt, son corps reste devant sa maison. Un fossoyeur (employé de l'église) le prend et le porte au cimetière de l'église.
// Un défunt pas enterré attriste les maisons autour (nuisance) et, au bout d'un moment, favorise les maladies.
export const CHURCH_GRAVES = 18; // tombes du cimetière
export const CORPSE_SICK_AFTER = 90; // secondes avant qu'un corps non enterré rende malade ceux qui vivent à côté
export const CORPSE_SICK_RADIUS = 5;

// ---------- maladies et soigneur ----------
// Un villageois peut tomber malade au hasard (plus souvent s'il a soif, faim, est épuisé, ou en hiver pour le rhume). La maladie a une gravité de
// 0 à 100 % qui monte tant qu'elle n'est pas soignée ; à 100 %, le villageois meurt. Le soigneur (employé de la Maison du soigneur) prépare
// des remèdes avec des baies et du miel, puis les apporte aux malades.
export const ILLNESSES = {
  cold: { label: "Rhume", emoji: "🤧", rate: 0.1, cap: 60, selfCureSec: 480, contagion: 0.003 }, // bénin : ne tue jamais, passe tout seul à la longue
  poison: { label: "Intoxication", emoji: "🤢", rate: 0.25, cap: 100, selfCureSec: 0, contagion: 0 }, // la faim prolongée
  fever: { label: "Fièvre", emoji: "🤒", rate: 0.3, cap: 100, selfCureSec: 0, contagion: 0 }, // grave et rare
  flu: { label: "Grippe", emoji: "😷", rate: 0.28, cap: 100, selfCureSec: 0, contagion: 0.02 }, // épidémie : très contagieuse
} as const;
export type IllnessKind = keyof typeof ILLNESSES;
export const REMEDIES = {
  tisane: { label: "Tisane", emoji: "🍵", power: { cold: 45, poison: 40, fever: 30, flu: 15 } as Record<IllnessKind, number> }, // 2 baies
  syrup: { label: "Sirop", emoji: "🧪", power: { cold: 80, poison: 70, fever: 65, flu: 45 } as Record<IllnessKind, number> }, // 2 baies + 1 miel
};
export type RemedyKind = keyof typeof REMEDIES;
export const CLINIC_BERRY_CAP = 20;
export const CLINIC_HONEY_CAP = 10;
export const CLINIC_REMEDY_CAP = 8; // de chaque remède
export const TISANE_BERRIES = 2;
export const SYRUP_BERRIES = 2;
export const SYRUP_HONEY = 1;
export const BREW_SEC = 6; // préparer un remède
export const TREAT_SLOW_SEC = 150; // après un soin, la maladie progresse presque 3 fois moins vite pendant ce temps
export const IMMUNE_SEC = 300; // après la guérison, on ne retombe pas malade tout de suite
export const HEALTH_TICK = 10; // toutes les 10 s : tirage des nouvelles maladies et de la contagion
export const HEALTH_RISK = {
  cold: 0.005, // par villageois et par tirage (~ un rhume toutes les 30 min), ×3 en hiver
  poisonHungry: 0.02, // intoxication s'il a très faim
  poisonBase: 0.0003,
  fever: 0.0012, // ×3 s'il a très soif ou est épuisé
  epidemic: 0.004, // par tirage : une grippe se déclare chez un villageois (~ toutes les 40 min)
};
export const CONTAGION_RADIUS = 3.5; // un malade qui travaille dehors contamine ceux qui sont à cette distance (en cases)
// Expérience du soigneur : plus il soigne, plus ses remèdes sont efficaces, moins il gaspille d'ingrédients et plus vite il prépare.
export const HEAL_LEVELS = [
  { xp: 0, label: "Apprenti", power: 1, save: 0, brew: 1 },
  { xp: 6, label: "Guérisseur", power: 1.15, save: 0.15, brew: 0.85 },
  { xp: 18, label: "Médecin", power: 1.3, save: 0.3, brew: 0.7 },
  { xp: 40, label: "Maître soigneur", power: 1.5, save: 0.5, brew: 0.55 },
]; // power : multiplie l'effet des remèdes ; save : chance de ne pas consommer les ingrédients ; brew : multiplie le temps de préparation
export const XP_TREAT = 1; // un soin
export const XP_CURE = 2; // en plus, si le malade est guéri
export const XP_BREW = 0.25; // un remède préparé
export const XP_PREVENT = 0.5; // une tisane préventive
// Prévention : une tisane donnée à un villageois bien portant le protège pendant un moment.
export const PREVENT_SEC = 420;
export const PREVENT_ONSET = 0.2; // protégé : tire 5 fois moins souvent une maladie
export const PREVENT_CONTAGION = 0.25; // protégé : attrape 4 fois moins la contagion
export const PREVENT_RESERVE = 2; // tisanes gardées pour les malades : la prévention n'y touche pas
// Contagion (grippe, rhume) : en plus de la même maison et de la proximité dehors
export const CONTAGION_NEIGHBOR_RADIUS = 4.5; // distance (en cases) entre deux maisons voisines
export const CONTAGION_NEIGHBOR = 0.25; // part de la contagion qui passe aux maisons voisines
export const CONTAGION_WORK = 0.5; // part qui passe aux collègues du même employeur si le malade travaille encore
export const QUARANTINE_HOUSE = 0.5; // quarantaine : la contagion dans la maison est divisée par deux, et ne sort plus
export const SICK_BED = 50; // à partir de cette gravité, le malade doit garder le lit chez lui (ce qui limite aussi la contagion)
export const SICK_SLOW = 35; // à partir de cette gravité, il avance moins vite

// ---------- arbustes à baies et cueilleurs ----------
export const BERRY_REGROW_MS = 150000; // temps de pousse (comme les arbres : accéléré au printemps, arrêté en hiver) avant que l'arbuste refasse des baies
export const BERRY_YIELD = 2; // baies par arbuste cueilli (+1 pour un gros arbuste)
export const BERRY_PICK_SEC = 1.4;
export const BERRY_CARRY = 6; // baies qu'un cueilleur porte avant d'aller les ranger
// (plus de rayon : un cueilleur va chercher l'arbuste mûr le plus proche de lui, n'importe où sur la carte)

// ---------- contentement des habitants ----------
// Un habitant est d'autant plus content que sa maison est loin de ce qui dérange. Le contentement d'une maison va de 0 à 100 :
// il perd la gêne de chaque nuisance à proximité (proportionnelle à la proximité : toute la gêne contre le bâtiment, rien au bord du rayon),
// puis 20 s'il n'a plus d'eau et 20 s'il n'a plus de nourriture.
export const MOOD = {
  nuisance: {
    apiary: { radius: 6, penalty: 30, label: "Abeilles", emoji: "🐝" }, // piqûres et bourdonnement
    sawmill: { radius: 8, penalty: 28, label: "Scierie", emoji: "🏭" }, // bruit
    port: { radius: 6, penalty: 16, label: "Port", emoji: "⚓" }, // va-et-vient
    lodge: { radius: 4, penalty: 12, label: "Chasse", emoji: "🏹" }, // gibier dépecé
    corpse: { radius: 5, penalty: 30, label: "Défunt", emoji: "⚰️" }, // un mort pas encore enterré, devant une maison
  },
  thirst: 20,
  hunger: 20,
  grumpyBelow: 40,
};

// Le mécontentement d'un villageois s'accumule avec le temps. La gêne des nuisances autour de sa maison (0 à 100) est comparée à une
// tolérance : au-dessus, son mécontentement monte (d'autant plus vite que la gêne est forte) ; en dessous, il retombe.
// À 100 %, il menace de partir ; s'il n'est pas calmé avant la fin du délai, il quitte définitivement le village.
export const DISCONTENT_TOL = 10; // gêne que l'on supporte sans s'énerver
export const DISCONTENT_RISE = 0.012; // points de mécontentement par seconde et par point de gêne au-dessus de la tolérance
export const DISCONTENT_FALL = 0.4; // retombée de base par seconde quand la gêne est sous la tolérance...
export const DISCONTENT_FALL_K = 0.03; // ...plus ce coefficient par point de gêne en dessous
export const THREAT_CALM = 90; // en dessous, une menace de départ est oubliée
export const LEAVE_AFTER_SEC = 60; // délai entre la menace de départ et le départ
export const HOME_OK_NUISANCE = 60; // un villageois sans maison n'en accepte pas une où la gêne dépasse ce niveau
export const HOME_RETURN_OK = 25; // ni retourner dans la maison qu'il a quittée tant que la gêne y dépasse ce niveau
export const DEPARTURE_RETURN_SEC = 120; // après le départ d'un villageois, un nouveau ne revient pas avant ce délai (s)

// ---------- jour et nuit ----------
export const DAY_SEC = 600; // durée d'un jour du jeu en secondes (10 minutes : des journées bien plus lentes qu'avant, à 240 s)
export const DAY_START = 0.08; // une nouvelle partie commence au petit matin (environ 8 h)
export const NIGHT_DRAIN = 1.25; // la nuit, on se fatigue 25 % plus vite...
export const NIGHT_REST = 1.5; // ...et on récupère 50 % plus vite chez soi
export const NIGHT_IDLE_HOME = 0.2; // la nuit, un villageois qui ne fait rien rentre 5 fois plus vite

// ---------- saisons ----------
export const SEASON_DAYS = 3; // chaque saison dure 3 jours de jeu (12 minutes) ; l'année en fait 48

export interface SeasonRules {
  id: "spring" | "summer" | "autumn" | "winter";
  label: string;
  emoji: string;
  regrow: number; // vitesse de repousse des arbres (0 : ils ne repoussent plus)
  repop: number; // vitesse de renouvellement du gibier
  water: number; // consommation d'eau des habitants
  food: number; // consommation de nourriture
  well: number; // vitesse de remplissage des puits
  drain: number; // fatigue des villageois
  speed: number; // vitesse de marche
  meat: number; // viande par animal chassé
  ships: number; // 0 : la mer est gelée, plus aucun bateau ne passe
  honey: number; // production de miel des ruches (0 : les abeilles hivernent)
  hive: number; // vitesse à laquelle les ruches se dégradent sans soin (0 : elles dorment)
  tint: [number, number, number]; // teinte posée sur le monde
  blurb: string; // ce que la saison change, pour le message d'arrivée
}

export const SEASONS: SeasonRules[] = [
  { id: "spring", label: "Printemps", emoji: "🌸", regrow: 1.6, repop: 1.5, water: 1, food: 1, well: 1.2, drain: 1, speed: 1, meat: 1, ships: 1, honey: 0.7, hive: 1, tint: [248, 255, 244], blurb: "Les arbres repoussent plus vite et le gibier revient." },
  { id: "summer", label: "Été", emoji: "☀️", regrow: 1, repop: 1, water: 1.4, food: 1, well: 0.6, drain: 1.1, speed: 1, meat: 1, ships: 1, honey: 1.4, hive: 1.2, tint: [255, 247, 226], blurb: "Il fait chaud : on boit davantage, les puits se remplissent moins vite et on se fatigue plus." },
  { id: "autumn", label: "Automne", emoji: "🍂", regrow: 1, repop: 1, water: 1, food: 1, well: 1, drain: 1, speed: 1, meat: 1.4, ships: 1, honey: 0.8, hive: 1, tint: [255, 222, 184], blurb: "Saison de l'abondance : le gibier donne plus de viande. Pense aux réserves pour l'hiver !" },
  { id: "winter", label: "Hiver", emoji: "❄️", regrow: 0, repop: 0.4, water: 0.8, food: 1.6, well: 0.8, drain: 1.25, speed: 0.88, meat: 1, ships: 0, honey: 0, hive: 0, tint: [214, 228, 255], blurb: "Il gèle : on mange bien plus, on avance moins vite, les arbres ne repoussent plus, le gibier se raréfie et la mer gelée arrête les bateaux." },
];

// ---------- nature ----------
export const REGROW_MS = 240_000; // les arbres des forêts repoussent au bout de 4 minutes
