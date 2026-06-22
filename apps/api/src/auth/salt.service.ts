import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from './crypto.service';

export interface ZkLoginIdentity {
  iss: string;
  sub: string;
  aud: string;
}

@Injectable()
export class SaltService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async getOrCreateSalt(identity: ZkLoginIdentity): Promise<string> {
    const existing = await this.prisma.user.findUnique({
      where: {
        zkloginIss_zkloginSub_zkloginAud: {
          zkloginIss: identity.iss,
          zkloginSub: identity.sub,
          zkloginAud: identity.aud,
        },
      },
      include: { saltVault: true },
    });

    if (existing?.saltVault) {
      return this.crypto.decrypt(existing.saltVault.encryptedSalt);
    }

    return this.crypto.generateSalt();
  }
}