import { request } from "./client";

import type { RelaxationActivityType } from "./relaxation";

export interface TodayRoutineSummary {
  intervention_type: string | null;
  relaxation_activity_type: RelaxationActivityType | null;
  tinnitus_discomfort: number | null;
  anxiety: number | null;
  stress: boolean | null;
  sound_summary: string | null;
}

export interface HomeComfortableSound {
  session_id: string | null;
  sound_summary: string | null;
  evaluated_at: string | null;
}

export interface HomeSummary {
  is_new_user: boolean;
  has_checked_in_today: boolean;
  has_pending_evaluation: boolean;

  today_routine: TodayRoutineSummary | null;
  comfortable_sound: HomeComfortableSound | null;
}

export function getHomeSummary(uuid: string) {
  return request<HomeSummary>(
    `/api/home/${uuid}/`,
  );
}
