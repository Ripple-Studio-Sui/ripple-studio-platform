import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { CreateCollectionInput } from '@ripple-studio/shared';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  findAll() {
    return this.collectionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(id);
  }

  @Post()
  create(@Body() input: CreateCollectionInput) {
    return this.collectionsService.create(input);
  }
}