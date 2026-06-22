import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { CreateCollectionInput } from '@ripple-studio/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.collectionsService.findAllForUser(user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.collectionsService.findOneForUser(id, user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() input: CreateCollectionInput, @CurrentUser() user: AuthenticatedUser) {
    return this.collectionsService.create(input, user.userId);
  }
}