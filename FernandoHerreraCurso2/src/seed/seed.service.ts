import { BrandsService } from './../brands/brands.service';
import { Injectable } from '@nestjs/common';
import { CarsService } from './../cars/cars.service';

import { CARS_SEED } from './data/cars.seed';
import { BRANDS_SEED } from './data/brands.seed';

/**
 * Loads sample data through the feature services. It does not keep its own
 * arrays. Because SeedModule imports CarsModule and BrandsModule, the
 * injected services are the ones behind /cars and /brands.
 */
@Injectable()
export class SeedService {

  constructor(
    private readonly carsService: CarsService,
    private readonly brandsService: BrandsService,
  ) {}


  /**
   * Both calls replace the current list. They pass the seed constants by
   * reference, not a copy. fillCarsWithSeedData on each service describes
   * what a second GET /seed returns after creates, updates, and deletes.
   *
   * The return value is the HTTP body: the plain string "Seed executed".
   */
  populateDB() {

    // CARS_SEED
    // BRANDS_SEED
    this.carsService.fillCarsWithSeedData( CARS_SEED );
    this.brandsService.fillCarsWithSeedData( BRANDS_SEED );

    return 'Seed executed';

  }


}
