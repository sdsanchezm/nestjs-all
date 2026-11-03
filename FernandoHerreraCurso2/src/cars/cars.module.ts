import { Module } from '@nestjs/common';
import { CarsController } from './cars.controller';
import { CarsService } from './cars.service';

/**
 * Cars feature: HTTP handlers plus the in-memory store.
 *
 * providers: Nest creates a single CarsService and injects it into
 * CarsController. Every request shares that one instance, so the array
 * inside the service survives from one request to the next.
 *
 * exports: SeedModule imports CarsModule and injects this same CarsService.
 * If CarsService were constructed again inside SeedModule, seeding would
 * fill a different array from the one GET /cars reads.
 */
@Module({
  controllers: [ CarsController ],
  providers: [ CarsService ],
  exports: [ CarsService ]
})
export class CarsModule {}
