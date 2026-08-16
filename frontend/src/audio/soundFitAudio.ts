import {
  resumeAudioContext,
} from "./audioContext";

type SoundFitAxis =
  | "texture"
  | "layer_mix";

type SoundFitOption =
  | "A"
  | "B";

let currentSources:
  AudioBufferSourceNode[] = [];

let currentNodes:
  AudioNode[] = [];

/*
 * 1단계 / 2단계 체감 볼륨 보정
 *
 * 1단계는 자연음 단일 소스라 조금 크게,
 * 2단계는 자연음 + 핑크노이즈가 섞이므로 조금 작게.
 */
const TEXTURE_PREVIEW_VOLUME = 2.0;
const MIX_PREVIEW_VOLUME = 0.2;

/*
 * pink noise
 */
function createPinkNoiseBuffer(
  context: AudioContext,
  durationSeconds = 2,
) {
  const length =
    context.sampleRate *
    durationSeconds;

  const buffer =
    context.createBuffer(
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

    output[index] =
      pink * 0.11;
  }

  return buffer;
}

/*
 * 자연음 파일을 AudioBuffer로 로드
 */
async function loadAudioBuffer(
  context: AudioContext,
  src: string,
) {
  const response =
    await fetch(src);

  if (!response.ok) {
    throw new Error(
      "자연음 파일을 불러오지 못했어요.",
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  return context.decodeAudioData(
    arrayBuffer,
  );
}

/*
 * 현재 Sound Fit 비교음 정지
 */
export function stopSoundFitAudio() {
  currentSources.forEach(
    (source) => {
      try {
        source.stop();
      } catch {
        // 이미 정지된 경우 무시
      }
    },
  );

  currentNodes.forEach(
    (node) => {
      try {
        node.disconnect();
      } catch {
        // 이미 disconnect된 경우 무시
      }
    },
  );

  currentSources = [];
  currentNodes = [];
}

/*
 * AI Sound Fit 비교음
 *
 * texture
 * A = soft
 * B = clear
 *
 * layer_mix
 * A = 자연음 위주
 * B = 노이즈 위주
 */
export async function playSoundFitPreview(
  natureSrc: string,
  axis: SoundFitAxis,
  option: SoundFitOption,
) {
  stopSoundFitAudio();

  const context =
    await resumeAudioContext();

  const natureBuffer =
    await loadAudioBuffer(
      context,
      natureSrc,
    );

  /*
   * =========================
   * 1단계 Texture
   * =========================
   */
  if (axis === "texture") {
    const source =
      context.createBufferSource();

    source.buffer =
      natureBuffer;

    source.loop = true;

    const filter =
      context.createBiquadFilter();

    const gain =
      context.createGain();

    if (option === "A") {
      /*
       * A = soft
       *
       * 고역을 줄여
       * 조금 더 부드럽게 들리도록 함.
       */
      filter.type =
        "lowpass";

      filter.frequency.setValueAtTime(
        2200,
        context.currentTime,
      );

      filter.Q.setValueAtTime(
        0.7,
        context.currentTime,
      );
    } else {
      /*
       * B = clear
       *
       * 고역 존재감을 올려
       * 조금 더 또렷하게 들리도록 함.
       */
      filter.type =
        "highshelf";

      filter.frequency.setValueAtTime(
        2400,
        context.currentTime,
      );

      filter.gain.setValueAtTime(
        5,
        context.currentTime,
      );
    }

    /*
     * A/B는 동일한 출력 볼륨 사용.
     *
     * 2단계보다 크게 설정해서
     * 단계 간 체감 볼륨 차이를 보정.
     */
    gain.gain.setValueAtTime(
      TEXTURE_PREVIEW_VOLUME,
      context.currentTime,
    );

    source
      .connect(filter)
      .connect(gain)
      .connect(
        context.destination,
      );

    source.start();

    currentSources = [
      source,
    ];

    currentNodes = [
      source,
      filter,
      gain,
    ];

    return;
  }

  /*
   * =========================
   * 2단계 Layer Mix
   * =========================
   *
   * A = 자연음 위주
   * B = 노이즈 위주
   */
  const natureSource =
    context.createBufferSource();

  natureSource.buffer =
    natureBuffer;

  natureSource.loop = true;

  const noiseSource =
    context.createBufferSource();

  noiseSource.buffer =
    createPinkNoiseBuffer(
      context,
    );

  noiseSource.loop = true;

  const natureGain =
    context.createGain();

  const noiseGain =
    context.createGain();

  const masterGain =
    context.createGain();

  if (option === "A") {
    /*
     * A = 자연음 중심
     *
     * 자연음 75%
     * 핑크노이즈 25%
     */
    natureGain.gain.setValueAtTime(
      0.75,
      context.currentTime,
    );

    noiseGain.gain.setValueAtTime(
      0.18,
      context.currentTime,
    );
  } else {
    /*
     * B = 노이즈 중심
     *
     * 자연음 25%
     * 핑크노이즈 75%
     */
    natureGain.gain.setValueAtTime(
      0.35,
      context.currentTime,
    );

    noiseGain.gain.setValueAtTime(
      0.32,
      context.currentTime,
    );
  }

  /*
   * 자연음 + 노이즈 두 소스가 동시에 나오기 때문에
   * 1단계보다 master 볼륨을 낮게 설정.
   */
  masterGain.gain.setValueAtTime(
    MIX_PREVIEW_VOLUME,
    context.currentTime,
  );

  natureSource
    .connect(natureGain)
    .connect(masterGain);

  noiseSource
    .connect(noiseGain)
    .connect(masterGain);

  masterGain.connect(
    context.destination,
  );

  natureSource.start();
  noiseSource.start();

  currentSources = [
    natureSource,
    noiseSource,
  ];

  currentNodes = [
    natureSource,
    noiseSource,
    natureGain,
    noiseGain,
    masterGain,
  ];
}