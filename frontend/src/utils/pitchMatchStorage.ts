import type { PitchMatchSession } from "../services/tinnitusService";

const PITCH_MATCH_SESSION_KEY =
  "somni-pitch-match-session";

export function savePitchMatchSession(
  session: PitchMatchSession,
) {
  sessionStorage.setItem(
    PITCH_MATCH_SESSION_KEY,
    JSON.stringify(session),
  );
}

export function getPitchMatchSession():
  | PitchMatchSession
  | null {
  const saved = sessionStorage.getItem(
    PITCH_MATCH_SESSION_KEY,
  );

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(
      saved,
    ) as PitchMatchSession;
  } catch {
    return null;
  }
}

export function clearPitchMatchSession() {
  sessionStorage.removeItem(
    PITCH_MATCH_SESSION_KEY,
  );
}