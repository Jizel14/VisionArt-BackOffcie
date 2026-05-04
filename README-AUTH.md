# VisionArt Backoffice — Access/Refresh Token Auth (ES256)

This backoffice replaces the legacy single-token JWT with a **two-token** model:

- **Access token**: ES256-signed JWT, **15 minutes** (default) — used in `Authorization: Bearer ...`
- **Refresh token**: random 128-hex string in **HttpOnly cookie**, **7 days** (default) — rotated on every refresh

## Architecture (high level)

### Access token (short-lived)

- Signed with **ES256** (P-256) using `ES256_PRIVATE_KEY`
- Verified using `ES256_PUBLIC_KEY` (Edge-compatible)
- Stored **only in JS memory** (module variable), never in `localStorage` / `sessionStorage`

### Refresh token (rotating, theft detection)

- Stored in DB as `SHA-256` hex (`token_hash`), never store raw token
- Cookie name: `refresh_token`
- Cookie scope: `Path=/api/auth` (sent only to auth endpoints)
- Rotation rules:
  - When a refresh token is used once, it is marked `is_used=true`
  - Any attempt to reuse an already-used token triggers **family revocation**
  - Family revocation invalidates all tokens issued in that login session

## Setup

### 1) Generate ES256 keys

From `backoffice/`:

```bash
node scripts/generate-keys.js
```

Copy the printed `ES256_PRIVATE_KEY="..."\n` and `ES256_PUBLIC_KEY="..."\n` into `backoffice/.env.local`.

Never commit the real private key.

### 2) Run DB migration

Run this SQL against your MySQL database (`visionart`):

```bash
mysql -u root -p visionart < migration/add-refresh-tokens-table.sql
```

### 3) Cleanup expired refresh tokens

Option A (stored procedure):

```sql
CALL cleanup_expired_refresh_tokens();
```

Option B (Node script):

```bash
node scripts/cleanup-expired-refresh-tokens.js
```

## Environment variables

See `backoffice/.env.local.example`.

Required:

- `ES256_PRIVATE_KEY`
- `ES256_PUBLIC_KEY`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

Tuning:

- `ACCESS_TOKEN_EXPIRY` (seconds, default `900`)
- `REFRESH_TOKEN_EXPIRY_DAYS` (days, default `7`)

Migration:

- `MIGRATION_MODE=true|false`
- `JWT_SECRET` (legacy HS256 secret, only used when `MIGRATION_MODE=true`)

## API endpoints

### `POST /api/auth/login`

Body:

```json
{ "email": "admin@example.com", "password": "..." }
```

Response:

```json
{
  "accessToken": "eyJ...",
  "expiresIn": 900,
  "admin": { "id": "uuid", "email": "admin@example.com", "role": "admin" }
}
```

Cookie set:

- `refresh_token` (HttpOnly, SameSite=Strict, Path=`/api/auth`, MaxAge=7 days)

### `POST /api/auth/refresh`

- Reads `refresh_token` cookie
- Rotates refresh token
- Returns `{ accessToken, expiresIn }`

### `POST /api/auth/logout`

- Revokes the whole family (all tokens for that login session)
- Clears `refresh_token` cookie (Path=`/api/auth`)

### `GET /api/auth/me`

- Reads `Authorization: Bearer <accessToken>`
- Verifies ES256 signature and expiration
- Returns `{ id, email, role, permissions }`

## Frontend silent refresh

All frontend data fetching uses `lib/auth/api-client.ts`:

- Keeps access token in memory
- Schedules refresh at \(exp - now - 120s\)
- On app init, calls `/api/auth/refresh` to restore session after hard reload
- On a 401 response, attempts **one** refresh and retries the request once

## Security event logging

Structured JSON logs are emitted via `lib/auth/security-logger.ts`:

- `LOGIN_SUCCESS`
- `LOGIN_FAILURE` (email is SHA-256 hashed)
- `TOKEN_REFRESH`
- `TOKEN_REUSE_DETECTED` (HIGH severity)
- `LOGOUT`
- `INVALID_TOKEN_ATTEMPT`

## Testing with curl

### Login

```bash
curl -i -X POST "http://localhost:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

Copy the `Set-Cookie: refresh_token=...; Path=/api/auth; HttpOnly` header and the `accessToken`.

### Refresh (cookie only)

```bash
curl -i -X POST "http://localhost:3001/api/auth/refresh" \
  -H "Cookie: refresh_token=<RAW_REFRESH_TOKEN>"
```

### Me (access token only)

```bash
curl -i "http://localhost:3001/api/auth/me" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Logout

```bash
curl -i -X POST "http://localhost:3001/api/auth/logout" \
  -H "Cookie: refresh_token=<RAW_REFRESH_TOKEN>"
```

## Creating an admin user (when none exist)

If your `users` table has no admins (`is_admin = 0` for everyone), create one with:

```bash
ADMIN_EMAIL=admin@visionart.app ADMIN_PASSWORD='Admin123!' ADMIN_NAME='Backoffice Admin' \
node backoffice/scripts/create-admin-user.js
```

Then log in at `http://localhost:3001/login` with:

- **email**: `admin@visionart.app`
- **password**: `Admin123!`

