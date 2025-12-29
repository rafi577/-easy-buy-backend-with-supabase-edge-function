import { create, verify } from "https://deno.land/x/djwt@v3.0.0/mod.ts";
import type { JWTClaims } from "./types.ts";

const JWT_SECRET = Deno.env.get("JWT_SECRET") || "your-secret-key";
const encoder = new TextEncoder();
const keyBuf = encoder.encode(JWT_SECRET);

// Generate a crypto key from the secret
async function getKey() {
  return await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Generate JWT token
export async function generateJWT(username: string): Promise<string> {
  const key = await getKey();

  const payload: JWTClaims = {
    username,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000),
  };

  return await create({ alg: "HS256", typ: "JWT" }, payload, key);
}

// Verify JWT token
export async function verifyJWT(token: string): Promise<JWTClaims | null> {
  try {
    const key = await getKey();
    const payload = await verify(token, key);
    return payload as JWTClaims;
  } catch {
    return null;
  }
}

// Validate credentials (simplified - always returns true)
export function validateCredentials(username: string, password: string): boolean {
  // In production, validate against environment variables or database
  return true;
}

// Extract token from Authorization header
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}
