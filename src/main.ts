import { Game } from "./game";
import { SAVE_KEY } from "./config";
import { applyThemeAttr } from "./theme";

// Si le jeu plante au démarrage, on affiche pourquoi (et de quoi réparer) au lieu de rester sur « Création de l'île… ».
function showError(e: unknown) {
  const box = document.getElementById("loading");
  if (!box) return; // le jeu a déjà démarré : on ne touche à rien
  const msg = e instanceof Error ? `${e.message}\n${(e.stack ?? "").split("\n").slice(1, 4).join("\n")}` : String(e);
  box.style.cssText += ";white-space:pre-wrap;text-align:center;padding:24px;line-height:1.5;font-size:15px";
  box.textContent = "";
  const t = document.createElement("div");
  t.textContent = "😕 Le jeu n'a pas pu démarrer.";
  t.style.cssText = "font-size:20px;font-weight:700;margin-bottom:8px";
  const m = document.createElement("div");
  m.textContent = msg;
  m.style.cssText = "font-family:monospace;font-size:12px;max-width:640px;margin:0 auto 14px;text-align:left;background:rgba(0,0,0,.25);padding:10px;border-radius:8px";
  const row = document.createElement("div");
  const btn = (label: string, fn: () => void) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = "font:inherit;font-weight:700;margin:4px;padding:8px 14px;border-radius:12px;border:3px solid #4a3b2a;background:#fff6dd;cursor:pointer";
    b.addEventListener("click", fn);
    row.appendChild(b);
  };
  btn("🔁 Réessayer", () => location.reload());
  btn("💾 Télécharger ma sauvegarde", () => {
    const raw = localStorage.getItem(SAVE_KEY) ?? "";
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
    a.download = "ferme-sauvegarde-secours.json";
    a.click();
  });
  btn("🗑 Effacer la sauvegarde et recommencer", () => {
    if (!confirm("Effacer la partie en cours ? (télécharge-la d'abord si tu veux la garder)")) return;
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  });
  box.append(t, m, row);
}

applyThemeAttr(); // le thème (viking ou classique) s'applique tout de suite à l'interface
window.addEventListener("error", (ev) => showError(ev.error ?? ev.message));
window.addEventListener("unhandledrejection", (ev) => showError(ev.reason));
try {
  new Game(document.getElementById("game") as HTMLCanvasElement).start();
} catch (e) {
  showError(e);
}
