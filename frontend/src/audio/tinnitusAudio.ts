import type { ToneType } from "../services/tinnitusService";

let audioContext: AudioContext | null = null;

let currentSources: Array<
  AudioBufferSourceNode | OscillatorNode
> = [];

let currentGainNode: GainNode | null = null;

/*
 * 백엔드 sound/services.py와 동일한 노치 설계값
 */
const HALF_OCTAVE_RATIO = 2 ** 0.25;
const NOTCH_STAGE_COUNT = 6;
const NOTCH_STAGE_Q = 5.6;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

async function resumeAudioContext() {
  const context = getAudioContext();

  if (context.state === "suspended") {
    await context.resume();
  }

  return context;
}

function createWhiteNoiseBuffer(
  context: AudioContext,
  durationSeconds = 2,
) {
  const length =
    context.sampleRate * durationSeconds;

  const buffer = context.createBuffer(
    1,
    length,
    context.sampleRate,
  );

  const data = buffer.getChannelData(0);

  for (
    let index = 0;
    index < length;
    index += 1
  ) {
    data[index] =
      Math.random() * 2 - 1;
  }

  return buffer;
}

/*
 * pink noise 근사용 버퍼
 *
 * white noise를 필터링하는 방식보다
 * 현재 MVP에서는 이 방식으로 충분.
 */
function createPinkNoiseBuffer(
  context: AudioContext,
  durationSeconds = 2,
) {
  const length =
    context.sampleRate * durationSeconds;

  const buffer = context.createBuffer(
    1,
    length,
    context.sampleRate,
  );

  const output =
    buffer.getChannelData(0);

  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (
    let index = 0;
    index < length;
    index += 1
  ) {
    const white =
      Math.random() * 2 - 1;

    b0 =
      0.99886 * b0 +
      white * 0.0555179;

    b1 =
      0.99332 * b1 +
      white * 0.0750759;

    b2 =
      0.969 * b2 +
      white * 0.153852;

    b3 =
      0.8665 * b3 +
      white * 0.3104856;

    b4 =
      0.55 * b4 +
      white * 0.5329522;

    b5 =
      -0.7616 * b5 -
      white * 0.016898;

    const pink =
      b0 +
      b1 +
      b2 +
      b3 +
      b4 +
      b5 +
      b6 +
      white * 0.5362;

    b6 =
      white * 0.115926;

    /*
     * 출력이 너무 커지지 않도록 보정
     */
    output[index] =
      pink * 0.11;
  }

  return buffer;
}

/*
 * octave 단위 대역폭
 * → bandpass Q 변환
 */
function octaveBandwidthToQ(
  bandwidthOctave: number,
) {
  const halfRatio =
    2 ** (bandwidthOctave / 2);

  const fractionalBandwidth =
    halfRatio - 1 / halfRatio;

  return 1 / fractionalBandwidth;
}

/*
 * 현재 재생 중인 모든 소리 종료
 */
export function stopTinnitusAudio() {
  currentSources.forEach((source) => {
    try {
      source.stop();
      source.disconnect();
    } catch {
      // 이미 종료된 경우 무시
    }
  });

  currentSources = [];
  currentGainNode = null;
}

/*
 * =========================
 * A/B 음역 매칭용 NBN
 * =========================
 */
export async function playMatchingNoise(
  centerFrequency: number,
  bandwidthOctave: number,
) {
  stopTinnitusAudio();

  const context =
    await resumeAudioContext();

  const source =
    context.createBufferSource();

  source.buffer =
    createWhiteNoiseBuffer(context);

  source.loop = true;

  const bandpass =
    context.createBiquadFilter();

  bandpass.type = "bandpass";

  bandpass.frequency.setValueAtTime(
    centerFrequency,
    context.currentTime,
  );

  bandpass.Q.setValueAtTime(
    octaveBandwidthToQ(
      bandwidthOctave,
    ),
    context.currentTime,
  );

  const gain =
    context.createGain();

  /*
   * A/B 비교음 초기 크기
   */
  gain.gain.setValueAtTime(
    0.08,
    context.currentTime,
  );

  source
    .connect(bandpass)
    .connect(gain)
    .connect(context.destination);

  source.start();

  currentSources = [source];
  currentGainNode = gain;
}

/*
 * =========================
 * 이명 유형 예시음
 * =========================
 */
