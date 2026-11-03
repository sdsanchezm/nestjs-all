import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { CreateCarDto, UpdateCarDto } from './dto';
import { Car } from './interfaces/car.interface';

/**
 * Cars use cases, independent of HTTP.
 *
 * `@Injectable()` registers this class as a provider. Nest creates it; other
 * classes receive it through their constructor. The default scope is
 * singleton, so the array below lives for the whole process and is shared
 * by every request. Ids are generated when that one instance is constructed,
 * which is why they change on each restart. There is no database behind this.
 */
@Injectable()
export class CarsService {
  private cars: Car[] = [
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
  ];

  findAll(): Car[] {
    return this.cars;
  }

  /**
   * `NotFoundException` is an `HttpException`. Thrown from a provider, it
   * still becomes the HTTP response (404 plus this message). The controller
   * does not translate it.
   */
  findOneById(id: string): Car {
    const car = this.cars.find((item) => item.id === id);

    if (!car) {
      throw new NotFoundException(`Car with id '${id}' not found`);
    }

    return car;
  }

  /**
   * The id is assigned here, not accepted from the client. Only `brand` and
   * `model` are copied from the already-validated DTO.
   */
  create(createCarDto: CreateCarDto): Car {
    const car: Car = {
      id: uuid(),
      brand: createCarDto.brand,
      model: createCarDto.model,
    };

    this.cars.push(car);

    return car;
  }

  /**
   * The route id is the car to update. A different id in the body is a 400:
   * the body must not point the update at another record. `id` is written
   * last so the stored id stays the one from the URL.
   */
  update(id: string, updateCarDto: UpdateCarDto): Car {
    const currentCar = this.findOneById(id);

    if (updateCarDto.id && updateCarDto.id !== id) {
      throw new BadRequestException(`Car id is not valid inside body`);
    }

    const updatedCar: Car = {
      ...currentCar,
      ...updateCarDto,
      id,
    };

    this.cars = this.cars.map((car) => (car.id === id ? updatedCar : car));

    return updatedCar;
  }

  /**
   * `findOneById` throws 404 when the id is unknown, so `filter` only runs
   * for a car that exists. Returning nothing leaves the HTTP body empty.
   */
  delete(id: string): void {
    this.findOneById(id);
    this.cars = this.cars.filter((car) => car.id !== id);
  }
}
