import { Injectable } from '@nestjs/common';
import type { Collection, CreateCollectionInput } from '@ripple-studio/shared';
import { randomUUID } from 'crypto';

@Injectable()
export class CollectionsService {
  private collections: Collection[] = [];

  findAll(): Collection[] {
    return this.collections;
  }

  create(input: CreateCollectionInput): Collection {
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const collection: Collection = {
      id: randomUUID(),
      userId: 'demo-user',
      name: input.name,
      slug,
      description: input.description,
      supply: input.supply,
      status: 'draft',
      royaltyBps: input.royaltyBps ?? 500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.collections.push(collection);
    return collection;
  }
}