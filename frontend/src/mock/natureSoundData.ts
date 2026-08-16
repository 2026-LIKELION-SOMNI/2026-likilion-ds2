import rainAudio from "../assets/audio/nature/rain.mp3";
import airAudio from "../assets/audio/nature/air.mp3";
import oceanAudio from "../assets/audio/nature/ocean.mp3";
import streamAudio from "../assets/audio/nature/stream.mp3";

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
  category: Exclude<
    NatureSoundCategory,
    "추천"
  >;
  recommended: boolean;
  keywords: string[];

  backendValue:
  | "rain"
  | "stream"
  | "ocean"
  | "wind";

  // 실제 재생할 mp3
  audio: string;
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
    keywords: [
      "비",
      "빗소리",
      "물",
      "빗방울",
    ],
    backendValue: "rain",
    audio: rainAudio,
  },

  {
    id: 2,
    title: "시냇물 소리",
    description: "시원하고 맑은 시냇물",
    category: "물",
    recommended: true,
    keywords: [
      "물",
      "시냇물",
      "계곡",
    ],
    backendValue: "stream",
    audio: streamAudio,
  },

  {
    id: 3,
    title: "느린 파도",
    description: "넓고 부드러운 파도",
    category: "물",
    recommended: true,
    keywords: [
      "물",
      "파도",
      "바다",
    ],
    backendValue: "ocean",
    audio: oceanAudio,
  },

  {
    id: 4,
    title: "공기음",
    description: "잔잔한 공기 소리",
    category: "생활 소리",
    recommended: true,
    keywords: [
      "공기",
      "바람",
      "공기음",
    ],
    backendValue: "wind",
    audio: airAudio,
  },
];