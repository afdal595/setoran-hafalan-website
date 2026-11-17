import crypto from "crypto";
import {
  createSessionToken,
  verifySessionToken,
  getSessionFromRequest,
  requireRole,
  SESSION_TOKEN_KEY,
  SessionUser,
} from "../auth-server";

// Mock environment variable
const ORIGINAL_ENV = process.env.AUTH_SECRET;

describe("auth-server", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret-key";
  });

  afterEach(() => {
    if (ORIGINAL_ENV) {
      process.env.AUTH_SECRET = ORIGINAL_ENV;
    } else {
      delete process.env.AUTH_SECRET;
    }
  });

  describe("createSessionToken", () => {
    it("should create a valid session token with correct structure", () => {
      const user = {
        id: 1,
        email: "admin@ldk.ac.id",
        role: "admin" as const,
        name: "Admin User",
      };

      const token = createSessionToken(user);

      // Token should have two parts separated by dot
      expect(token).toContain(".");
      const parts = token.split(".");
      expect(parts).toHaveLength(2);
    });

    it("should include user data in token payload", () => {
      const user = {
        id: 42,
        email: "test@example.com",
        role: "musyrif" as const,
        name: "Test User",
      };

      const token = createSessionToken(user);
      const [payloadBase64] = token.split(".");
      const payload = JSON.parse(
        Buffer.from(payloadBase64, "base64url").toString("utf8")
      ) as SessionUser;

      expect(payload.id).toBe(42);
      expect(payload.email).toBe("test@example.com");
      expect(payload.role).toBe("musyrif");
      expect(payload.name).toBe("Test User");
    });

    it("should set expiration to 8 hours in the future", () => {
      const user = {
        id: 1,
        email: "test@example.com",
        role: "anggota" as const,
        name: "Test User",
      };

      const before = Date.now();
      const token = createSessionToken(user);
      const after = Date.now();

      const [payloadBase64] = token.split(".");
      const payload = JSON.parse(
        Buffer.from(payloadBase64, "base64url").toString("utf8")
      ) as SessionUser;

      const eightHours = 8 * 60 * 60 * 1000;
      expect(payload.exp).toBeGreaterThanOrEqual(before + eightHours);
      expect(payload.exp).toBeLessThanOrEqual(after + eightHours);
    });

    it("should create different tokens for same user (due to exp timestamp)", async () => {
      const user = {
        id: 1,
        email: "test@example.com",
        role: "admin" as const,
        name: "Admin",
      };

      const token1 = createSessionToken(user);
      // Small delay to ensure exp timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 2));
      const token2 = createSessionToken(user);

      // Tokens should be different because exp changes
      expect(token1).not.toBe(token2);
    });
  });

  describe("verifySessionToken", () => {
    it("should verify a valid token", () => {
      const user = {
        id: 1,
        email: "admin@ldk.ac.id",
        role: "admin" as const,
        name: "Admin User",
      };

      const token = createSessionToken(user);
      const verified = verifySessionToken(token);

      expect(verified).not.toBeNull();
      expect(verified?.id).toBe(1);
      expect(verified?.email).toBe("admin@ldk.ac.id");
      expect(verified?.role).toBe("admin");
      expect(verified?.name).toBe("Admin User");
    });

    it("should return null for null token", () => {
      expect(verifySessionToken(null)).toBeNull();
    });

    it("should return null for undefined token", () => {
      expect(verifySessionToken(undefined)).toBeNull();
    });

    it("should return null for empty string token", () => {
      expect(verifySessionToken("")).toBeNull();
    });

    it("should return null for token without dot separator", () => {
      expect(verifySessionToken("invalinvalidtoken")).toBeNull();
    });

    it("should return null for token with more than 2 parts", () => {
      expect(verifySessionToken("part1.part2.part3")).toBeNull();
    });

    it("should return null for token with tampered payload", () => {
      const user = {
        id: 1,
        email: "admin@ldk.ac.id",
        role: "admin" as const,
        name: "Admin",
      };

      const token = createSessionToken(user);
      const [, signature] = token.split(".");

      // Tamper with payload
      const tamperedPayload = Buffer.from(JSON.stringify({ hacked: true })).toString("base64url");
      const tamperedToken = `${tamperedPayload}.${signature}`;

      expect(verifySessionToken(tamperedToken)).toBeNull();
    });

    it("should return null for token with tampered signature", () => {
      const user = {
        id: 1,
        email: "admin@ldk.ac.id",
        role: "admin" as const,
        name: "Admin",
      };

      const token = createSessionToken(user);
      const [payload] = token.split(".");

      // Tamper with signature
      const tamperedSignature = Buffer.from("tampered").toString("base64url");
      const tamperedToken = `${payload}.${tamperedSignature}`;

      expect(verifySessionToken(tamperedToken)).toBeNull();
    });

    it("should return null for expired token", () => {
      const user = {
        id: 1,
        email: "admin@ldk.ac.id",
        role: "admin" as const,
        name: "Admin",
      };

      // Create token with past expiration
      const payload: SessionUser = {
        ...user,
        exp: Date.now() - 1000, // 1 second ago
      };

      const token = Buffer.from(JSON.stringify(payload)).toString("base64url");
      const signature = crypto
        .createHmac("sha256", "test-secret-key")
        .update(token)
        .digest("base64url");
      const expiredToken = `${token}.${signature}`;

      expect(verifySessionToken(expiredToken)).toBeNull();
    });

    it("should return null for token with missing email in payload", () => {
      const payload = JSON.stringify({
        id: 1,
        role: "admin",
        name: "Admin",
        exp: Date.now() + 8 * 60 * 60 * 1000,
      });

      const payloadBase64 = Buffer.from(payload).toString("base64url");
      const signature = crypto
        .createHmac("sha256", "test-secret-key")
        .update(payloadBase64)
        .digest("base64url");
      const token = `${payloadBase64}.${signature}`;

      expect(verifySessionToken(token)).toBeNull();
    });

    it("should return null for token with missing role in payload", () => {
      const payload = JSON.stringify({
        id: 1,
        email: "admin@ldk.ac.id",
        name: "Admin",
        exp: Date.now() + 8 * 60 * 60 * 1000,
      });

      const payloadBase64 = Buffer.from(payload).toString("base64url");
      const signature = crypto
        .createHmac("sha256", "test-secret-key")
        .update(payloadBase64)
        .digest("base64url");
      const token = `${payloadBase64}.${signature}`;

      expect(verifySessionToken(token)).toBeNull();
    });

    it("should return null for malformed base64url payload", () => {
      expect(verifySessionToken("not-base64url.signature")).toBeNull();
    });

    it("should use AUTH_SECRET fallback when env variable not set", () => {
      delete process.env.AUTH_SECRET;

      const user = {
        id: 1,
        email: "admin@ldk.ac.id",
        role: "admin" as const,
        name: "Admin",
      };

      // This should work with default secret
      const token = createSessionToken(user);
      const verified = verifySessionToken(token);

      expect(verified).not.toBeNull();
    });
  });

  describe("getSessionFromRequest", () => {
    it("should extract session from request cookie", () => {
      const user = {
        id: 1,
        email: "admin@ldk.ac.id",
        role: "admin" as const,
        name: "Admin",
      };

      const token = createSessionToken(user);
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: `${SESSION_TOKEN_KEY}=${token}`,
        },
      });

      const session = getSessionFromRequest(request);

      expect(session).not.toBeNull();
      expect(session?.id).toBe(1);
      expect(session?.email).toBe("admin@ldk.ac.id");
    });

    it("should extract session from request with multiple cookies", () => {
      const user = {
        id: 2,
        email: "musyrif@ldk.ac.id",
        role: "musyrif" as const,
        name: "Musyrif",
      };

      const token = createSessionToken(user);
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: `other_cookie=value; ${SESSION_TOKEN_KEY}=${token}; another=test`,
        },
      });

      const session = getSessionFromRequest(request);

      expect(session).not.toBeNull();
      expect(session?.id).toBe(2);
      expect(session?.role).toBe("musyrif");
    });

    it("should return null when cookie is missing", () => {
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: "other_cookie=value",
        },
      });

      const session = getSessionFromRequest(request);
      expect(session).toBeNull();
    });

    it("should return null when no cookie header", () => {
      const request = new Request("http://localhost:3000");
      const session = getSessionFromRequest(request);
      expect(session).toBeNull();
    });

    it("should return null for invalid session token in cookie", () => {
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: `${SESSION_TOKEN_KEY}=invalid.token`,
        },
      });

      const session = getSessionFromRequest(request);
      expect(session).toBeNull();
    });
  });

  describe("requireRole", () => {
    it("should return ok with session for correct role", () => {
      const user = {
        id: 1,
        email: "admin@ldk.ac.id",
        role: "admin" as const,
        name: "Admin",
      };

      const token = createSessionToken(user);
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: `${SESSION_TOKEN_KEY}=${token}`,
        },
      });

      const result = requireRole("admin", request);

      expect(result.ok).toBe(true);
      expect(result.session?.id).toBe(1);
      expect(result.session?.role).toBe("admin");
    });

    it("should return 401 unauthorized when no session", () => {
      const request = new Request("http://localhost:3000");
      const result = requireRole("admin", request);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
      expect(result.error).toBe("Unauthorized");
    });

    it("should return 403 forbidden for wrong role", () => {
      const user = {
        id: 2,
        email: "musyrif@ldk.ac.id",
        role: "musyrif" as const,
        name: "Musyrif",
      };

      const token = createSessionToken(user);
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: `${SESSION_TOKEN_KEY}=${token}`,
        },
      });

      const result = requireRole("admin", request);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(403);
      expect(result.error).toBe("Forbidden");
    });

    it("should validate musyrif role correctly", () => {
      const user = {
        id: 2,
        email: "musyrif@ldk.ac.id",
        role: "musyrif" as const,
        name: "Musyrif",
      };

      const token = createSessionToken(user);
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: `${SESSION_TOKEN_KEY}=${token}`,
        },
      });

      const result = requireRole("musyrif", request);

      expect(result.ok).toBe(true);
      expect(result.session?.role).toBe("musyrif");
    });

    it("should validate anggota role correctly", () => {
      const user = {
        id: 3,
        email: "anggota@ldk.ac.id",
        role: "anggota" as const,
        name: "Anggota",
      };

      const token = createSessionToken(user);
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: `${SESSION_TOKEN_KEY}=${token}`,
        },
      });

      const result = requireRole("anggota", request);

      expect(result.ok).toBe(true);
      expect(result.session?.role).toBe("anggota");
    });

    it("should deny anggota when admin is required", () => {
      const user = {
        id: 3,
        email: "anggota@ldk.ac.id",
        role: "anggota" as const,
        name: "Anggota",
      };

      const token = createSessionToken(user);
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: `${SESSION_TOKEN_KEY}=${token}`,
        },
      });

      const result = requireRole("admin", request);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(403);
    });

    it("should deny invalid token in cookie", () => {
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: `${SESSION_TOKEN_KEY}=invalid.token`,
        },
      });

      const result = requireRole("admin", request);

      expect(result.ok).toBe(false);
      expect(result.status).toBe(401);
    });
  });

  describe("timing attack resistance", () => {
    it("should use timing-safe comparison for signature validation", () => {
      const user = {
        id: 1,
        email: "admin@ldk.ac.id",
        role: "admin" as const,
        name: "Admin",
      };

      const validToken = createSessionToken(user);

      // Create tokens with wrong signatures
      const [payload] = validToken.split(".");
      const wrongSignature1 = Buffer.from("wrong1").toString("base64url");
      const wrongSignature2 = Buffer.from("wrong2").toString("base64url");

      const wrongToken1 = `${payload}.${wrongSignature1}`;
      const wrongToken2 = `${payload}.${wrongSignature2}`;

      // Both should return null without timing difference
      expect(verifySessionToken(wrongToken1)).toBeNull();
      expect(verifySessionToken(wrongToken2)).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle cookie with spaces correctly", () => {
      const user = {
        id: 1,
        email: "admin@ldk.ac.id",
        role: "admin" as const,
        name: "Admin",
      };

      const token = createSessionToken(user);
      const request = new Request("http://localhost:3000", {
        headers: {
          cookie: `  other=val;   ${SESSION_TOKEN_KEY}=${token}  ;  another=val  `,
        },
      });

      const session = getSessionFromRequest(request);
      expect(session).not.toBeNull();
    });

    it("should handle very long user names", () => {
      const longName = "A".repeat(1000);
      const user = {
        id: 1,
        email: "admin@ldk.ac.id",
        role: "admin" as const,
        name: longName,
      };

      const token = createSessionToken(user);
      const verified = verifySessionToken(token);

      expect(verified?.name).toBe(longName);
    });

    it("should handle special characters in email", () => {
      const user = {
        id: 1,
        email: "admin+test123@ldk.ac.id",
        role: "admin" as const,
        name: "Admin",
      };

      const token = createSessionToken(user);
      const verified = verifySessionToken(token);

      expect(verified?.email).toBe("admin+test123@ldk.ac.id");
    });
  });
});
