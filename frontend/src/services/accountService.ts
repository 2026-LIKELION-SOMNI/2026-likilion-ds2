import {
  getUserUuid,
  saveUserUuid,
} from "../utils/userStorage";

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
    "/api/accounts/register/",
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
    throw new Error(
      "익명 사용자 생성에 실패했습니다.",
    );
  }

  const data =
    (await response.json()) as AnonymousUserResponse;

  saveUserUuid(data.uuid);

  return data;
}

async function reconnectAnonymousUser(uuid: string) {
  const response = await fetch(
    "/api/accounts/reconnect/",
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
    throw new Error(
      "익명 사용자 재접속에 실패했습니다.",
    );
  }

  const data =
    (await response.json()) as ReconnectResponse;

  saveUserUuid(data.profile.uuid);

  return data.profile;
}

export async function ensureAnonymousUser() {
  const savedUuid = getUserUuid();

  if (!savedUuid) {
    return registerAnonymousUser();
  }

  try {
    return await reconnectAnonymousUser(savedUuid);
  } catch {
    /*
      localStorage에는 UUID가 있는데
      백엔드 DB에는 해당 사용자가 없는 경우
      새 사용자 생성
    */
    removeInvalidUuid();

    return registerAnonymousUser();
  }
}

function removeInvalidUuid() {
  localStorage.removeItem("somni-user-uuid");
}