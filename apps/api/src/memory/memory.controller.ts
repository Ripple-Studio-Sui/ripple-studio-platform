import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { MemoryService } from './memory.service';

@Controller('memory')
@UseGuards(JwtAuthGuard)
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Get('status')
  getStatus() {
    return this.memoryService.getStatus();
  }

  @Get('spaces')
  listSpaces(@CurrentUser() user: AuthenticatedUser) {
    return this.memoryService.listSpaces(user.userId);
  }

  @Post('sync')
  syncMemory(@CurrentUser() user: AuthenticatedUser) {
    return this.memoryService.syncUserMemory(user.userId);
  }
}