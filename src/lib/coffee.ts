export type CoffeeWeight = 250 | 500 | 750 | 1000;
export type GrindSize = "fine" | "medium" | "coarse" | "biji";

export const COFFEE_WEIGHTS: { value: CoffeeWeight; label: string; ratio: number }[] = [
  { value: 250, label: "250 gram", ratio: 0.25 },
  { value: 500, label: "500 gram", ratio: 0.5 },
  { value: 750, label: "750 gram", ratio: 0.75 },
  { value: 1000, label: "1000 gram (1 Kg)", ratio: 1.0 },
];

export const GRIND_SIZES: { value: GrindSize; label: string; desc: string }[] = [
  { value: "biji", label: "Biji Utuh (Whole Bean)", desc: "Untuk digiling sendiri di rumah" },
  { value: "coarse", label: "Giling Kasar (Coarse)", desc: "French Press, Cold Brew" },
  { value: "medium", label: "Giling Sedang (Medium)", desc: "V60, Aeropress, Drip" },
  { value: "fine", label: "Giling Halus (Fine)", desc: "Espresso, Kopi Tubruk" },
];

export function calculateUnitPrice(pricePerKg: number, weight: CoffeeWeight): number {
  return Math.round((pricePerKg * weight) / 1000);
}

export function truncateWords(text: string | null | undefined, maxWords = 10): string {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}
