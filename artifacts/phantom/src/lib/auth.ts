export interface PhantomUser {
  id: string;
  username: string;
}

const ACCOUNTS_KEY = "phantom_accounts";
const SESSION_KEY = "phantom_session";

interface StoredAccount {
  id: string;
  username: string;
  passwordHash: string;
}

async function hashPassword(password: string): Promise<string> {
  const buf = new TextEncoder().encode(password);
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getAccounts(): StoredAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getSession(): PhantomUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as PhantomUser) : null;
  } catch {
    return null;
  }
}

function saveSession(user: PhantomUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function register(username: string, password: string): Promise<PhantomUser> {
  const trimmed = username.trim().toLowerCase();
  if (trimmed.length < 3) throw new Error("Username must be at least 3 characters");
  if (password.length < 6) throw new Error("Password must be at least 6 characters");

  const accounts = getAccounts();
  if (accounts.some((a) => a.username === trimmed)) {
    throw new Error("Username already taken");
  }

  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();
  const account: StoredAccount = { id, username: trimmed, passwordHash };
  saveAccounts([...accounts, account]);

  const user: PhantomUser = { id, username: trimmed };
  saveSession(user);
  return user;
}

export async function login(username: string, password: string): Promise<PhantomUser> {
  const trimmed = username.trim().toLowerCase();
  const accounts = getAccounts();
  const account = accounts.find((a) => a.username === trimmed);
  if (!account) throw new Error("Account not found");

  const passwordHash = await hashPassword(password);
  if (passwordHash !== account.passwordHash) throw new Error("Wrong password");

  const user: PhantomUser = { id: account.id, username: account.username };
  saveSession(user);
  return user;
}

export function signOut() {
  clearSession();
}

export function getToken(): string | null {
  const session = getSession();
  return session ? btoa(JSON.stringify(session)) : null;
}
