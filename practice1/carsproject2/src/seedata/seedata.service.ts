import { Injectable } from '@nestjs/common';

import { CarsService } from '../cars/cars.service';
import { CARS_SEED } from './data/cars.data'
import { BrandsService } from '../brands/brands.service';
import { BRANDS_SEED } from './data/brands.data';

@Injectable()
export class SeedataService {

    constructor(
        private readonly _carService: CarsService,
        private readonly _brandService: BrandsService
    ) {}

    runSeed(){
        this._carService.seedCardsData(CARS_SEED);
        this._brandService.seedBrands(BRANDS_SEED);
    }

}
