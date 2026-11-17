// GET /api/v2/seed loads Pokemon from PokeAPI into MongoDB.
// Post, Body, Patch, Param, and Delete are imported but not used.
// They are leftovers from the Nest generator and do not add routes.

import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {

  constructor(private readonly seedService: SeedService) {}

  @Get()
  executeSeed() {
    return this.seedService.executeSeed();
  }

}
