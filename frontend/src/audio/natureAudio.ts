let currentAudio: HTMLAudioElement | null = null;

export async function playNatureAudio(
  src: string,
) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  const audio = new Audio(src);
  audio.loop = true;

  currentAudio = audio;

  await audio.play();
}

export function stopNatureAudio() {
  if (!currentAudio) {
    return;
  }

  currentAudio.pause();
  currentAudio.currentTime = 0;
  currentAudio = null;
}