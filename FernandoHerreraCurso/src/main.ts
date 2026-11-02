import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

/**
 * Process entry point.
 *
 * Nest does not boot from a controller. `NestFactory.create` reads the root
 * module (`AppModule`), follows its imports, and builds the application:
 *
 * - one dependency-injection container
 * - one instance of each provider (singleton, unless a scope says otherwise)
 * - one route per controller method
 *
 * `listen` binds that application to an HTTP port.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * A pipe runs on incoming data before the controller method is called.
   * Registering it here applies it to every route.
   *
   * `ValidationPipe` reads the DTO class on `@Body()` / `@Query()` / `@Param()`
   * and checks the payload with class-validator.
   *
   * `whitelist` removes properties that have no validation decorator.
   * `forbidNonWhitelisted` turns those extra properties into a 400 instead
   * of dropping them quietly. The DTO is therefore the allowed body contract.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
