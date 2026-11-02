import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { CreateCarDto, UpdateCarDto } from './dto';
import { Car } from './interfaces/car.interface';

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

  findOneById(id: string): Car {
    const car = this.cars.find((item) => item.id === id);

    if (!car) {
      throw new NotFoundException(`Car with id '${id}' not found`);
    }

    return car;
  }

  create(createCarDto: CreateCarDto): Car {
    const car: Car = {
      id: uuid(),
      brand: createCarDto.brand,
      model: createCarDto.model,
    };

    this.cars.push(car);

    return car;
  }

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

  delete(id: string): void {
    this.findOneById(id);
    this.cars = this.cars.filter((car) => car.id !== id);
  }
}
