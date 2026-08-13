const USER_UUID_KEY = "somni-user-uuid";

export function getUserUuid() {
  return localStorage.getItem(USER_UUID_KEY);
}

export function saveUserUuid(uuid: string) {
  localStorage.setItem(USER_UUID_KEY, uuid);
}

export function removeUserUuid() {
  localStorage.removeItem(USER_UUID_KEY);
}