import {
  EPHEMERAL_KEY_SESSION_KEY,
  JWT_RANDOMNESS_SESSION_KEY,
  MAX_EPOCH_SESSION_KEY,
  ZKLOGIN_PROVIDERS,
  type ZkLoginProvider,
} from '@ripple-studio/shared';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { generateNonce, generateRandomness } from '@mysten/sui/zklogin';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK ?? 'testnet';

/** Epoch duration ~24h on Sui; session valid for 10 epochs */
const MAX_EPOCH_OFFSET = 10;

export interface EphemeralSession {
  keypair: Ed25519Keypair;
  randomness: string;
  maxEpoch: number;
  nonce: string;
}

export async function prepareZkLoginSession(currentEpoch: number): Promise<EphemeralSession> {
  const keypair = Ed25519Keypair.generate();
  const randomness = generateRandomness();
  const maxEpoch = currentEpoch + MAX_EPOCH_OFFSET;
  const nonce = generateNonce(keypair.getPublicKey(), maxEpoch, randomness);

  sessionStorage.setItem(EPHEMERAL_KEY_SESSION_KEY, keypair.getSecretKey());
  sessionStorage.setItem(JWT_RANDOMNESS_SESSION_KEY, randomness);
  sessionStorage.setItem(MAX_EPOCH_SESSION_KEY, String(maxEpoch));

  return { keypair, randomness, maxEpoch, nonce };
}

export function loadEphemeralSession(): EphemeralSession | null {
  const secretKey = sessionStorage.getItem(EPHEMERAL_KEY_SESSION_KEY);
  const randomness = sessionStorage.getItem(JWT_RANDOMNESS_SESSION_KEY);
  const maxEpochStr = sessionStorage.getItem(MAX_EPOCH_SESSION_KEY);

  if (!secretKey || !randomness || !maxEpochStr) return null;

  const keypair = Ed25519Keypair.fromSecretKey(secretKey);
  const maxEpoch = parseInt(maxEpochStr, 10);
  const nonce = generateNonce(keypair.getPublicKey(), maxEpoch, randomness);

  return { keypair, randomness, maxEpoch, nonce };
}

export function clearEphemeralSession() {
  sessionStorage.removeItem(EPHEMERAL_KEY_SESSION_KEY);
  sessionStorage.removeItem(JWT_RANDOMNESS_SESSION_KEY);
  sessionStorage.removeItem(MAX_EPOCH_SESSION_KEY);
}

export function buildOAuthUrl(provider: ZkLoginProvider, nonce: string): string {
  const redirectUri = `${APP_URL}/auth/callback/${provider}`;

  if (provider === 'google') {
    const clientId = process.env.NEXT_PUBLIC_ZKLOGIN_GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error('NEXT_PUBLIC_ZKLOGIN_GOOGLE_CLIENT_ID is not configured');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'id_token',
      scope: 'openid email profile',
      nonce,
    });
    return `${ZKLOGIN_PROVIDERS.google.authUrl}?${params}`;
  }

  if (provider === 'apple') {
    const clientId = process.env.NEXT_PUBLIC_ZKLOGIN_APPLE_CLIENT_ID;
    if (!clientId) throw new Error('NEXT_PUBLIC_ZKLOGIN_APPLE_CLIENT_ID is not configured');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code id_token',
      response_mode: 'fragment',
      scope: 'name email',
      nonce,
    });
    return `${ZKLOGIN_PROVIDERS.apple.authUrl}?${params}`;
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

export async function fetchCurrentEpoch(): Promise<number> {
  const rpcUrl =
    SUI_NETWORK === 'mainnet'
      ? 'https://fullnode.mainnet.sui.io:443'
      : 'https://fullnode.testnet.sui.io:443';

  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'suix_getLatestSuiSystemState', params: [] }),
  });

  const data = await res.json();
  const epoch = data?.result?.epoch;
  if (typeof epoch !== 'string' && typeof epoch !== 'number') {
    throw new Error('Failed to fetch Sui epoch');
  }
  return parseInt(String(epoch), 10);
}

export async function startZkLogin(provider: ZkLoginProvider) {
  const epoch = await fetchCurrentEpoch();
  const session = await prepareZkLoginSession(epoch);
  const url = buildOAuthUrl(provider, session.nonce);
  window.location.href = url;
}