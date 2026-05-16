const API = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "") || "";

export function getToken(): string | null {
  return localStorage.getItem("phantom_token");
}

export function clearToken() {
  localStorage.removeItem("phantom_token");
}

export async function verifyPasscode(passcode: string): Promise<string> {
  const res = await fetch(`${API}/api/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Wrong passcode");
  localStorage.setItem("phantom_token", data.token);
  return data.token;
}

export function signOut() {
  clearToken();
}
