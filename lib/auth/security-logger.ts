function getNodeCrypto(): typeof import("crypto") {
  // Avoid importing node:crypto at module load so this logger can be imported in Edge middleware.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("crypto");
}

type Severity = "LOW" | "MEDIUM" | "HIGH";

function nowIso() {
  return new Date().toISOString();
}

function sha256Hex(input: string) {
  const c = getNodeCrypto();
  return c.createHash("sha256").update(input).digest("hex");
}

function logEvent(payload: Record<string, unknown>) {
  // Structured JSON for ingestion by logs/monitoring later.
  // Never include access tokens or raw refresh tokens here.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload));
}

export const SecurityLogger = {
  loginSuccess(params: {
    adminId: string;
    ip: string | null;
    userAgent: string | null;
  }) {
    logEvent({
      event: "LOGIN_SUCCESS",
      severity: "LOW" satisfies Severity,
      timestamp: nowIso(),
      adminId: params.adminId,
      ip: params.ip,
      userAgent: params.userAgent,
    });
  },

  loginFailure(params: { email: string; ip: string | null; reason: string }) {
    logEvent({
      event: "LOGIN_FAILURE",
      severity: "MEDIUM" satisfies Severity,
      timestamp: nowIso(),
      emailHash: sha256Hex(params.email.toLowerCase()),
      ip: params.ip,
      reason: params.reason,
    });
  },

  tokenRefresh(params: { adminId: string; familyId: string; ip: string | null }) {
    logEvent({
      event: "TOKEN_REFRESH",
      severity: "LOW" satisfies Severity,
      timestamp: nowIso(),
      adminId: params.adminId,
      familyId: params.familyId,
      ip: params.ip,
    });
  },

  tokenReuseDetected(params: {
    adminId: string;
    familyId: string;
    ip: string | null;
  }) {
    logEvent({
      event: "TOKEN_REUSE_DETECTED",
      severity: "HIGH" satisfies Severity,
      timestamp: nowIso(),
      adminId: params.adminId,
      familyId: params.familyId,
      ip: params.ip,
    });
  },

  logout(params: { adminId: string | null; familyId: string | null }) {
    logEvent({
      event: "LOGOUT",
      severity: "LOW" satisfies Severity,
      timestamp: nowIso(),
      adminId: params.adminId,
      familyId: params.familyId,
    });
  },

  invalidTokenAttempt(params: { ip: string | null; path: string }) {
    logEvent({
      event: "INVALID_TOKEN_ATTEMPT",
      severity: "MEDIUM" satisfies Severity,
      timestamp: nowIso(),
      ip: params.ip,
      path: params.path,
    });
  },
};

