import { Controller, Get } from '@nestjs/common';

import { SeedataService } from './seedata.service';

@Controller('seedata')
export class SeedataController {
  
  constructor(private readonly seedataService: SeedataService) {}

// /seedata/seed
  @Get('seed')
  initializeData() : string {
    this.seedataService.runSeed();
    return "completed ok";
  }
  

}
