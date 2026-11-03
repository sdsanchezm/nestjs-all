//import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service';

/**
 * GET /seed replaces the in-memory cars and brands with the sample data.
 *
 * A GET that writes is not how a public API should work (clients and caches
 * assume GET is safe). It is the route this project documents so you can
 * open http://localhost:3000/seed in a browser and see "Seed executed".
 */
@Controller('seed')
export class SeedController {

  constructor(
    private readonly seedService: SeedService
  ) {}

  @Get()
  runSeed() {
    return this.seedService.populateDB();
  }

}
