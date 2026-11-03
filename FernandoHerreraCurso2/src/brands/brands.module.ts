import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';

/**
 * Brands feature. Same layout as CarsModule: one controller, one service,
 * and the service is exported so SeedModule writes into the instance that
 * GET /brands reads.
 */
@Module({
  controllers: [ BrandsController ],
  providers: [ BrandsService ],
  exports: [ BrandsService ]
})
export class BrandsModule {}
