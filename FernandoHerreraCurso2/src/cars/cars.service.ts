import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { CreateCarDto, UpdateCarDto } from './dto';
import { Car } from './interfaces/car.interface';

/**
 * In-memory car store. There is no database.
 *
 * @Injectable() marks this class as a provider. CarsModule tells Nest to
 * construct one instance and reuse it for the whole process. The array is
 * wiped when the process stops. Load sample rows with GET /seed.
 */
@Injectable()
export class CarsService {

    /**
     * Starts empty. The commented object shows the Car shape that used to be
     * hard-coded here; sample data now lives in src/seed/data/cars.seed.ts
     * so cars and brands are loaded together.
     */
    private cars: Car[] = [
        // {
        //     id: uuid(),
        //     brand: 'Toyota',
        //     model: 'Corolla'
        // },
    ];


    findAll() {
        return this.cars;
    }

    /**
     * NotFoundException is caught by Nest and sent to the client as HTTP 404.
     * Throwing here is what makes GET, PATCH, and DELETE agree on a missing id.
     */
    findOneById( id: string ) {

        const car = this.cars.find( car => car.id === id );
        if ( !car ) throw new NotFoundException(`Car with id '${ id }' not found`);

        return car;
    }

    /**
     * The id is generated on the server. CreateCarDto has no id property, and
     * the global pipe rejects a body that includes one, so the client cannot
     * choose or collide with an existing id.
     */
    create( createCarDto: CreateCarDto ) {

        const car: Car = {
            id: uuid(),
            ...createCarDto
        }

        this.cars.push( car );

        return car;
    }

    /**
     * Merges the body onto the stored car.
     *
     * findOneById throws 404 first, so a missing id is not created by PATCH.
     * If the body includes id, it must equal the URL id (400 otherwise).
     * Placing `id` last in the object literal means the stored id cannot change
     * even when the body repeats it: later keys overwrite earlier ones.
     */
    update( id: string, updateCarDto: UpdateCarDto ) {

        let carDB = this.findOneById( id );

        if( updateCarDto.id && updateCarDto.id !== id )
            throw new BadRequestException(`Car id is not valid inside body`);

        this.cars = this.cars.map( car => {

            if ( car.id === id ) {
                carDB = { ...carDB,...updateCarDto, id }
                return carDB;
            }

            return car;
        })

        return carDB;
    }

    delete( id: string ) {
        //const car = this.findOneById( id );
        this.findOneById( id );
        this.cars = this.cars.filter( car => car.id !== id );
    }

    /**
     * Replaces the list with the array passed in. SeedService passes the
     * CARS_SEED constant itself, not a copy, so right after /seed `this.cars`
     * and CARS_SEED are the same array.
     *
     * create() push()es onto whatever `this.cars` points at. Until update()
     * or delete() runs, that is still CARS_SEED, and those new cars are part
     * of the next /seed.
     *
     * update() and delete() assign a new array (`map` / `filter` do not edit
     * the old one). CARS_SEED stays as it was at that moment: a deleted row
     * comes back on the next /seed, patch changes are dropped, and a create()
     * after this split does not join the seed.
     */
    fillCarsWithSeedData( cars: Car[] ) {
        this.cars = cars;
    }

}
