import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CryptoService } from './crypto.service';
import { JwtStrategy } from './jwt.strategy';
import { SaltService } from './salt.service';
import { ZkLoginService } from './zklogin.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [AuthService, ZkLoginService, SaltService, CryptoService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}