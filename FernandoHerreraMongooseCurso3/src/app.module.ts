import { join } from 'path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MongooseModule } from '@nestjs/mongoose';

import { PokemonModule } from './pokemon/pokemon.module';
import { CommonModule } from './common/common.module';

/**
 * Root module. Nest starts here (see `main.ts`) and loads every module
 * listed in `imports`. This class has no controllers of its own: it composes
 * the application.
 *
 * `@Module` marks the class as a Nest module. The object passed to it is
 * the module's metadata. `imports` are other modules whose exported
 * providers this module may use.
 */
@Module({
  imports: [
    /**
     * Serves files from the `public` folder as static HTTP files.
     * `forRoot` is the one-time configuration of that feature for the whole app.
     *
     * `__dirname` is this file's compiled directory (`dist` when built).
     * `join` walks up to the project root and into `public`, so `index.html`
     * is available at `/` and does not go through the `api/v2` controllers.
     * `join` comes from Node's `path` module and builds the path with the
     * correct separator for the operating system.
     */
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),

    /**
     * Opens the MongoDB connection used by every `@InjectModel` in the app.
     * `forRoot` belongs on the root module and is called once.
     * Feature modules then call `MongooseModule.forFeature` to register schemas
     * on this same connection.
     *
     * The URL points at a local MongoDB. `nest-pokemon` is the database name;
     * Mongo creates it on the first write.
     */
    MongooseModule.forRoot('mongodb://localhost:27017/nest-pokemon'),

    /**
     * Feature module for the Pokemon resource: its controller, service, and schema.
     */
    PokemonModule,

    /**
     * Shared module. It is empty today and is imported so shared pieces
     * (pipes, filters, guards) have a home as the app grows.
     */
    CommonModule,
  ],
})
export class AppModule {}
