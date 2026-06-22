import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { GenerationService } from './generation.service';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  @Post(':id/generate')
  startGeneration(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.generationService.startGeneration(id, user.userId);
  }

  @Get(':id/generation/status')
  getStatus(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.generationService.getStatus(id, user.userId);
  }

  @Get(':id/nfts')
  listNfts(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.generationService.listNftItems(
      id,
      user.userId,
      parseInt(page ?? '1', 10),
      Math.min(parseInt(limit ?? '50', 10), 100),
    );
  }
}