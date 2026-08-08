export type FrequencyOptionId = "A" | "B";

export interface FrequencyOption {
  id: FrequencyOptionId;
  frequency: number;
}

export interface FrequencyQuestion {
  id: number;
  options: [FrequencyOption, FrequencyOption];
}

export const frequencyQuestions: FrequencyQuestion[] = [
  {
    id: 1,
    options: [
      { id: "A", frequency: 1427 },
      { id: "B", frequency: 4204 },
    ],
  },
  {
    id: 2,
    options: [
      { id: "A", frequency: 1427 },
      { id: "B", frequency: 4204 },
    ],
  },
  {
    id: 3,
    options: [
      { id: "A", frequency: 1427 },
      { id: "B", frequency: 4204 },
    ],
  },
  {
    id: 4,
    options: [
      { id: "A", frequency: 1427 },
      { id: "B", frequency: 4204 },
    ],
  },
  {
    id: 5,
    options: [
      { id: "A", frequency: 1427 },
      { id: "B", frequency: 4204 },
    ],
  },
  {
    id: 6,
    options: [
      { id: "A", frequency: 1427 },
      { id: "B", frequency: 4204 },
    ],
  },
  {
    id: 7,
    options: [
      { id: "A", frequency: 1427 },
      { id: "B", frequency: 4204 },
    ],
  },
];

export const mockFrequencyResult = 853;