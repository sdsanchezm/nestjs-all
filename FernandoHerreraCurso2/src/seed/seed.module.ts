import { Module } from '@nestjs/common';

import { BrandsModule } from './../brands/brands.module';
import { CarsModule } from './../cars/cars.module';

import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

/**
 * Wires the seed endpoint to the real car and brand stores.
 *
 * imports is required. CarsService and BrandsService are registered in their
 * own modules and exported from there. Importing those modules is what lets
 * SeedService receive the same instances the HTTP controllers use.
 * Listing the services in `providers` here would create a second, empty copy.
 */
@Module({
  controllers: [ SeedController ],
  providers: [ SeedService ],
  imports: [ CarsModule, BrandsModule ]
})
export class SeedModule {}
