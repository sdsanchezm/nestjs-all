import { Module } from '@nestjs/common';
import { CarsModule } from './cars/cars.module';
import { BrandsModule } from './brands/brands.module';
import { SeedModule } from './seed/seed.module';

/**
 * Root module. main.ts boots the app from this class.
 *
 * This module only composes feature modules. It has no route of its own,
 * so GET / has no handler (404). Cars, brands, and seed each own their URLs.
 *
 * The empty controllers, providers, and exports arrays are the Nest defaults
 * written out so you can see where those pieces would be registered.
 */
@Module({
  imports: [CarsModule, BrandsModule, SeedModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
