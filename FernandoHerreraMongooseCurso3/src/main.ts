import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { port } from './common/imports/application.imports';

/**
 * Boots the HTTP server.
 *
 * `async` lets us `await` Nest while it wires modules, connects to Mongo,
 * and binds the port. The function is called once, at the bottom of this file.
 */
async function bootstrap() {
  /**
   * `NestFactory.create` builds the application from the root module.
   * `AppModule` is that root: every feature module hangs off its `imports`.
   * The returned `app` is the handle for global settings and `listen`.
   */
  const app = await NestFactory.create(AppModule);

  /**
   * Every controller path is prefixed with `api/v2`.
   * `@Controller('pokemon')` therefore serves `/api/v2/pokemon`, not `/pokemon`.
   * The prefix versions the API in one place, so controllers stay free of it.
   */
  app.setGlobalPrefix('api/v2');

  /**
   * A global pipe runs for every route handler argument (`@Body`, `@Param`, `@Query`).
   * `ValidationPipe` reads the `class-validator` decorators on the DTO class
   * declared as the argument type. Nest knows that class because TypeScript
   * is compiled with `emitDecoratorMetadata`.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      /**
       * Drops properties that have no validation decorator.
       * A field that is not on the DTO never reaches the service.
       */
      whitelist: true,
      /**
       * Rejects the request with 400 when a property was going to be stripped.
       * Callers learn about the unknown field instead of having it silently ignored.
       */
      forbidNonWhitelisted: true,
      /**
       * Builds a real instance of the DTO class from the plain JSON object.
       * The validators then run on that instance. This project has `class-transformer`
       * installed, which is the library `transform` uses.
       */
      transform: true,
    }),
  );

  /**
   * `port` reads `PORT` from the `ConfigService` that `ConfigModule` loaded
   * from `.env`. The Mongo URL stays fixed in `AppModule`.
   */
  await app.listen(port(app));
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();
