import { BadRequestException, Injectable } from '@nestjs/common';
import { computeZkLoginAddress, genAddressSeed } from '@mysten/sui/zklogin';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { ZkLoginProvider } from '@ripple-studio/shared';
import { ZKLOGIN_PROVIDERS } from '@ripple-studio/shared';

export interface VerifiedZkLoginJwt {
  iss: string;
  sub: string;
  aud: string;
  email?: string;
  name?: string;
  picture?: string;
}

@Injectable()
export class ZkLoginService {
  private readonly jwksSets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

  private getJwks(issuer: string, jwksUrl: string) {
    if (!this.jwksSets.has(issuer)) {
      this.jwksSets.set(issuer, createRemoteJWKSet(new URL(jwksUrl)));
    }
    return this.jwksSets.get(issuer)!;
  }

  async verifyJwt(jwt: string, provider: ZkLoginProvider): Promise<VerifiedZkLoginJwt> {
    const config = ZKLOGIN_PROVIDERS[provider];
    const jwks = this.getJwks(config.iss, config.jwksUrl);

    let payload: JWTPayload;
    try {
      const result = await jwtVerify(jwt, jwks, {
        issuer: config.iss,
        audience: this.getExpectedAudience(provider),
      });
      payload = result.payload;
    } catch (error) {
      throw new BadRequestException(
        `Invalid JWT: ${error instanceof Error ? error.message : 'verification failed'}`,
      );
    }

    if (!payload.sub || !payload.iss) {
      throw new BadRequestException('JWT missing required claims (sub, iss)');
    }

    const aud = this.extractAudience(payload.aud);
    if (!aud) {
      throw new BadRequestException('JWT missing audience claim');
    }

    return {
      iss: payload.iss,
      sub: payload.sub,
      aud,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      name: typeof payload.name === 'string' ? payload.name : undefined,
      picture: typeof payload.picture === 'string' ? payload.picture : undefined,
    };
  }

  deriveAddress(claims: VerifiedZkLoginJwt, userSalt: string): string {
    const addressSeed = genAddressSeed(BigInt(`0x${userSalt}`), 'sub', claims.sub, claims.aud);
    return computeZkLoginAddress({
      addressSeed: addressSeed.toString(),
      iss: claims.iss,
    });
  }

  private getExpectedAudience(provider: ZkLoginProvider): string | string[] | undefined {
    if (provider === 'google') {
      return process.env.NEXT_PUBLIC_ZKLOGIN_GOOGLE_CLIENT_ID;
    }
    if (provider === 'apple') {
      return process.env.NEXT_PUBLIC_ZKLOGIN_APPLE_CLIENT_ID;
    }
    return undefined;
  }

  private extractAudience(aud: JWTPayload['aud']): string | undefined {
    if (typeof aud === 'string') return aud;
    if (Array.isArray(aud) && aud.length > 0) return aud[0];
    return undefined;
  }
}