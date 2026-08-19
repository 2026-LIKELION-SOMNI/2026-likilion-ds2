const KOREAN_LANG = "ko-KR";

export function isSpeechSupported() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window
  );
}

export function primeSpeech() {
  if (!isSpeechSupported()) {
    return;
  }

  const warmup =
    new SpeechSynthesisUtterance(" ");

  warmup.lang = KOREAN_LANG;
  warmup.volume = 0;

  window.speechSynthesis.speak(warmup);
}

function pickKoreanVoice() {
  const voices =
    window.speechSynthesis.getVoices();

  return (
    voices.find(
      (voice) => voice.lang === KOREAN_LANG,
    ) ??
    voices.find((voice) =>
      voice.lang.startsWith("ko"),
    ) ??
    null
  );
}

export function speakGuideLine(text: string) {
  if (!isSpeechSupported()) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(
      text.replace(/\n/g, " "),
    );

  utterance.lang = KOREAN_LANG;
  utterance.rate = 0.85;
  utterance.pitch = 0.95;
  utterance.volume = 1;

  const voice = pickKoreanVoice();

  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (!isSpeechSupported()) {
    return;
  }

  window.speechSynthesis.cancel();
}
