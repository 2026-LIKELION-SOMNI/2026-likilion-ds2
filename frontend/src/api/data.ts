export interface HealthConnectionResponse {
  health_data_connected: boolean;
}

export interface DeleteAllDataResponse {
  deleted_records: Record<
    string,
    number
  >;

  health_data_connected: boolean;
}

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    url,
    {
      ...options,
      headers: {
        "Content-Type":
          "application/json",
        ...options?.headers,
      },
    },
  );

  if (!response.ok) {
    const errorBody =
      await response
        .json()
        .catch(() => null);

    console.error(
      "Data API 실패:",
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
 * 연결된 건강 데이터 상태 조회
 */
export async function getHealthConnection(
  uuid: string,
) {
  return request<HealthConnectionResponse>(
    `/api/data/health-connection/${uuid}/`,
  );
}

/*
 * 건강 데이터 연결 해제
 */
export async function disconnectHealthData(
  uuid: string,
) {
  return request<HealthConnectionResponse>(
    `/api/data/health-connection/${uuid}/disconnect/`,
    {
      method: "POST",
    },
  );
}

/*
 * 전체 데이터 삭제
 */
export async function deleteAllUserData(
  uuid: string,
) {
  return request<DeleteAllDataResponse>(
    `/api/data/delete-all/${uuid}/`,
    {
      method: "POST",
    },
  );
}