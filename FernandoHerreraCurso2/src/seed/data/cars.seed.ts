import { v4 as uuid } from 'uuid';
import { Car } from './../../cars/interfaces/car.interface';

/**
 * Sample cars. uuid() and the object literal run once, when Node first
 * imports this file, not each time GET /seed is called. Ids therefore stay
 * the same until you restart the process. A later /seed restores this array
 * as CarsService left it; see fillCarsWithSeedData.
 */
export const CARS_SEED: Car[] = [
    {
        id: uuid(),
        brand: 'Toyota',
        model: 'Corolla',
    },
    {
        id: uuid(),
        brand: 'Honda',
        model: 'Civic',
    },
    {
        id: uuid(),
        brand: 'Jeep',
        model: 'Cherokee',
    },
]
