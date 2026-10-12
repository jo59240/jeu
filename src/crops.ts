// Cultures disponibles. Les noms de modèles viennent du fichier Crops.fbx : <modèle>_F1, _F2, _F3
// = trois stades de croissance (jeune, en croissance, prêt à récolter).
export interface CropDef {
  id: string;
  label: string;
  emoji: string;
  model: string; // préfixe des modèles dans le FBX
  cost: number; // prix de la graine
  gain: number; // pièces gagnées à la récolte
  growMs: number;
}

export const CROPS: CropDef[] = [
  { id: "carrot", label: "Carotte", emoji: "🥕", model: "Carrot", cost: 3, gain: 7, growMs: 15_000 },
  { id: "potato", label: "Pomme de terre", emoji: "🥔", model: "Potatoe", cost: 4, gain: 10, growMs: 25_000 },
  { id: "wheat", label: "Blé", emoji: "🌾", model: "Wheat", cost: 5, gain: 13, growMs: 30_000 },
  { id: "tomato", label: "Tomate", emoji: "🍅", model: "Tomatoe", cost: 6, gain: 17, growMs: 40_000 },
];

export const CROP_BY_ID: Record<string, CropDef> = Object.fromEntries(CROPS.map((c) => [c.id, c]));

// Stade affiché (0, 1, 2) selon l'avancement de la pousse (0..1).
export function stageOf(progress: number): number {
  return progress >= 1 ? 2 : progress >= 0.4 ? 1 : 0;
}
