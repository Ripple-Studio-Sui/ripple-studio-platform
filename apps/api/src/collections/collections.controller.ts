import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type {
  CreateCollectionInput,
  UpdateAssetRarityInput,
  UpdateCollectionInput,
  UpdateLayersInput,
} from '@ripple-studio/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { CollectionsService } from './collections.service';
import { TraitsService } from './traits.service';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(
    private readonly collectionsService: CollectionsService,
    private readonly traitsService: TraitsService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.collectionsService.findAllForUser(user.userId);
  }

  @Get(':id/detail')
  findDetail(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.collectionsService.findDetailForUser(id, user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.collectionsService.findOneForUser(id, user.userId);
  }

  @Post()
  create(@Body() input: CreateCollectionInput, @CurrentUser() user: AuthenticatedUser) {
    return this.collectionsService.create(input, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() input: UpdateCollectionInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collectionsService.update(id, user.userId, input);
  }

  @Post(':id/traits')
  @UseInterceptors(FilesInterceptor('files', 500, { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadTraits(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('paths') pathsJson: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const paths: string[] = JSON.parse(pathsJson ?? '[]');
    const result = await this.traitsService.uploadTraits(id, user.userId, files, paths);
    const collection = await this.collectionsService.findDetailForUser(id, user.userId);
    return { ...result, collection };
  }

  @Patch(':id/layers')
  updateLayers(
    @Param('id') id: string,
    @Body() input: UpdateLayersInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collectionsService.updateLayers(id, user.userId, input);
  }

  @Patch(':id/assets/rarity')
  updateRarity(
    @Param('id') id: string,
    @Body() input: UpdateAssetRarityInput,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.collectionsService.updateAssetRarity(id, user.userId, input);
  }
}