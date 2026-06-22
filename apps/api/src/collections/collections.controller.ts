import { Body, Controller, Get, Post } from '@nestjs/common';
import type { CreateCollectionInput } from '@ripple-studio/shared';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  findAll() {
    return this.collectionsService.findAll();
  }

  @Post()
  create(@Body() input: CreateCollectionInput) {
    return this.collectionsService.create(input);
  }
}