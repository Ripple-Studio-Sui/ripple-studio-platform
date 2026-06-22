import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface AuthenticatedUser {
  userId: string;
  suiAddress: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'ripple-access-dev-secret',
    });
  }

  validate(payload: { userId?: string; suiAddress?: string; type?: string }): AuthenticatedUser {
    if (payload.type !== 'access' || !payload.userId || !payload.suiAddress) {
      throw new UnauthorizedException('Invalid access token');
    }
    return { userId: payload.userId, suiAddress: payload.suiAddress };
  }
}