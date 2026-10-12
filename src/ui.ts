// Interface HTML : message passager et barre de construction (camps, dépôts, chemins).
import { drawStructureThumb } from "./draw";
import { tl } from "./theme";
import { STRUCTURE_LIST, STRUCTURES } from "./structures";
import { Save } from "./state";

export const ERASE = "erase";

let toastTimer = 0;
let toastHideTimer = 0;
// Le message glisse depuis le haut, reste un moment, puis s'efface en douceur.
export function toast(text: string) {
  const t = document.getElementById("toast") as HTMLElement;
  t.textContent = text;
  clearTimeout(toastTimer);
  clearTimeout(toastHideTimer);
  t.style.display = "block";
  t.classList.remove("show", "hide");
  void t.offsetWidth; // relance l'animation même si un message était déjà affiché
  t.classList.add("show");
  toastTimer = window.setTimeout(() => {
    t.classList.remove("show");
    t.classList.add("hide");
    toastHideTimer = window.setTimeout(() => (t.style.display = "none"), 260);
  }, 3800);
}

export interface BuildView {
  open: boolean;
  selected: string | null; // une structure du catalogue, ou ERASE
}

export interface BuildHandlers {
  onToggle(open: boolean): void;
  onSelect(id: string | null): void;
}

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// Vignette dessinée avec le même code que le jeu.
function thumb(id: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 56;
  drawStructureThumb(c, id);
  return c;
}

export class BuildUI {
  private buttons = new Map<string, HTMLButtonElement>();
  private last = "";

  constructor(private h: BuildHandlers, private view: () => BuildView) {
    const list = $("pieces");
    for (const def of STRUCTURE_LIST) {
      const b = document.createElement("button");
      b.className = "piece";
      b.appendChild(thumb(def.id));
      const name = document.createElement("span");
      name.textContent = tl(def.label);
      const price = document.createElement("small");
      b.append(name, price);
      b.addEventListener("click", () => this.h.onSelect(this.view().selected === def.id ? null : def.id));
      list.appendChild(b);
      this.buttons.set(def.id, b);
    }
    $("buildBtn").addEventListener("click", () => this.h.onToggle(!this.view().open));
    $("erase").addEventListener("click", () => this.h.onSelect(this.view().selected === ERASE ? null : ERASE));
    $("closeBuild").addEventListener("click", () => this.h.onToggle(false));
  }

  sync(save: Save) {
    const v = this.view();
    const sig = `${v.open}|${v.selected}|${save.coins}`;
    if (sig === this.last) return;
    this.last = sig;

    $("build").classList.toggle("open", v.open);
    $("buildBtn").classList.toggle("on", v.open);
    $("erase").classList.toggle("sel", v.selected === ERASE);

    for (const def of STRUCTURE_LIST) {
      const b = this.buttons.get(def.id)!;
      b.classList.toggle("sel", v.selected === def.id);
      b.classList.toggle("poor", save.coins < def.cost);
      const coins = def.kind === "road" ? `${def.cost} 🪙 la case` : def.cost > 0 ? `${def.cost} 🪙` : "Sans pièces";
      b.querySelector("small")!.textContent = def.woodCost ? `${coins}
+ ${def.woodCost} ${def.material === "plank" ? "planches" : "bois"}` : coins; // le prix en pièces de chaque construction, puis les matériaux à livrer
    }

    let tip = "Choisis une structure, puis touche une case pour la poser.";
    if (v.selected === ERASE) tip = "Touche un chantier, un camp, un dépôt ou une case de chemin pour le démolir (la moitié du prix est rendue).";
    else if (v.selected) tip = `${STRUCTURES[v.selected].label} : ${STRUCTURES[v.selected].desc}`;
    $("buildTip").textContent = tip;
  }
}
