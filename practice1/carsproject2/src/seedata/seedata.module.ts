import { Module } from '@nestjs/common';

import { CarsModule } from '../cars/cars.module';
import { SeedataService } from './seedata.service';
import { SeedataController } from './seedata.controller';
import { BrandsModule } from '../brands/brands.module';

@Module({
  controllers: [SeedataController],
  providers: [SeedataService],
  imports: [CarsModule, BrandsModule]
})
export class SeedataModule {}
