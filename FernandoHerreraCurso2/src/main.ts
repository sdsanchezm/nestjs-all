import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

/**
 * Starts the HTTP server.
 *
 * NestFactory.create(AppModule) builds the dependency-injection container from
 * the root module and registers every controller imported by that tree.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * ValidationPipe runs before every controller method that types its
   * argument as a DTO class (CreateCarDto, UpdateBrandDto, ...).
   *
   * whitelist: properties with no class-validator decorator are removed.
   * forbidNonWhitelisted: if the client sent any of those properties, respond
   * 400 instead of ignoring them. A body like { brand, model, hacker: true }
   * never reaches the service.
   *
   * transform is left off, so values are not coerced (the string "2020" stays
   * a string). Checks such as @IsString() still run.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Controllers are mounted at the server root: GET /cars, GET /brands, GET /seed.
  await app.listen(3000);
}
bootstrap();
