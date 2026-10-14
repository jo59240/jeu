// Le guide du jeu (menu « Aide ») : une fiche par bâtiment, avec comment le poser, qui y travaille, ce qu'il produit et les pièges à éviter.
// Les chiffres viennent de balance.ts : ils restent justes quand on règle le jeu.
import {
  ARRIVAL_SEC, CAMP_CAPACITY, COSTS, COW_PRICE, CUT_SEC, DAY_SEC, DEPOT_CAPACITY, DEPOT_LEVELS, EXPORT_GOODS, FARM_CROPS, FARM_TANK_CAP, HONEY_CAP, HOUSE_CAPACITY,
  HUNT_RADIUS, JOBS, LODGE_CAP, LOGS_PER_PLANK, LUMBER_RADIUS, MAX_CREW, PLANK_SEC, SEASON_DAYS, SHIP_CYCLE, STABLE_COWS_MAX, WELL_CAP, WET_SEC, CHURCH_GRAVES, SAWMILL_LOGS_CAP,
  BUTCHER_CUTS_CAP, ILLNESSES, ExportGood, PIGS_MAX, PIG_PRICE, PIG_MEAT, PIG_KEEP, RECIPES, DISH_CAP, DINE_HUNGER, DRAKKAR_STAGES, COLONY_GOAL, MARKET_BUY_MULT, MARKET_SELL_MULT, MARKET_STAY_SEC,
} from "./balance";
import { STRUCTURES } from "./structures";

export interface HelpTopic {
  id: string;
  group: "Prise en main" | "Bâtiments" | "Villageois et village";
  emoji: string;
  title: string;
  structure?: string; // identifiant du catalogue de construction, pour afficher la vignette du bâtiment
  paras: string[]; // des paragraphes ; « • » en début de ligne : une puce ; **gras**
}

const cost = (id: string) => {
  const d = STRUCTURES[id];
  const mat = d.woodCost ? ` + ${d.woodCost} ${d.material === "plank" ? "planches" : "bûches"} à livrer` : "";
  const size = d.kind === "road" ? "1 case" : `${d.size} × ${d.size} cases`;
  return `**Prix** : ${d.kind === "road" ? `${d.cost} pièce la case` : `${d.cost} pièces${mat}`} · **Taille** : ${size} d'herbe libre.`;
};
const job = (k: keyof typeof JOBS) => `**${JOBS[k].label}** (${JOBS[k].slots} poste${JOBS[k].slots > 1 ? "s" : ""})`;
const price = (g: ExportGood) => `${EXPORT_GOODS[g].emoji} ${EXPORT_GOODS[g].label} ${EXPORT_GOODS[g].price} 🪙`;