export async function playTinnitusTypePreview(
  type: ToneType,
) {
  stopTinnitusAudio();

  const context =
    await resumeAudioContext();

  if (type === "high") {
    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    oscillator.type = "sine";

    oscillator.frequency.value =
      6000;

    gain.gain.value = 0.035;

    oscillator
      .connect(gain)
      .connect(
        context.destination,
      );

    oscillator.start();

    currentSources = [
      oscillator,
    ];

    currentGainNode = gain;

    return;
  }

  if (type === "low") {
    await playMatchingNoise(
      700,
      1 / 16,
    );

    return;
  }

  if (type === "wide") {
    await playMatchingNoise(
      5000,
      1 / 3,
    );

    return;
  }

  /*
   * multiple 예시
   */
  const low =
    context.createOscillator();

  const high =
    context.createOscillator();

  const gain =
    context.createGain();

  low.type = "sine";
  low.frequency.value = 700;

  high.type = "sine";
  high.frequency.value = 4500;

  gain.gain.value = 0.02;

  low.connect(gain);
  high.connect(gain);

  gain.connect(
    context.destination,
  );

  low.start();
  high.start();

  currentSources = [
    low,
    high,
  ];

  currentGainNode = gain;
}

/*
 * =========================
 * 혼합점 탐색용 노치 사운드
 * =========================
 *
 * 백엔드와 동일:
 * - pink noise
 * - ± 1/4 octave
 * - notch 6개
 * - Q = 5.6
 */
export async function playMixingPointNoise(
  centerFrequency: number,
  initialGain = 0.05,
) {
  stopTinnitusAudio();

  const context =
    await resumeAudioContext();

  const source =
    context.createBufferSource();

  source.buffer =
    createPinkNoiseBuffer(
      context,
    );

  source.loop = true;

  const lower =
    centerFrequency /
    HALF_OCTAVE_RATIO;

  const upper =
    centerFrequency *
    HALF_OCTAVE_RATIO;

  /*
   * 첫 번째 연결 지점
   */
  let previousNode:
    AudioNode = source;

  /*
   * 백엔드와 동일하게
   * 로그 간격으로 notch 6개 배치
   */
  for (
    let index = 0;
    index < NOTCH_STAGE_COUNT;
    index += 1
  ) {
    const t =
      index /
      (NOTCH_STAGE_COUNT - 1);

    const frequency =
      Math.exp(
        Math.log(lower) +
          (
            Math.log(upper) -
            Math.log(lower)
          ) *
            t,
      );

    const notch =
      context.createBiquadFilter();

    notch.type = "notch";

    notch.frequency.setValueAtTime(
      frequency,
      context.currentTime,
    );

    notch.Q.setValueAtTime(
      NOTCH_STAGE_Q,
      context.currentTime,
    );

    previousNode.connect(notch);

    previousNode = notch;
  }

  const gain =
    context.createGain();

  gain.gain.setValueAtTime(
    initialGain,
    context.currentTime,
  );

  previousNode
    .connect(gain)
    .connect(context.destination);

  source.start();

  currentSources = [source];
  currentGainNode = gain;
}

/*
 * =========================
 * 혼합점 gain 실시간 변경
 * =========================
 *
 * UI 슬라이더가 움직일 때 호출.
 */
export function setMixingPointGain(
  gainValue: number,
) {
  if (
    !audioContext ||
    !currentGainNode
  ) {
    return;
  }

  /*
   * 백엔드 실제 저장 상한이 0.6이므로
   * 프론트도 동일하게 제한.
   */
  const safeGain =
    Math.max(
      0,
      Math.min(
        gainValue,
        0.6,
      ),
    );

  const now =
    audioContext.currentTime;

  /*
   * 갑자기 튀는 소리를 피하기 위해
   * 0.08초 정도 부드럽게 변경
   */
  currentGainNode.gain.cancelScheduledValues(
    now,
  );

  currentGainNode.gain.setValueAtTime(
    currentGainNode.gain.value,
    now,
  );

  currentGainNode.gain.linearRampToValueAtTime(
    safeGain,
    now + 0.08,
  );
}

/*
 * 현재 gain 값 조회
 */
export function getCurrentMixingGain() {
  return (
    currentGainNode?.gain.value ??
    0
  );
}