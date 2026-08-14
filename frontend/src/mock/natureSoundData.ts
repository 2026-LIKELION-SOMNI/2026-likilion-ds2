export type NatureSoundCategory =
  | "추천"
  | "비"
  | "물"
  | "숲"
  | "생활 소리";

export interface NatureSound {
  id: number;
  title: string;
  description: string;
  category: Exclude<NatureSoundCategory, "추천">;
  recommended: boolean;
  keywords: string[];
}

export const natureSoundCategories: NatureSoundCategory[] = [
  "추천",
  "비",
  "물",
  "숲",
  "생활 소리",
];

export const natureSounds: NatureSound[] = [
  {
    id: 1,
    title: "잔잔한 빗소리",
    description: "고른 빗방울",
    category: "비",
    recommended: true,
    keywords: ["비", "빗소리", "물", "빗방울"],
  },
  {
    id: 2,
    title: "시냇물 소리",
    description: "시원하고 맑은 시냇물",
    category: "물",
    recommended: true,
    keywords: ["물", "시냇물", "계곡"],
  },
  {
    id: 3,
    title: "느린 파도",
    description: "넓고 부드러운 파도",
    category: "물",
    recommended: true,
    keywords: ["물", "파도", "바다"],
  },
  {
    id: 4,
    title: "숲",
    description: "바람과 풀벌레 소리",
    category: "숲",
    recommended: true,
    keywords: ["숲", "바람", "풀벌레", "자연"],
  },
];