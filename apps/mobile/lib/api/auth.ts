import { apiClient, tokenStorage } from "./client";

export interface LoginCredentials {
  email: string;
  password: string;
  deviceId?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId: string;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface MFAVerifyPayload {
  sessionToken: string;
  code: string;
}

// POST /api/auth/mobile/login
export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    "/api/auth/mobile/login",
    credentials,
  );
  await tokenStorage.saveTokens(data.accessToken, data.refreshToken);
  return data;
}

// POST /api/auth/mobile/logout
export async function logout(): Promise<void> {
  try {
    await apiClient.post("/api/auth/mobile/logout");
  } finally {
    await tokenStorage.clearTokens();
  }
}

// POST /api/auth/mobile/refresh
export async function refreshToken(): Promise<AuthResponse> {
  const refresh = await tokenStorage.getRefreshToken();
  if (!refresh) throw new Error("No refresh token stored");
  const { data } = await apiClient.post<AuthResponse>(
    "/api/auth/mobile/refresh",
    { refreshToken: refresh },
  );
  await tokenStorage.saveTokens(data.accessToken, data.refreshToken);
  return data;
}

// GET /api/auth/session - validate session and get current user
export async function getSession(): Promise<AuthResponse["user"] | null> {
  try {
    const { data } = await apiClient.get<{ user: AuthResponse["user"] }>(
      "/api/auth/session",
    );
    return data.user;
  } catch {
    return null;
  }
}

// POST /api/auth/mfa/verify
export async function verifyMFA(
  payload: MFAVerifyPayload,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    "/api/auth/mfa/verify",
    payload,
  );
  await tokenStorage.saveTokens(data.accessToken, data.refreshToken);
  return data;
}
