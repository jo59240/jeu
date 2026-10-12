import { CHURCH_GRAVES, COSTS, CUT_SEC, HONEY_CAP, PRICE_HONEY, HOUSE_CAPACITY, LODGE_CAP, LOGS_PER_PLANK, PRICE_CUTS, PRICE_PLANK, SHIP_CYCLE } from "./balance";

// Catalogue des structures qu'on pose d'un seul coup avec 🔨 Construire.
export type StructureKind = "camp" | "depot" | "road" | "house" | "sawmill" | "well" | "lodge" | "butcher" | "port" | "apiary" | "clinic" | "church";

export interface StructureDef {
  id: string;
  label: string;
  kind: StructureKind;
  cost: number; // pièces
  woodCost?: number; // matériaux à livrer au chantier par un bâtisseur
  material?: "wood" | "plank"; // bûches (camps, dépôts) ou planches (scierie) ; bûches par défaut
  buildSec: number; // durée de construction une fois les matériaux réunis (0 = instantané)
  size: number; // côté en cases (un chemin se pose case par case)
  desc: string;
}

const K = COSTS;

export const STRUCTURE_LIST: StructureDef[] = [
  {
    id: "camp-wood",
    label: "Camp de bûcheron",
    kind: "camp",
    cost: K.camp.coins,
    size: 2,
    buildSec: K.camp.sec,
    desc: `2 × 2 cases d'herbe libre. On pose d'abord les fondations (${K.camp.coins} pièces) : un bâtisseur doit ensuite le construire. Les bûcherons y déposent le bois qu'ils portent. Son entrée (repère jaune) doit être reliée à un chemin.`,
  },
  {
    id: "depot",
    label: "Dépôt",
    kind: "depot",
    cost: K.depot.coins,
    woodCost: K.depot.mat,
    material: "plank",
    size: 3,
    buildSec: K.depot.sec,
    desc: `3 × 3 cases d'herbe libre. On pose d'abord les fondations, puis un bâtisseur apporte ${K.depot.mat} planches (fabriquées à la scierie, par les chemins) et construit. Il stocke les planches et la viande préparée (chaque article compté à part), jamais les bûches.`,
  },
  {
    id: "house",
    label: "Maison",
    kind: "house",
    cost: K.house.coins,
    woodCost: K.house.mat,
    material: "plank",
    size: 2,
    buildSec: K.house.sec,
    desc: `2 × 2 cases d'herbe libre. Chaque villageois a besoin d'une place : une maison en loge ${HOUSE_CAPACITY}. Fondations (${K.house.coins} pièces), puis un bâtisseur apporte ${K.house.mat} planches et construit. Attention aux nuisances alentour (ruches, scierie…) : elles rendent les habitants mécontents.`,
  },
  {
    id: "sawmill",
    label: "Scierie",
    kind: "sawmill",
    cost: K.sawmill.coins,
    woodCost: K.sawmill.mat,
    material: "wood",
    size: 3,
    buildSec: K.sawmill.sec,
    desc: `3 × 3 cases d'herbe libre. Première usine : elle transforme les bûches (${LOGS_PER_PLANK} bûches → 1 planche) en planches, nécessaires pour les maisons, les dépôts et la boucherie. Fondations (${K.sawmill.coins} pièces), puis ${K.sawmill.mat} bûches à livrer.`,
  },
  {
    id: "well",
    label: "Puits",
    kind: "well",
    cost: K.well.coins,
    woodCost: K.well.mat,
    material: "wood",
    size: 2,
    buildSec: K.well.sec,
    desc: `2 × 2 cases d'herbe libre. Chaque foyer a besoin d'eau : les habitants viennent la chercher ici. Fondations (${K.well.coins} pièces), puis ${K.well.mat} bûches à livrer. Il se remplit tout seul.`,
  },
  {
    id: "hunter-camp",
    label: "Camp de chasseur",
    kind: "lodge",
    cost: K.lodge.coins,
    size: 2,
    buildSec: K.lodge.sec,
    desc: `2 × 2 cases d'herbe libre. Fondations (${K.lodge.coins} pièces), sans matériaux. Les chasseurs y rapportent la viande du gibier (lapins, cerfs, sangliers). Il garde ${LODGE_CAP} portions.`,
  },
  {
    id: "butcher",
    label: "Boucherie",
    kind: "butcher",
    cost: K.butcher.coins,
    woodCost: K.butcher.mat,
    material: "plank",
    size: 3,
    buildSec: K.butcher.sec,
    desc: `3 × 3 cases d'herbe libre. Deuxième usine : elle prépare la viande des chasseurs (1 portion → 1 viande préparée, ${CUT_SEC} s). Fondations (${K.butcher.coins} pièces), puis ${K.butcher.mat} planches à livrer.`,
  },
  {
    id: "port",
    label: "Port",
    kind: "port",
    cost: K.port.coins,
    woodCost: K.port.mat,
    material: "plank",
    size: 3,
    buildSec: K.port.sec,
    desc: `3 × 3 cases au bord de la mer (au moins deux cases d'eau contre un côté) : le quai se tourne tout seul vers l'eau. Un porteur y amène des marchandises des dépôts ; un bateau passe toutes les ${SHIP_CYCLE} s et les achète (${PRICE_PLANK} pièces la planche, ${PRICE_CUTS} la viande préparée). Fondations (${K.port.coins} pièces), puis ${K.port.mat} planches à livrer.`,
  },
  {
    id: "apiary",
    label: "Rucher",
    kind: "apiary",
    cost: K.apiary.coins,
    woodCost: K.apiary.mat,
    material: "plank",
    size: 2,
    buildSec: K.apiary.sec,
    desc: `2 × 2 cases d'herbe libre : quatre ruches. Les abeilles font du miel (jusqu'à ${HONEY_CAP} pots), mais seulement si un apiculteur les soigne et les récolte ; il apporte le miel à un dépôt, d'où le port l'exporte (${PRICE_HONEY} pièces le pot). Rien en hiver : les abeilles dorment. Fondations (${K.apiary.coins} pièces), puis ${K.apiary.mat} planches à livrer.`,
  },
  {
    id: "church",
    label: "Église",
    kind: "church",
    cost: K.church.coins,
    woodCost: K.church.mat,
    material: "plank",
    size: 3,
    buildSec: K.church.sec,
    desc: `3 × 3 cases d'herbe libre : une église et son cimetière (${CHURCH_GRAVES} tombes). Quand un villageois meurt, son corps reste devant sa maison : un fossoyeur, employé de l'église, vient le chercher et l'enterre. Un défunt pas enterré attriste le voisinage et finit par rendre malade. Fondations (${K.church.coins} pièces), puis ${K.church.mat} planches à livrer.`,
  },
  {
    id: "clinic",
    label: "Maison du soigneur",
    kind: "clinic",
    cost: K.clinic.coins,
    woodCost: K.clinic.mat,
    material: "plank",
    size: 2,
    buildSec: K.clinic.sec,
    desc: `2 × 2 cases d'herbe libre. Le soigneur y prépare des remèdes (tisane : 2 baies ; sirop : 2 baies + 1 miel) avec les baies et le miel des dépôts, puis soigne les villageois malades. Sans soin, une maladie grave tue. Fondations (${K.clinic.coins} pièces), puis ${K.clinic.mat} planches à livrer.`,
  },
  {
    id: "road",
    label: "Chemin",
    kind: "road",
    cost: K.road.coins,
    size: 1,
    buildSec: K.road.sec,
    desc: `Glisse pour tracer un chemin (${K.road.coins} pièce la case). On y marche plus vite. Un chemin doit arriver jusqu'à l'entrée de chaque bâtiment (repère jaune) : passer à côté ne suffit pas.`,
  },
];

export const STRUCTURES: Record<string, StructureDef> = Object.fromEntries(STRUCTURE_LIST.map((s) => [s.id, s]));
