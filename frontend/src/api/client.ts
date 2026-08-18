function extractErrorMessage(
  body: unknown,
  status: number,
) {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;

    if (typeof record.detail === "string") {
      return record.detail;
    }

    const firstValue = Object.values(record)[0];

    if (typeof firstValue === "string") {
      return firstValue;
    }

    if (
      Array.isArray(firstValue) &&
      typeof firstValue[0] === "string"
    ) {
      return firstValue[0];
    }
  }

  return `요청에 실패했어요 (${status})`;
}

async function send<T>(
  url: string,
  options: RequestInit | undefined,
  nullOn404: boolean,
): Promise<T | null> {
  const response = await fetch(url, {
    ...options,
    headers: options?.body
      ? {
          "Content-Type": "application/json",
          ...options?.headers,
        }
      : options?.headers,
  });

  if (nullOn404 && response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => null);

    throw new Error(
      extractErrorMessage(body, response.status),
    );
  }

  return (await response.json()) as T;
}

export function request<T>(
  url: string,
  options?: RequestInit,
) {
  return send<T>(
    url,
    options,
    false,
  ) as Promise<T>;
}

export function requestOrNull<T>(
  url: string,
  options?: RequestInit,
) {
  return send<T>(url, options, true);
}

export function toErrorMessage(
  error: unknown,
  fallback: string,
) {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
}
