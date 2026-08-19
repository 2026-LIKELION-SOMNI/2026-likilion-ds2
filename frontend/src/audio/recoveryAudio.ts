import type { GeneratedSoundParams, } from "../api/sound";
import { getAudioContext, resumeAudioContext, } from "./audioContext";
import rainAudio from "../assets/audio/nature/rain.mp3";
import streamAudio from "../assets/audio/nature/stream.mp3";
import oceanAudio from "../assets/audio/nature/ocean.mp3";
import airAudio from "../assets/audio/nature/air.mp3";

/*
 * 현재 회복 세션에서 사용하는 오디오 노드
 */
let currentSources: AudioScheduledSourceNode[] = [];
let currentNodes: AudioNode[] = [];

let masterGain: GainNode | null = null;

let isRecoveryAudioPlaying = false;
async function loadAudioBuffer(
  context: AudioContext,
  url: string,
) {
  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `자연음 파일을 불러오지 못했어요: ${url}`,
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  return context.decodeAudioData(
    arrayBuffer,
  );
}

/*
 * white noise 생성
 */
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

  const data =
    buffer.getChannelData(0);

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
 * pink noise 생성
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
     * 출력 크기 보정
     */
    output[index] =
      pink * 0.11;
  }

  return buffer;
}

/*
 * 현재 회복 세션 오디오 전체 종료
 */
export function stopRecoveryAudio() {
  currentSources.forEach((source) => {
    try {
      source.stop();
    } catch {
      // 이미 종료된 source 무시
    }
  });

  currentNodes.forEach((node) => {
    try {
      node.disconnect();
    } catch {
      // 이미 disconnect된 node 무시
    }
  });

  currentSources = [];
  currentNodes = [];

  masterGain = null;

  isRecoveryAudioPlaying = false;
}

/*
 * 회복 세션 사운드 생성 + 재생
 *
 * 백엔드 generated_params를 그대로 사용한다.
 */
export async function playRecoveryAudio(
  params: GeneratedSoundParams,
) {
  stopRecoveryAudio();

  const context =
    await resumeAudioContext();

  /*
   * 최종 출력 master gain
   */
  const master =
    context.createGain();

  /*
   * mixing point에서 찾은 gain까지만 사용.
   *
   * 예:
   * target_volume = 0.132
   */
  const targetVolume =
    Math.min(
      params.mixing_point_ramp
        ?.target_volume ??
        params.initial_volume,
      params.max_volume,
    );

  master.gain.setValueAtTime(
    targetVolume,
    context.currentTime,
  );

  master.connect(
    context.destination,
  );

  masterGain = master;

  currentNodes.push(master);

  /*
   * ============================
   * 1. 노치 핑크노이즈
   * ============================
   */

  const maskingSourceSpec =
    params.sources.find(
      (source) =>
        source.role ===
        "tinnitus_masking",
    );

  const frequencyBand =
    params.frequency_bands[0];

  if (
    maskingSourceSpec &&
    frequencyBand
  ) {
    const pinkSource =
      context.createBufferSource();

    pinkSource.buffer =
      createPinkNoiseBuffer(
        context,
      );

    pinkSource.loop = true;

    /*
     * 백엔드 mix_ratio 적용
     *
     * 예:
     * tinnitus_masking = 0.6
     */
    const maskingGain =
      context.createGain();

    maskingGain.gain.setValueAtTime(
      params.mix_ratio
        .tinnitus_masking,
      context.currentTime,
    );

    let previousNode:
      AudioNode = pinkSource;

    const notchNodes:
      BiquadFilterNode[] = [];

    /*
     * 백엔드에서 계산한 notch stages를
     * 그대로 Web Audio API에 적용
     */
    frequencyBand.stages.forEach(
      (stage) => {
        const notch =
          context.createBiquadFilter();

        notch.type = "notch";

        notch.frequency.setValueAtTime(
          stage.center_hz,
          context.currentTime,
        );

        notch.Q.setValueAtTime(
          stage.q,
          context.currentTime,
        );

        previousNode.connect(
          notch,
        );

        previousNode = notch;

        notchNodes.push(notch);
      },
    );

    previousNode
      .connect(maskingGain)
      .connect(master);

    pinkSource.start();

    currentSources.push(
      pinkSource,
    );

    currentNodes.push(
      pinkSource,
      ...notchNodes,
      maskingGain,
    );
  }

  /*
   * ============================
   * 2. 배경 사운드
   * ============================
   */

  const ambientSourceSpec =
    params.sources.find(
      (source) =>
        source.role === "ambient",
    );

  if (ambientSourceSpec) {
    const ambientSource =
      context.createBufferSource();

/*
 * 백엔드의 asset_tag에 맞는
 * 실제 자연음 mp3를 불러와 재생한다.
 *
 * rain / stream / ocean / air
 *
 * 예외적으로 알 수 없는 값이 오면
 * white noise로 fallback한다.
 */
    switch (
      ambientSourceSpec.asset_tag
    ) {
      case "rain":
        ambientSource.buffer =
          await loadAudioBuffer(
            context,
            rainAudio,
          );
        break;

      case "stream":
        ambientSource.buffer =
          await loadAudioBuffer(
            context,
            streamAudio,
          );
        break;

      case "ocean":
        ambientSource.buffer =
          await loadAudioBuffer(
            context,
            oceanAudio,
          );
        break;

      case "air":
        ambientSource.buffer =
          await loadAudioBuffer(
            context,
            airAudio,
          );
        break;

      case "white_noise":
      default:
        ambientSource.buffer =
          createWhiteNoiseBuffer(
            context,
          );
        break;
    }

    ambientSource.loop = true;

    const ambientGain =
      context.createGain();

    /*
     * 예:
     * ambient = 0.4
     */
    ambientGain.gain.setValueAtTime(
      params.mix_ratio.ambient,
      context.currentTime,
    );

    ambientSource
      .connect(ambientGain)
      .connect(master);

    ambientSource.start();

    currentSources.push(
      ambientSource,
    );

    currentNodes.push(
      ambientSource,
      ambientGain,
    );
  }

  isRecoveryAudioPlaying = true;
}

/*
 * 일시정지
 *
 * AudioContext 자체를 suspend해서
 * 모든 레이어를 동시에 멈춘다.
 */
export async function pauseRecoveryAudio() {
  const context =
    getAudioContext();

  if (
    context.state === "running"
  ) {
    await context.suspend();
  }

  isRecoveryAudioPlaying = false;
}

/*
 * 다시 재생
 */
export async function resumeRecoveryAudio() {
  const context =
    getAudioContext();

  if (
    context.state === "suspended"
  ) {
    await context.resume();
  }

  isRecoveryAudioPlaying = true;
}

/*
 * 현재 재생 여부
 */
export function getRecoveryAudioPlaying() {
  return isRecoveryAudioPlaying;
}

/*
 * master gain 변경
 */
export function setRecoveryVolume(
  volume: number,
  maxVolume = 0.6,
) {
  if (!masterGain) {
    return;
  }

  const context =
    getAudioContext();

  const safeVolume =
    Math.max(
      0,
      Math.min(
        volume,
        maxVolume,
      ),
    );

  const now =
    context.currentTime;

  masterGain.gain
    .cancelScheduledValues(now);

  masterGain.gain
    .setValueAtTime(
      masterGain.gain.value,
      now,
    );

  masterGain.gain
    .linearRampToValueAtTime(
      safeVolume,
      now + 0.08,
    );
}