import type { RelaxationActivityType } from "../../api/relaxation";

export interface GuideLine {
  startAt: number;
  text: string;
}

export type RelaxationGuideType = Exclude<
  RelaxationActivityType,
  "none"
>;

export interface RelaxationGuide {
  activityType: RelaxationGuideType;

  headerTitle: string;

  introTitle: string;
  introDescription: string;

  cardEyebrow: string;
  cardTitle: string;
  cardDescription: string;

  sessionTitle: string;

  durationSeconds: number;
  withNatureSound: boolean;

  lines: GuideLine[];
}

const THOUGHT_DISTANCING: RelaxationGuide = {
  activityType: "thought_distancing",

  headerTitle: "생각 거리두기",

  introTitle: "오늘은 걱정이 조금 큰 밤이에요",
  introDescription:
    "불안이 높은 밤이라, 잠들 수 없을 것 같은 생각에서\n잠깐 거리를 두어볼게요.",

  cardEyebrow: "잠들기 전 1분",
  cardTitle: "생각 거리두기",
  cardDescription:
    "시작한 뒤에는 화면을 보지 않아도 돼요.",

  sessionTitle: "생각에서 잠깐 거리를 둘게요",

  durationSeconds: 60,
  withNatureSound: false,

  lines: [
    {
      startAt: 0,
      text: "지금 이명 때문에 오늘도 잠들기\n어려울 것 같다는 생각이 들 수도 있어요.",
    },
    {
      startAt: 13,
      text: "하지만 지금 이명이 불편하게 느껴지는 것과\n오늘 잠들 수 없다는 것은 같은 일이 아니에요.",
    },
    {
      startAt: 26,
      text: "오늘은 이명을 해결하려고\n애쓰지 않아도 괜찮아요.",
    },
    {
      startAt: 37,
      text: "지금 해야 할 일은\n천천히 잠으로 넘어갈 준비를 하는 것뿐이에요.",
    },
    {
      startAt: 49,
      text: "이제 안내는 여기까지 할게요.\n편하게 소리를 들으며 쉬어보세요.",
    },
  ],
};

const TENSION_RELEASE: RelaxationGuide = {
  activityType: "tension_release",

  headerTitle: "긴장 해제",

  introTitle: "오늘은 긴장이\n조금 남아 있는 밤이에요",
  introDescription:
    "오늘 스트레스가 있었던 만큼, 소리를 시작하기 전\n몸에 남은 힘부터 짧게 풀어볼게요.",

  cardEyebrow: "잠들기 전 30초",
  cardTitle: "긴장 해제",
  cardDescription:
    "시작한 뒤에는 화면을 보지 않아도 돼요.",

  sessionTitle: "몸에 남은 힘을 풀어볼게요",

  durationSeconds: 36,
  withNatureSound: false,

  lines: [
    {
      startAt: 0,
      text: "턱에 힘이 들어가 있다면\n가볍게 힘을 풀어주세요.",
    },
    {
      startAt: 10,
      text: "어깨를 귀 쪽으로 살짝 올렸다가\n천천히 내려놓아요.",
    },
    {
      startAt: 20,
      text: "손에 힘을 살짝 주었다가\n편하게 펴주세요.",
    },
    {
      startAt: 30,
      text: "이제 몸에 힘을 더 주지 않아도 괜찮아요.",
    },
  ],
};

const ATTENTION_SHIFT: RelaxationGuide = {
  activityType: "attention_shift",

  headerTitle: "주의 옮기기",

  introTitle: "오늘은 소리가 조금 더\n신경 쓰이는 밤이에요",
  introDescription:
    "불안은 높지 않지만 이명 불편도가 높아,\n주의를 천천히 다른 감각으로 옮겨볼게요.",

  cardEyebrow: "잠들기 전 1분",
  cardTitle: "주의 옮기기",
  cardDescription:
    "시작한 뒤에는 화면을 보지 않아도 돼요.",

  sessionTitle: "주의를 천천히 옮겨볼게요",

  durationSeconds: 63,
  withNatureSound: true,

  lines: [
    {
      startAt: 0,
      text: "지금 이명이 들린다면\n없애려고 하지 말고 잠깐 존재만 알아차려보세요.",
    },
    {
      startAt: 15,
      text: "이번에는 지금 들리는 자연음으로 주의를 천천히 옮겨볼게요.\n소리 안에서 하나의 작은 소리를 찾아보세요.",
    },
    {
      startAt: 30,
      text: "이제 숨이 들어오고 나가는 느낌을\n가볍게 느껴보세요.",
    },
    {
      startAt: 45,
      text: "마지막으로\n몸이 침대와 베개에 닿아 있는 감각을 느껴보세요.",
    },
    {
      startAt: 56,
      text: "이명 말고도\n주의를 둘 수 있는 곳은 있어요.",
    },
  ],
};

const RELAXATION_GUIDES: Record<
  RelaxationGuideType,
  RelaxationGuide
> = {
  thought_distancing: THOUGHT_DISTANCING,
  tension_release: TENSION_RELEASE,
  attention_shift: ATTENTION_SHIFT,
};

export function getRelaxationGuide(
  activityType: RelaxationActivityType,
): RelaxationGuide | null {
  if (activityType === "none") {
    return null;
  }

  return (
    RELAXATION_GUIDES[activityType] ?? null
  );
}

export function resolveGuideAudioUrl(
  activityType: RelaxationGuideType,
  serverAudioUrl?: string | null,
) {
  if (serverAudioUrl) {
    return serverAudioUrl;
  }

  return `/audio/relaxation/${activityType}.mp3`;
}

export function getActiveLineIndex(
  lines: GuideLine[],
  elapsedSeconds: number,
) {
  let activeIndex = 0;

  for (
    let index = 0;
    index < lines.length;
    index += 1
  ) {
    if (lines[index].startAt <= elapsedSeconds) {
      activeIndex = index;
      continue;
    }

    break;
  }

  return activeIndex;
}
