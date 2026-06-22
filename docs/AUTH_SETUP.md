# zkLogin Authentication Setup

Ripple Studio uses Sui zkLogin with Google and Apple OAuth. No seed phrases required.

## 1. Generate secrets

```bash
# Run three times for access, refresh, and salt encryption keys
openssl rand -hex 32
```

Add to `.env`:

```
JWT_ACCESS_SECRET=<hex>
JWT_REFRESH_SECRET=<hex>
ZKLOGIN_SALT_ENCRYPTION_KEY=<hex>
```

## 2. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services** → **Credentials**
3. Create **OAuth 2.0 Client ID** (Web application)
4. **Authorized JavaScript origins:** `http://localhost:3000`
5. **Authorized redirect URIs:** `http://localhost:3000/auth/callback/google`
6. Copy Client ID to `.env`:

```
NEXT_PUBLIC_ZKLOGIN_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## 3. Apple Sign In

1. Go to [Apple Developer](https://developer.apple.com/)
2. Create a **Services ID** with Sign In with Apple enabled
3. Configure return URL: `http://localhost:3000/auth/callback/apple`
4. Copy Services ID to `.env`:

```
NEXT_PUBLIC_ZKLOGIN_APPLE_CLIENT_ID=com.yourapp.service
```

## 4. Auth flow

```
User clicks "Continue with Google"
  → Frontend generates ephemeral keypair + zkLogin nonce
  → Redirects to Google OAuth (nonce embedded)
  → Google returns JWT to /auth/callback/google
  → Frontend sends JWT + ephemeral session to API
  → API verifies JWT, manages encrypted salt, derives Sui address
  → API returns JWT access + refresh tokens
  → User lands on dashboard with auto-created wallet
```

## 5. API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/zklogin/complete` | Complete zkLogin, create/return user |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user (Bearer token) |

## 6. Salt security

The user salt is **critical** — loss means permanent loss of the Sui wallet address.

- Stored AES-256-GCM encrypted in `salt_vault` table
- Never logged or returned to the client
- Backup strategy (V1): user-exportable encrypted backup file

## 7. Production checklist

- [ ] Use HTTPS for all redirect URIs
- [ ] Set strong `JWT_*_SECRET` and `ZKLOGIN_SALT_ENCRYPTION_KEY`
- [ ] Enable HSM or KMS for salt encryption key in production
- [ ] Add rate limiting on `/auth/zklogin/complete`
- [ ] Monitor failed JWT verification attempts