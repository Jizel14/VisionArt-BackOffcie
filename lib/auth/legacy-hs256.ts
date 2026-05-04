import { jwtVerify } from "jose";

function getLegacySecret(): Uint8Array | null {
  const raw = process.env.JWT_SECRET;
  if (!raw) return null;
  return new TextEncoder().encode(raw);
}

export type LegacyAdminPayload = { email: string; role: string };

export async function verifyLegacyHs256(token: string): Promise<LegacyAdminPayload | null> {
  const legacySecret = getLegacySecret();
  if (!legacySecret) return null;
  try {
    const { payload } = await jwtVerify(token, legacySecret, {
      algorithms: ["HS256"],
    });
    return payload as unknown as LegacyAdminPayload;
  } catch {
    return null;
  }
}

