//import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CarsService } from './cars.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';

/**
 * HTTP adapter for cars. It does not store anything: it reads the route,
 * lets pipes validate the id and the body, then calls CarsService.
 *
 * @Controller('cars') prefixes every method, so @Get() is GET /cars
 * and @Get(':id') is GET /cars/:id.
 *
 * Body rules come from the global ValidationPipe in main.ts together with
 * the DTO classes. This controller does not add a second pipe.
 */
@Controller('cars')
export class CarsController {

  // Nest fills this from CarsModule.providers. `private readonly` both
  // stores the argument as a property and blocks reassignment.
  constructor(
    private readonly carsService: CarsService
  ) {}

  // Registered before @Get(':id'). A static path and a param path do not
  // clash here ("cars" is the prefix, not an id), but keeping the list
  // route first is the usual order and avoids surprises if a static
  // segment is added later (for example GET /cars/count).
  @Get()
  getAllCars() {
    return this.carsService.findAll();
  }

  /**
   * ParseUUIDPipe runs before the method. Anything that is not a UUID
   * becomes HTTP 400 and findOneById is never called. No version is
   * passed, so versions 3, 4, and 5 are all accepted. New ids from the
   * `uuid` package are version 4.
   */
  @Get(':id')
  getCarById( @Param('id', ParseUUIDPipe ) id: string ) {
    return this.carsService.findOneById( id );
  }

  // @Body() is validated as CreateCarDto: brand and model must be strings.
  // Nest's default status for POST is 201 Created.
  @Post()
  createCar( @Body() createCarDto: CreateCarDto ) {
    return this.carsService.create( createCarDto );
  }

  // PATCH is partial: every field on UpdateCarDto is optional.
  // The id in the URL chooses the row; the body only carries changes.
  @Patch(':id')
  updateCar(
    @Param('id', ParseUUIDPipe ) id: string,
    @Body() updateCarDto: UpdateCarDto )
  {
    return this.carsService.update( id, updateCarDto );
  }

  // DELETE with an unknown id is 404 (the service checks first).
  // A successful delete returns no body; Nest sends 200.
  @Delete(':id')
  deleteCar( @Param('id', ParseUUIDPipe ) id: string ) {
    return this.carsService.delete( id )
  }

}
