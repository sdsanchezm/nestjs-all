import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CarsService } from './cars.service';
import { CreateCarDto, UpdateCarDto } from './dto';

/**
 * HTTP adapter for the cars resource.
 *
 * `@Controller('cars')` sets the path prefix. Each method decorator adds the
 * verb and, when present, the rest of the path. Nest turns the return value
 * into JSON. Default status codes: POST is 201, the other verbs here are 200.
 *
 * This class should stay thin: read the request, call `CarsService`, return
 * the result. Business rules and the in-memory list live in the service.
 * An `HttpException` thrown there (404, 400, ...) is caught by Nest and sent
 * as the error response, so these methods do not need a try/catch.
 */
@Controller('cars')
export class CarsController {
  /**
   * Constructor injection.
   *
   * Nest looks at the type of this parameter (`CarsService`), finds that
   * provider in `CarsModule`, and passes the same instance on every request.
   * The parameter property (`private readonly`) stores it on `this`.
   * That metadata exists at runtime because `emitDecoratorMetadata` is on
   * in tsconfig.
   */
  constructor(private readonly carsService: CarsService) {}

  /** GET /cars */
  @Get()
  getAllCars() {
    return this.carsService.findAll();
  }

  /**
   * GET /cars/:id
   *
   * `@Param('id', ParseUUIDPipe)` reads the `id` path segment, then runs the
   * pipe. `ParseUUIDPipe` rejects a value that is not a UUID with 400, so
   * `findOneById` only receives a well-formed id. A missing car is still a
   * 404, thrown by the service.
   */
  @Get(':id')
  getCarById(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.findOneById(id);
  }

  /**
   * POST /cars
   *
   * `@Body()` is the parsed JSON body. Its type is `CreateCarDto`, so the
   * global `ValidationPipe` validates the payload against that class before
   * this method runs. An invalid body never reaches `create`.
   */
  @Post()
  createCar(@Body() createCarDto: CreateCarDto) {
    return this.carsService.create(createCarDto);
  }

  /**
   * PATCH /cars/:id
   *
   * The URL selects the car. The body carries only the fields to change
   * (`UpdateCarDto`, all optional). Both are validated on their own: the
   * pipe on the param, and the global pipe on the body.
   */
  @Patch(':id')
  updateCar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCarDto: UpdateCarDto,
  ) {
    return this.carsService.update(id, updateCarDto);
  }

  /**
   * DELETE /cars/:id
   *
   * `delete` returns `void`. Nest responds with 200 and an empty body.
   * A missing id still ends as 404 because the service throws first.
   */
  @Delete(':id')
  deleteCar(@Param('id', ParseUUIDPipe) id: string) {
    return this.carsService.delete(id);
  }
}
