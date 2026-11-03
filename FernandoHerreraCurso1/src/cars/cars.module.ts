import { Module } from '@nestjs/common';

import { CarsController } from './cars.controller';
import { CarsService } from './cars.service';

/**
 * Feature module: everything that belongs to the "cars" resource.
 *
 * `controllers` — Nest reads the route decorators and mounts them.
 * `providers` — classes the injector is allowed to construct. `CarsController`
 *   can ask for `CarsService` only because it is listed here (or exported by
 *   an imported module).
 * `exports` — makes `CarsService` public. Another module that `imports`
 *   `CarsModule` can inject `CarsService`. Providers that are not exported
 *   stay private to this module.
 */
@Module({
  controllers: [CarsController],
  providers: [CarsService],
  exports: [CarsService],
})
export class CarsModule {}
