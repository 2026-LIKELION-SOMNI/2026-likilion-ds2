import {
  getUserUuid,
  saveUserUuid,
  removeUserUuid,
} from "../utils/userStorage";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";

interface AnonymousUserResponse {
  uuid: string;
  nickname: string;
  health_data_connected: boolean;
  created_at: string;
  last_accessed_at: string;
}

interface ReconnectResponse {
  profile: AnonymousUserResponse;
}

async function registerAnonymousUser() {
  const response = await fetch(
    `${API_BASE_URL}/api/accounts/register/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_info: navigator.userAgent,
      }),
    },
  );

  if (!response.ok) {
    const error = new Error(
      "익명 사용자 생성에 실패했습니다.",
    );

    Object.assign(error, {
      status: response.status,
    });

    throw error;
  }

  const data =
    (await response.json()) as AnonymousUserResponse;

  saveUserUuid(data.uuid);

  return data;
}

async function reconnectAnonymousUser(uuid: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/accounts/reconnect/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uuid,
        device_info: navigator.userAgent,
      }),
    },
  );

  if (!response.ok) {
    const error = new Error(
      "익명 사용자 재접속에 실패했습니다.",
    );

    Object.assign(error, {
      status: response.status,
    });

    throw error;
  }

  const data =
    (await response.json()) as ReconnectResponse;

  saveUserUuid(data.profile.uuid);

  return data.profile;
}

let ensureUserPromise:
  | Promise<AnonymousUserResponse>
  | null = null;

export function ensureAnonymousUser() {
  if (ensureUserPromise) {
    return ensureUserPromise;
  }

  ensureUserPromise = (async () => {
    const savedUuid = getUserUuid();

    if (!savedUuid) {
      return registerAnonymousUser();
    }

    try {
      return await reconnectAnonymousUser(
        savedUuid,
      );
    } catch (error) {
      const status =
        error instanceof Error &&
        "status" in error
          ? Number(
              (
                error as Error & {
                  status?: number;
                }
              ).status,
            )
          : undefined;

      if (status !== 404) {
        throw error;
      }

      removeUserUuid();

      return registerAnonymousUser();
    }
  })();

  return ensureUserPromise;
}
