export interface ComfortableSound {
  id: number;
  title: string;
  date: string;
  durationMinutes: number;
}

export const comfortableSounds: ComfortableSound[] = [
  {
    id: 1,
    title: "잔잔한 빗소리 + 핑크 노이즈",
    date: "8월 14일",
    durationMinutes: 35,
  },
  {
    id: 2,
    title: "팬·공기음 + 핑크 노이즈",
    date: "8월 9일",
    durationMinutes: 35,
  },
  {
    id: 3,
    title: "잔잔한 파도 + 핑크 노이즈",
    date: "8월 5일",
    durationMinutes: 35,
  },
];