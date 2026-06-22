import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthResponse, ZkLoginCompleteInput } from '@ripple-studio/shared';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';
import { SaltService } from './salt.service';
import { toUserDto } from './users.mapper';
import { ZkLoginService } from './zklogin.service';

interface TokenUser {
  userId: string;
  suiAddress: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly zkLogin: ZkLoginService,
    private readonly salt: SaltService,
    private readonly crypto: CryptoService,
    private readonly jwt: JwtService,
  ) {}

  async completeZkLogin(input: ZkLoginCompleteInput): Promise<AuthResponse> {
    const claims = await this.zkLogin.verifyJwt(input.jwt, input.provider);
    const userSalt = await this.salt.getOrCreateSalt({
      iss: claims.iss,
      sub: claims.sub,
      aud: claims.aud,
    });
    const suiAddress = this.zkLogin.deriveAddress(claims, userSalt);

    const user = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: {
          zkloginIss_zkloginSub_zkloginAud: {
            zkloginIss: claims.iss,
            zkloginSub: claims.sub,
            zkloginAud: claims.aud,
          },
        },
      });

      if (existing) {
        return tx.user.update({
          where: { id: existing.id },
          data: {
            email: claims.email ?? existing.email,
            displayName: claims.name ?? existing.displayName,
            avatarUrl: claims.picture ?? existing.avatarUrl,
            suiAddress,
          },
        });
      }

      const saltVault = await tx.saltVault.create({
        data: { encryptedSalt: this.crypto.encrypt(userSalt) },
      });

      return tx.user.create({
        data: {
          zkloginIss: claims.iss,
          zkloginSub: claims.sub,
          zkloginAud: claims.aud,
          suiAddress,
          saltRefId: saltVault.id,
          email: claims.email,
          displayName: claims.name,
          avatarUrl: claims.picture,
          wallets: {
            create: { suiAddress, isPrimary: true },
          },
          memorySpaces: {
            create: [
              { spaceType: 'profile' },
              { spaceType: 'collections' },
              { spaceType: 'conversations' },
              { spaceType: 'preferences' },
            ],
          },
        },
      });
    });

    const tokens = await this.issueTokens({ userId: user.id, suiAddress: user.suiAddress });

    return { user: toUserDto(user), tokens };
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    let payload: TokenUser & { type: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'ripple-refresh-dev-secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.issueTokens({ userId: user.id, suiAddress: user.suiAddress });
    return { user: toUserDto(user), tokens };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return toUserDto(user);
  }

  private async issueTokens(user: TokenUser) {
    const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'ripple-access-dev-secret';
    const refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'ripple-refresh-dev-secret';
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: user.userId, userId: user.userId, suiAddress: user.suiAddress, type: 'access' },
        { secret: accessSecret, expiresIn: accessExpiresIn },
      ),
      this.jwt.signAsync(
        { sub: user.userId, userId: user.userId, suiAddress: user.suiAddress, type: 'refresh' },
        { secret: refreshSecret, expiresIn: refreshExpiresIn },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }
}