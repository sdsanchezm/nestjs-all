// This file is the entry point. Node starts the process here
// (see the "start" script in package.json). Nothing is listening
// for HTTP requests until bootstrap() finishes.

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// async lets us use await. Creating the app and opening a port
// are both operations that take time, so we wait for each one.
async function bootstrap() {
  // NestFactory reads AppModule (and every module it imports),
  // creates the controllers and services, and builds an HTTP server.
  const app = await NestFactory.create(AppModule);

  // Prefix added in front of every controller path.
  // @Controller('pokemon') is then reached at /api/v2/pokemon.
  app.setGlobalPrefix('api/v2');

  // A pipe runs on incoming data before a controller method sees it.
  // useGlobalPipes installs this one on every route.
  app.useGlobalPipes(
    new ValidationPipe({
      // Remove properties that the DTO class does not declare,
      // so a client cannot save extra fields that we never asked for.
      whitelist: true,
      // Reject the request (HTTP 400) when an unknown property is sent,
      // instead of quietly dropping it.
      forbidNonWhitelisted: true,
      // Turn the plain JSON object into an instance of the DTO class
      // (CreatePokemonDto, PaginationDto, ...). The validator needs that instance.
      transform: true,
      transformOptions: {
        // Query strings arrive as text ("10"). This converts a value
        // to the type written on the DTO (number) when the conversion is safe.
        enableImplicitConversion: true,
      }
    })
  );

  // Open port 3000 and keep the process running.
  await app.listen(3000);
}

// Calling the function is what actually starts the server.
bootstrap();
