import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { WalrusService } from './walrus.service';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class WalrusController {
  constructor(private readonly walrusService: WalrusService) {}

  @Post(':id/walrus/upload')
  startUpload(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.walrusService.startUpload(id, user.userId);
  }

  @Get(':id/walrus/status')
  getStatus(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.walrusService.getStatus(id, user.userId);
  }

  @Get(':id/walrus/estimate')
  estimateCost(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.walrusService.estimateCost(id, user.userId);
  }
}