export const HELP_TOPICS: HelpTopic[] = [
  // ---------- prise en main ----------
  {
    id: "start",
    group: "Prise en main",
    emoji: "🚀",
    title: "Premiers pas",
    paras: [
      "Tu diriges un petit village sur une île. Tu n'as au départ qu'un villageois et quelques pièces. Tout se construit avec des **pièces** (🪙) et du **bois** : des **bûches** coupées par les bûcherons et des **planches** sciées à la scierie.",
      "**Un bon départ :**",
      "• 1. **🔨 Construire** un **camp de bûcheron** près d'une forêt, puis embauche ton villageois (clic sur le camp › Recruter).",
      "• 2. Construis une **scierie** et un **dépôt**, et **relie-les par des chemins** : les entrées des bâtiments (repère jaune) doivent toutes être sur un chemin continu.",
      "• 3. Avec les planches, construis des **maisons** : des villageois arrivent (un toutes les " + ARRIVAL_SEC + " s si une place est libre).",
      "• 4. Ajoute un **puits** (l'eau), un **camp de chasseur** + une **boucherie** (la viande) ou une **ferme** : les habitants ont soif et faim.",
      "• 5. Construis un **port** : c'est lui qui rapporte des pièces, en exportant ce que tu produis.",
      "**Les commandes** : clic gauche = sélectionner (le menu s'ouvre en haut à droite) ; glisser = déplacer la carte ; molette = zoom ; clic droit = envoyer le villageois sélectionné (ou l'embaucher dans le bâtiment cliqué) ; **R** ou clic droit en construction = tourner le bâtiment ; **Échap** = annuler / menu ; **H** = ce guide.",
      "**Le principe** : chaque bâtiment a besoin de **villageois employés** pour fonctionner. Sélectionne un bâtiment, ouvre **➕ Recruter** et choisis un villageois sans emploi. Un villageois s'embauche aussi depuis son propre menu (**Changer d'emploi**).",
    ],
  },
  {
    id: "roads",
    group: "Prise en main",
    emoji: "🛤️",
    title: "Chemins et entrées",
    structure: "road",
    paras: [
      cost("road"),
      "Les chemins relient les bâtiments. On y marche **30 % plus vite**, et les villageois s'y croisent sans se bloquer.",
      "• Chaque bâtiment a une **entrée** (le repère jaune quand on le sélectionne ou qu'on le pose) : c'est de là que partent et arrivent les villageois. **Passer à côté ne suffit pas** : le chemin doit arriver jusqu'à la case d'entrée.",
      "• Les **porteurs** et les **bâtisseurs** n'utilisent que des chemins reliant l'entrée d'un bâtiment à l'autre : si un menu affiche **« Non relié »** en rouge, trace un chemin.",
      "• En construction, **glisse** pour tracer plusieurs cases d'un coup ; **🗑 Démolir** retire une case.",
    ],
  },
  // ---------- bâtiments ----------
  {
    id: "camp",
    group: "Bâtiments",
    emoji: "🪓",
    title: "Camp de bûcheron",
    structure: "camp-wood",
    paras: [
      cost("camp-wood"),
      `Le camp emploie des ${job("camp")} : ils coupent seuls les arbres dans un rayon de **${LUMBER_RADIUS} cases** autour du camp et rapportent les bûches au camp (**${CAMP_CAPACITY} bûches** au maximum). Les arbres d'une forêt repoussent au bout d'un moment (plus vite au printemps, pas en hiver).`,
      "• Place-le **près d'une forêt**.",
      "• Les bûches s'accumulent au camp : le **scieur** de la scierie (ou un **porteur**) vient les chercher, par un chemin.",
      "• Un camp plein : les bûcherons attendent. Vide-le en faisant tourner la scierie.",
    ],
  },
  {
    id: "depot",
    group: "Bâtiments",
    emoji: "📦",
    title: "Dépôt",
    structure: "depot",
    paras: [
      cost("depot"),
      `Le dépôt est l'**entrepôt du village** : il garde les planches, la viande (brute et préparée), le miel, les baies, le lait et toutes les récoltes. Il a **${DEPOT_CAPACITY} places** partagées entre tous les produits ; une pastille rouge **« ! »** s'affiche sur son toit quand il est plein.`,
      `• ${job("depot")} : les **porteurs** transportent tout d'un bâtiment à l'autre (bûches → scierie, viande → boucherie, planches et nourriture → dépôts, tout → port) et déposent **là où il y a de la place**.`,
      `• **Améliorer** (bouton ⬆️ dans son menu) : niveau 2 = ${DEPOT_LEVELS[1].cap} places (${DEPOT_LEVELS[1].coins} 🪙 + ${DEPOT_LEVELS[1].planks} planches), niveau 3 = ${DEPOT_LEVELS[2].cap} places (${DEPOT_LEVELS[2].coins} 🪙 + ${DEPOT_LEVELS[2].planks} planches). Son aspect change.`,
      `• ${job("gather")} : les **cueilleurs** ramassent les baies des arbustes et les rangent ici.`,
      "• Les maisons y prennent de la nourriture quand leurs réserves baissent.",
    ],
  },
  {
    id: "house",
    group: "Bâtiments",
    emoji: "🏠",
    title: "Maison",
    structure: "house",
    paras: [
      cost("house"),
      `Une maison loge **${HOUSE_CAPACITY} villageois** (${MAX_CREW} au maximum dans le village). Tant qu'il reste une place libre et que les habitants sont contents, un nouveau villageois arrive toutes les ${ARRIVAL_SEC} s.`,
      "• La maison a une **réserve d'eau** et une **réserve de nourriture** : quand un habitant a soif ou faim, il rentre se servir. Si elle est vide, il en rapporte du puits ou d'un dépôt, et son **mécontentement** monte.",
      "• **Nuisances** : les ruches, la scierie, le port, les camps de chasseur et les défunts non enterrés gênent les maisons proches. Un habitant très mécontent finit par **quitter le village pour de bon**.",
      "• Le menu de la maison montre le contentement, les réserves et les habitants (clique un nom pour le suivre).",
      "• Un habitant **malade** : une croix verte apparaît sur le toit ; tu peux mettre la maison en **🚧 quarantaine**.",
      "• Un villageois sans maison ne se repose pas et ne peut pas boire ni manger chez lui : construis assez de maisons.",
    ],
  },
  {
    id: "sawmill",
    group: "Bâtiments",
    emoji: "🏭",
    title: "Scierie",
    structure: "sawmill",
    paras: [
      cost("sawmill"),
      `La scierie transforme **${LOGS_PER_PLANK} bûches en 1 planche** toutes les ${PLANK_SEC} s (${SAWMILL_LOGS_CAP} bûches en attente). Les planches servent à tout construire.`,
      `• ${job("sawmill")} : **elle ne tourne que si un scieur y travaille**. Le scieur va chercher les bûches au camp de bûcheron (relié par un chemin), les livre, puis **entre dans la scierie** pour scier ; chaque scieur de plus double la cadence.`,
      "• Elle est **bruyante** : garde-la loin des maisons.",
      "• Les planches sont récupérées par les bâtisseurs sur les chantiers, ou rangées au dépôt par un porteur.",
    ],
  },
  {
    id: "well",
    group: "Bâtiments",
    emoji: "⛲",
    title: "Puits",
    structure: "well",
    paras: [
      cost("well"),
      `Le puits fournit l'**eau** : il se remplit tout seul (**${WELL_CAP} unités** au maximum, 1 toutes les 4 s, plus lentement l'été).`,
      "• Les **habitants** rapportent de l'eau pour leur maison quand leur réserve baisse.",
      `• La **ferme** (cuve de ${FARM_TANK_CAP}) et l'**étable** (abreuvoir) y puisent aussi : prévois **plusieurs puits** si tu as des cultures et des vaches.`,
      "• Aucun employé n'est nécessaire.",
    ],
  },
  {
    id: "lodge",
    group: "Bâtiments",
    emoji: "🏹",
    title: "Camp de chasseur",
    structure: "hunter-camp",
    paras: [
      cost("hunter-camp"),
      `Les ${job("lodge")} traquent les animaux sauvages (lapins, cerfs, sangliers) dans un rayon de **${HUNT_RADIUS} cases**, tirent à l'arc et rapportent la **viande brute** au camp (**${LODGE_CAP} portions** au maximum).`,
      "• Place-le **près des prés et des forêts** où vivent les animaux (la faune se renouvelle avec le temps, moins en hiver).",
      "• La viande brute va ensuite à la **boucherie** : par un porteur, ou le boucher la prend lui-même au camp ou au dépôt.",
      "• Un camp presque plein (70 %) verse sa viande dans un **dépôt** relié par un chemin.",
      "• Le dépeçage dérange un peu les maisons voisines.",
    ],
  },
  {
    id: "butcher",
    group: "Bâtiments",
    emoji: "🥩",
    title: "Boucherie",
    structure: "butcher",
    paras: [
      cost("butcher"),
      `La boucherie prépare la viande brute en **viande préparée** (1 portion toutes les ${CUT_SEC} s ; ${BUTCHER_CUTS_CAP} de stock). C'est la **nourriture** principale des maisons, et elle s'exporte.`,
      `• ${job("butcher")} : **elle ne tourne que si un boucher y travaille**. Il va chercher la viande brute au **camp de chasseur ou au dépôt**, la rapporte et **entre dans la boucherie**.`,
      "• Les maisons y prennent de la viande préparée (ou au dépôt).",
      "• Elle ne dérange pas les maisons : tu peux la mettre près d'elles.",
    ],
  },
  {
    id: "farm",
    group: "Bâtiments",
    emoji: "🌾",
    title: "Ferme",
    structure: "farm",
    paras: [
      cost("farm"),
      `La ferme a **douze parcelles**. Chacune cultive ce que **tu** choisis : ${Object.values(FARM_CROPS).map((c) => `${c.emoji} ${c.label}`).join(", ")}.`,
      "• **Choisir** : dans le menu, clique une **parcelle**, puis le légume à y mettre. « Tout planter en… » règle toutes les parcelles. Une fois semée, la parcelle redevient « à choisir » après la récolte.",
      `• ${job("farm")} : le fermier **va dans les champs** : il récolte les parcelles mûres, **arrose** les parcelles sèches avec la cuve, sème les parcelles choisies et retourne au **puits** quand la cuve est vide.`,
      `• **Arroser est obligatoire** : une parcelle arrosée reste humide ${WET_SEC} s ; **sèche, rien ne pousse** (une goutte clignote dessus).`,
      "• L'**avancement** est visible : une barre sous chaque parcelle, et dans le menu l'avancement moyen et un pourcentage par parcelle.",
      "• **Saisons** : chaque culture a ses saisons ; **en hiver rien ne pousse** (un peu les carottes).",
      "• Les récoltes vont au **dépôt** : c'est de la **nourriture** pour les maisons et ça s'exporte. L'**herbe** ne se mange pas : elle est pour les **vaches**.",
    ],
  },
  {
    id: "stable",
    group: "Bâtiments",
    emoji: "🐄",
    title: "Étable",
    structure: "stable",
    paras: [
      cost("stable"),
      `L'étable abrite jusqu'à **${STABLE_COWS_MAX} vaches** (${COW_PRICE} 🪙 pièce, achetées dans son menu ; on peut les revendre).`,
      "• Une vache **mange de l'herbe** (cultivée à la ferme, rangée au dépôt) et **boit de l'eau** (puits). Nourrie et abreuvée, elle donne du **lait** ; sinon elle ne produit plus.",
      `• ${job("stable")} : l'**éleveur** apporte l'herbe à l'auge, l'eau à l'abreuvoir, **trait** les vaches et range le **lait** au dépôt.`,
      "• Le lait est de la **nourriture** et s'exporte.",
      "• Prévois donc : **une ferme avec de l'herbe**, **un dépôt**, **un puits**, le tout relié.",
    ],
  },
  {
    id: "pantry",
    group: "Bâtiments",
    emoji: "🥫",
    title: "Garde-manger",
    structure: "pantry",
    paras: [
      cost("pantry"),
      "Le garde-manger **range toute la nourriture** du village : viande brute et préparée, baies, miel, lait, légumes et herbe. Il se pose et se relie par les chemins comme un dépôt.",
      "• Dès qu'il y en a un, **ce qui est stocké dans les dépôts y est transporté** (une fois par seconde, tant qu'il y a de la place), et le bois ou les planches qui y arriveraient vont dans un dépôt. Les dépôts gardent donc le **bois et les planches**.",
      "• Les **plats préparés** à la taverne y sont aussi rangés : le cuisinier les y porte, et les villageois affamés ou fatigués viennent y manger.",
      "• Les villageois, la taverne, le port et le marché prennent la nourriture au garde-manger. On peut l'**améliorer** comme un dépôt pour plus de place.",
      "• L'**eau** reste dans les **puits**.",
    ],
  },
  {
    id: "tavern",
    group: "Bâtiments",
    emoji: "🍺",
    title: "Taverne",
    structure: "tavern",
    paras: [
      cost("tavern"),
      `• ${job("tavern")} : le **cuisinier** rapporte les ingrédients des **dépôts** (légumes de la ferme, viande préparée, miel, lait, baies) puis prépare des plats. Chaque recette garde jusqu'à ${DISH_CAP} plats.`,
      ...RECIPES.map((r) => `• ${r.emoji} **${r.label}** : ${(Object.entries(r.needs) as [ExportGood, number][]).map(([g, n]) => `${n} ${EXPORT_GOODS[g].label.toLowerCase()}`).join(" + ")} → **+${r.energy} énergie**, rassasie **${Math.round(r.sated / 60)} min**.`),
      `• Un villageois qui a **faim** (à partir de ${DINE_HUNGER} %) ou qui est **fatigué** passe manger à la taverne, puis reprend son travail. Fatigué, il choisit le plat le plus énergétique ; affamé, le plus rassasiant. Tant que le repas le rassasie, il n'a pas faim.`,
    ],
  },
  {
    id: "shipyard",
    group: "Bâtiments",
    emoji: "⛵",
    title: "Chantier du grand drakkar",
    structure: "shipyard",
    paras: [
      cost("shipyard"),
      "Comme le port, il se pose **au bord de la mer** (au moins trois cases d'eau contre un côté) ; l'étrave du drakkar est tournée vers l'eau et l'entrée est de l'autre côté.",
      "Le **but du jeu** : construire un **grand drakkar** pour partir fonder une **colonie** sur une île nouvelle.",
      `• Le drakkar se construit en **${DRAKKAR_STAGES.length} étapes** : à chacune, tu livres des marchandises **prises dans tes dépôts** (bouton **📦 Livrer depuis les dépôts** dans le menu du chantier). Étapes : ${DRAKKAR_STAGES.map((st) => `**${st.label}**`).join(", ")}.`,
      "• Le drakkar prend forme sur le chantier à chaque étape. Quand il est terminé, le bouton **⛵ Appareiller** apparaît.",
      "• En partant, **tout le village embarque** (villageois et pièces) : les bâtiments restent sur l'île quittée, qui est mise de côté. Tu **repars de zéro** sur une île différente.",
      `• Sur l'île de colonie, l'objectif est d'avoir **${COLONY_GOAL.people} habitants, un port, une église, un marché et une ferme**. Le menu (☰) affiche les objectifs en cours.`,
    ],
  },
  {
    id: "market",
    group: "Bâtiments",
    emoji: "🛒",
    title: "Marché",
    structure: "market",
    paras: [
      cost("market"),
      `Une **caravane de marchands** passe de temps en temps (environ une fois par jour), s'installe à côté du marché pendant **${Math.round(MARKET_STAY_SEC / 60)} minutes** environ, puis repart avec ce qui lui reste. Une notification t'avertit de son arrivée et de son départ.`,
      `• Elle **vend** quelques marchandises au hasard (**${MARKET_BUY_MULT} ×** le prix d'export) : tu les achètes avec les boutons **+1** et **+5**, elles sont rangées dans tes dépôts (il faut de la place).`,
      `• Elle **achète** d'autres marchandises (**${MARKET_SELL_MULT} ×** le prix d'export, mieux que le port) : tu les vends depuis tes dépôts avec **−1** et **−5**, jusqu'à vider sa bourse.`,
      "• Aucun employé : tout se fait depuis le menu du marché. Il faut seulement des **dépôts** (les marchandises vont et viennent par eux).",
    ],
  },
  {
    id: "pigpen",
    group: "Bâtiments",
    emoji: "🐖",
    title: "Porcherie",
    structure: "pigpen",
    paras: [
      cost("pigpen"),
      `La porcherie abrite jusqu'à **${PIGS_MAX} cochons** (${PIG_PRICE} 🪙 le porcelet, acheté dans son menu ; on peut les revendre).`,
      "• Un cochon **mange des légumes** (blé, maïs, tomates, carottes : ceux de la ferme, rangés au dépôt) et **boit de l'eau** (puits). Bien soigné, il **grandit** ; deux adultes bien soignés font de nouveaux porcelets.",
      `• ${job("pigpen")} : le **porcher** apporte les légumes à l'auge, l'eau à l'abreuvoir, **abat** les adultes quand tu le demandes (bouton **🔪 Faire abattre**) et range la **viande brute** (${PIG_MEAT} par cochon) au dépôt, où le boucher la prend.`,
      `• **Abattage automatique** : il ne garde que ${PIG_KEEP} adultes pour la reproduction et abat les autres tout seul.`,
      "• Prévois : **une ferme avec des légumes**, **un dépôt**, **un puits**, **une boucherie**, le tout relié.",
    ],
  },
  {
    id: "port",
    group: "Bâtiments",
    emoji: "⚓",
    title: "Port",
    structure: "port",
    paras: [
      cost("port"),
      `Le port se pose **sur la côte** (au moins deux cases d'eau contre un côté) ; le quai se tourne tout seul vers l'eau. Un **bateau passe toutes les ${SHIP_CYCLE} s**, charge ce qui attend au quai et **te paie** : c'est ta seule source de pièces.`,
      "• **Tu choisis quoi exporter** : un clic sur le port ouvre une **fenêtre** avec, pour chaque ressource, un réglage « par bateau » (− / +) (0 = pas d'export) et un **stock minimum à garder** : seul ce qui dépasse ce minimum est exporté. Maj + clic : de 5 en 5.",
      `• Tout peut s'exporter : ${(["wood", "plank", "meat", "cuts", "honey", "berries", "wheat", "corn", "tomato", "carrot", "grass", "milk"] as ExportGood[]).map(price).join(" · ")}.`,
      `• ${job("port")} : les **porteurs** prennent les marchandises là où elles sont (dépôts, scieries, boucheries, camps) et les apportent au quai : **relie-les au port par des chemins**.`,
      "• Le menu montre pour chaque ressource le stock, ce qui est déjà au quai et le **gain maximum par bateau**.",
      "• Le port est bruyant. Rien ne part en hiver : la mer gèle et les bateaux s'arrêtent.",
    ],
  },
  {
    id: "apiary",
    group: "Bâtiments",
    emoji: "🐝",
    title: "Rucher",
    structure: "apiary",
    paras: [
      cost("apiary"),
      `Quatre ruches qui font du **miel** (jusqu'à ${HONEY_CAP} pots) **si un ${JOBS.apiary.label.toLowerCase()} s'en occupe** : il soigne les ruches (le soin baisse tout seul), récolte le miel et le porte au dépôt.`,
      "• Le miel est de la **nourriture** et se vend bien au port.",
      "• **Pas de miel en hiver** : les abeilles dorment.",
      "• Les abeilles **gênent** les maisons proches : éloigne le rucher.",
      "• Le miel sert aussi à fabriquer des **sirops** à la maison du soigneur.",
    ],
  },
  {
    id: "clinic",
    group: "Bâtiments",
    emoji: "🩺",
    title: "Maison du soigneur",
    structure: "clinic",
    paras: [
      cost("clinic"),
      `Le ${job("clinic")} prépare des **remèdes** avec des **baies** et du **miel** pris au dépôt (tisane : 2 baies ; sirop : 2 baies + 1 miel), puis **soigne les malades** les plus graves en premier.`,
      "• Il **entre dans la maison** pour préparer, et part en tournée avec le remède. Il se soigne lui-même en premier s'il est malade.",
      "• Le soigneur **gagne de l'expérience** : ses remèdes sont plus efficaces, il gaspille moins.",
      "• **Prévention** (bouton 🛡️) : il donne des tisanes aux villageois exposés (hiver, épidémie…). Coupe-la pour économiser les baies.",
      "• Il faut donc des **baies** (cueilleurs) et du **miel** (rucher) au dépôt.",
    ],
  },
  {
    id: "church",
    group: "Bâtiments",
    emoji: "⛪",
    title: "Église",
    structure: "church",
    paras: [
      cost("church"),
      `L'église a un **cimetière de ${CHURCH_GRAVES} tombes**. Quand un villageois meurt (maladie ou vieillesse), **son corps reste devant sa maison**.`,
      `• ${job("church")} : le **fossoyeur** va chercher le défunt, le porte à l'église et l'enterre.`,
      "• **Un corps non enterré** attriste les maisons voisines et rend les gens malades : ne tarde pas.",
      "• Le menu liste les derniers enterrés (nom, âge, cause). Cimetière plein : les défunts restent dehors.",
    ],
  },
  // ---------- villageois et village ----------
  {
    id: "villagers",
    group: "Villageois et village",
    emoji: "🧑‍🌾",
    title: "Les villageois",
    paras: [
      "Clique un villageois (ou son nom dans une maison, ou une ligne du tableau **👥**) : son menu montre son **métier**, son **âge** et ses jauges.",
      "• **Fatigue** : elle monte quand il marche et travaille, et ne baisse que **chez lui** (il rentre se reposer à bout de forces). Il lui faut une maison.",
      "• **Soif et faim** : il rentre boire et manger dans sa maison dès 60 %. Si la réserve est vide, il en souffre (et se met en colère) : approvisionne les maisons.",
      "• **Mécontentement** : il monte avec les nuisances ou la soif/faim non satisfaites. À 100 % il **menace de partir**, puis quitte le village.",
      "• **Âge** : les villageois vieillissent et **meurent de vieillesse** vers 70-90 ans ; les anciens sont plus lents et plus souvent malades.",
      "• **Emploi** : chaque bâtiment a ses postes. **Changer d'emploi** (menu du villageois) ou **Virer** (menu du bâtiment).",
      "• **👥** (en haut à gauche) ouvre le tableau de tous les villageois et met le jeu en pause.",
    ],
  },
  {
    id: "health",
    group: "Villageois et village",
    emoji: "🤒",
    title: "Maladies",
    paras: [
      "Des villageois tombent malades **au hasard**, plus souvent s'ils ont soif, faim, sont épuisés, ou en hiver. Chaque maladie a une **gravité** qui monte tant qu'elle n'est pas soignée ; **à 100 %, le villageois meurt**.",
      `• ${Object.values(ILLNESSES).map((i) => `${i.emoji} **${i.label}**`).join(" · ")}. Le rhume est bénin ; la **grippe** est une épidémie très contagieuse.`,
      "• Un malade **grave** garde le lit chez lui. Il faut un **soigneur** (maison du soigneur) pour le soigner.",
      "• **Contagion** : dans la même maison, entre maisons voisines, entre collègues. **🚧 Quarantaine** (menu d'une maison avec un malade) : ils restent chez eux et la contagion ne sort plus.",
      "• **Prévention** : le soigneur protège les villageois exposés avec des tisanes.",
    ],
  },
  {
    id: "seasons",
    group: "Villageois et village",
    emoji: "🌸",
    title: "Jour, nuit et saisons",
    paras: [
      `Un **jour** dure ${DAY_SEC / 60} minutes : la nuit tombe, les villageois rentrent plus vite et la fatigue monte. Une **saison** dure ${SEASON_DAYS} jours (calendrier au-dessus de la carte).`,
      "• **🌸 Printemps** : les arbres repoussent vite, le gibier revient.",
      "• **☀️ Été** : on boit davantage, les puits se remplissent moins vite ; le miel est abondant.",
      "• **🍂 Automne** : le gibier donne plus de viande ; pense aux réserves.",
      "• **❄️ Hiver** : on mange bien plus, on avance moins vite, **rien ne pousse**, les abeilles dorment, **les bateaux s'arrêtent** (donc pas d'export).",
    ],
  },
  {
    id: "money",
    group: "Villageois et village",
    emoji: "🪙",
    title: "Pièces et exportation",
    paras: [
      "Il n'y a **pas d'impôts** : les pièces viennent uniquement du **port**, qui exporte ce que tu produis (voir la fiche Port) ; démonter un bâtiment rend la moitié de son prix.",
      "• Règle les **quantités par bateau** dans le menu du port : exporte ce qui est en surplus, **garde** ce dont tes villageois et tes bâtiments ont besoin (planches, nourriture).",
      "• Plus un produit est élaboré, mieux il se vend : viande préparée, miel, tomates, lait…",
      "• **🔨 Construire** affiche le prix de chaque bâtiment ; **🗑 Démolir** et **Démonter** (dans le menu d'un bâtiment) en rendent la moitié.",
    ],
  },
];
