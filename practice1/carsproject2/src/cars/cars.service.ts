import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { Car } from './interfaces/car.interface';
import { v4 as uuid_v4 } from 'uuid';

@Injectable()
export class CarsService {
  // initialize this thing
  private carList: Car[] = [];

  create(createCarDto: CreateCarDto) {
    const car: Car = {
            id: uuid_v4(),
            ...createCarDto
        }

        this.carList.push( car );
        return car;
  }

  findAll() {
    return this.carList;
  }

  findOneById(id: string) {
    const car = this.carList.find((car) => car.id === id);

    if (!car) throw new NotFoundException(`Car with id '${id}' not found`);
    return car;
  }

  update(id: string, updateCarDto: UpdateCarDto) {
    let carDB = this.findOneById( id );

        if( updateCarDto.id && updateCarDto.id !== id )
            throw new BadRequestException(`Car id is not valid inside body`);

        this.carList = this.carList.map( car => {

            if ( car.id === id ) {
                carDB = { ...carDB,...updateCarDto, id }
                return carDB;
            }

            return car;
        })

        return carDB;
  }

  remove(id: string) {
    this.findOneById( id );
    this.carList = this.carList.filter( car => car.id !== id );
  }

  seedCardsData(cars: Car[]) {
    this.carList = cars;
  }
}
