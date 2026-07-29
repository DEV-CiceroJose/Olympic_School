export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
export const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? "true") !== "false";

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL não configurada.");
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    throw new Error(`Falha na requisição (${response.status}).`);
  }
  return (await response.json()) as T;
}
