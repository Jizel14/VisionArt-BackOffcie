import { SignJWT, jwtVerify } from "jose";

export type AdminPayload = {
  adminId: string;
  email: string;
  role: string;
  permissions: string[];
};

function getNodeCrypto(): typeof import("crypto") {
  // Avoid importing node:crypto at module load so this file can be used by Edge middleware
  // for verification only.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("crypto");
}

function pemFromEnv(raw?: string): string {
  if (!raw) return "";
  // Stored as single-line with \n escapes.
  return raw.replace(/\\n/g, "\n");
}

function getPrivateKey(): string {
  const key = pemFromEnv(process.env.ES256_PRIVATE_KEY);
  if (!key) throw new Error("ES256_PRIVATE_KEY is not set");
  return key;
}

function getPublicKey(): string {
  const key = pemFromEnv(process.env.ES256_PUBLIC_KEY);
  if (!key) throw new Error("ES256_PUBLIC_KEY is not set");
  return key;
}

export async function generateAccessToken(payload: AdminPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expSeconds = Number(process.env.ACCESS_TOKEN_EXPIRY ?? 900);
  const jti =
    (globalThis as any).crypto?.randomUUID?.() ?? getNodeCrypto().randomUUID();

  const { importPKCS8 } = await import("jose");
  const pk = await importPKCS8(getPrivateKey(), "ES256");

  return new SignJWT({
    adminId: payload.adminId,
    email: payload.email,
    role: payload.role,
    permissions: payload.permissions,
    iat: now,
  })
    .setProtectedHeader({ alg: "ES256", typ: "JWT" })
    .setIssuedAt(now)
    .setJti(jti)
    .setExpirationTime(now + expSeconds)
    .sign(pk);
}

export async function verifyAccessToken(
  token: string
): Promise<AdminPayload | null> {
  try {
    const { importSPKI } = await import("jose");
    const pub = await importSPKI(getPublicKey(), "ES256");
    const { payload } = await jwtVerify(token, pub, { algorithms: ["ES256"] });
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  const c = getNodeCrypto();
  return c.randomBytes(64).toString("hex");
}

export function hashRefreshToken(rawToken: string): string {
  const c = getNodeCrypto();
  return c.createHash("sha256").update(rawToken).digest("hex");
}

export function generateFamilyId(): string {
  return (globalThis as any).crypto?.randomUUID?.() ?? getNodeCrypto().randomUUID();
}

