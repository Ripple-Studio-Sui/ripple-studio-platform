import type { User } from './user';

export type ZkLoginProvider = 'google' | 'apple';

export interface ZkLoginCompleteInput {
  jwt: string;
  provider: ZkLoginProvider;
  ephemeralPublicKey: string;
  maxEpoch: number;
  jwtRandomness: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface JwtPayload {
  sub: string;
  userId: string;
  suiAddress: string;
  type: 'access' | 'refresh';
}