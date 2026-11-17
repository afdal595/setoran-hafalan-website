import crypto from "crypto";

export const SESSION_TOKEN_KEY = "session_token";
const SESSION_SECRET = process.env.AUTH_SECRET || "ldk-dev-secret";

export type SessionUser = {
  id: number;
  email: string;
  role: "admin" | "musyrif" | "anggota";
  name: string;
  exp: number;
};

export function createSessionToken(user: Omit<SessionUser, "exp">) {
  const payload: SessionUser = {
    ...user,
    exp: Date.now() + 8 * 60 * 60 * 1000,
  };

  const token = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(token).digest("base64url");
  return `${token}.${signature}`;
}

export function verifySessionToken(token: string | null | undefined): SessionUser | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;
  const expectedSignature = crypto.createHmac("sha256", SESSION_SECRET).update(payloadBase64).digest("base64url");

  if (Buffer.byteLength(signature) !== Buffer.byteLength(expectedSignature)) {
    return null;
  }

  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    try {
      const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as SessionUser;
      if (!payload?.email || !payload?.role || payload.exp < Date.now()) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  return null;
}

export function getSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const token = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_TOKEN_KEY}=`))
    ?.split("=")[1];

  return verifySessionToken(token);
}

export function requireRole(role: "admin" | "musyrif" | "anggota", request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return { ok: false, status: 401, error: "Unauthorized" } as const;
  }

  if (session.role !== role) {
    return { ok: false, status: 403, error: "Forbidden" } as const;
  }

  return { ok: true, session } as const;
}
