export interface MyPageProfileSummary {
  tinnitus_type: string | null;
  center_frequency: number | null;
  lower_bound: number | null;
  upper_bound: number | null;

  texture: string | null;
  layer_mix: string | null;
}

export interface NotificationSettings {
  checkin_reminder_enabled: boolean;
  checkin_reminder_time: string | null;

  result_reminder_enabled: boolean;
  result_reminder_time: string | null;

  updated_at: string;
}

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => null);

    console.error(
      "MyPage API 실패:",
      errorBody,
    );

    throw new Error(
      errorBody?.detail ??
        `API 요청 실패 (${response.status})`,
    );
  }

  return response.json() as Promise<T>;
}

/*
 * 마이페이지 이명 + SoundFit 요약 조회
 */
export async function getMyPageProfileSummary(
  uuid: string,
) {
  return request<MyPageProfileSummary>(
    `/api/mypage/tinnitus-profile-summary/${uuid}/`,
  );
}

/*
 * 알림 설정 조회
 */
export async function getNotificationSettings(
  uuid: string,
) {
  return request<NotificationSettings>(
    `/api/mypage/notification-settings/${uuid}/`,
  );
}

/*
 * 알림 설정 저장
 */
export async function updateNotificationSettings(
  uuid: string,
  settings: {
    checkin_reminder_enabled: boolean;
    checkin_reminder_time: string | null;
    result_reminder_enabled: boolean;
    result_reminder_time: string | null;
  },
) {
  return request<NotificationSettings>(
    `/api/mypage/notification-settings/${uuid}/`,
    {
      method: "PUT",
      body: JSON.stringify(settings),
    },
  );
}