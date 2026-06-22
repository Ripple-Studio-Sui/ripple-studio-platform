import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { MetadataService } from './metadata.service';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Post(':id/metadata/generate')
  startGeneration(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.metadataService.startGeneration(id, user.userId);
  }

  @Get(':id/metadata/status')
  getStatus(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.metadataService.getStatus(id, user.userId);
  }

  @Get(':id/metadata/summary')
  getSummary(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.metadataService.getSummary(id, user.userId);
  }

  @Get(':id/metadata/export')
  exportZip(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.metadataService.exportZip(id, user.userId);
  }
}