/**
 * Frontend-only mock authentication.
 * Simulates "Sign in with Google" + first-access profile completion.
 * Replace with the real backend (Firebase/Cloud) later — the shape stays the same.
 */

export type MockUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  turma?: string;
  profileCompleted: boolean;
};

const STORAGE_KEY = "biodoraia.auth.user";

const GOOGLE_ACCOUNT = {
  id: "google-mock-1",
  email: "estudante@gmail.com",
  name: "Estudante Biodora",
  avatarUrl: "",
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredUser(): MockUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MockUser) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: MockUser) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearUser() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Simulates the Google popup + lookup of an existing profile. */
export async function signInWithGoogleMock(): Promise<MockUser> {
  await wait(1100);
  const existing = getStoredUser();
  if (existing) return existing;

  const user: MockUser = { ...GOOGLE_ACCOUNT, profileCompleted: false };
  storeUser(user);
  return user;
}

/** Simulates saving Nome + Turma on first access. */
export async function completeProfileMock(input: {
  name: string;
  turma: string;
}): Promise<MockUser> {
  await wait(700);
  const base = getStoredUser() ?? { ...GOOGLE_ACCOUNT, profileCompleted: false };
  const user: MockUser = {
    ...base,
    name: input.name.trim(),
    turma: input.turma.trim(),
    profileCompleted: true,
  };
  storeUser(user);
  return user;
}
