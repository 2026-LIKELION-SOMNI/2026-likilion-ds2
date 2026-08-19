import { request } from "./client";

const RELAXATION_BASE_URL = "/api/relaxtion";

export type RelaxationActivityType =
  | "thought_distancing"
  | "tension_release"
  | "attention_shift"
  | "none";

export type RelaxationStatus =
  | "recommended"
  | "in_progress"
  | "completed"
  | "skipped"
  | "cancelled";

export type RelaxationRecommendationSource =
  | "rule_based"
  | "personalized";

export interface RelaxationSession {
  id: string;

  activity_type: RelaxationActivityType;
  activity_type_display: string;
  recommendation_source: RelaxationRecommendationSource;

  status: RelaxationStatus;

  tinnitus_discomfort: number;
  anxiety: number;
  stress: boolean;
  fatigue: number | null;
  caffeine: boolean;

  recommended_at: string;
  started_at: string | null;
  ended_at: string | null;
}

type RelaxationSessionAction =
  | "start"
  | "skip"
  | "cancel"
  | "complete";

export function createRelaxationRecommendation(
  uuid: string,
) {
  return request<RelaxationSession>(
    `${RELAXATION_BASE_URL}/${uuid}/recommendation/`,
    {
      method: "POST",
    },
  );
}

function requestSessionAction(
  uuid: string,
  sessionId: string,
  action: RelaxationSessionAction,
) {
  return request<RelaxationSession>(
    `${RELAXATION_BASE_URL}/${uuid}/sessions/${sessionId}/${action}/`,
    {
      method: "POST",
    },
  );
}

export function startRelaxationSession(
  uuid: string,
  sessionId: string,
) {
  return requestSessionAction(
    uuid,
    sessionId,
    "start",
  );
}

export function skipRelaxationSession(
  uuid: string,
  sessionId: string,
) {
  return requestSessionAction(
    uuid,
    sessionId,
    "skip",
  );
}

export function cancelRelaxationSession(
  uuid: string,
  sessionId: string,
) {
  return requestSessionAction(
    uuid,
    sessionId,
    "cancel",
  );
}

export function completeRelaxationSession(
  uuid: string,
  sessionId: string,
) {
  return requestSessionAction(
    uuid,
    sessionId,
    "complete",
  );
}
