import { Module } from '@nestjs/common';

import { CarsModule } from './cars/cars.module';

/**
 * Root module. `NestFactory.create(AppModule)` starts from this class and
 * loads every module listed in `imports`.
 *
 * `@Module` describes a boundary. It can declare:
 * - `imports`: other modules whose exported providers this one may use
 * - `controllers`: HTTP route handlers
 * - `providers`: injectable classes (services, repositories, and so on)
 * - `exports`: providers that become visible to modules that import this one
 *
 * This root module only composes the app. The `/cars` routes live in
 * `CarsModule`, so they are not repeated here.
 */
@Module({
  imports: [CarsModule],
})
export class AppModule {}
