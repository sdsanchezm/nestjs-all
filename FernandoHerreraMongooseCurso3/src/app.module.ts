// Root module. Nest boots from this class and follows its imports.
// A module is a grouping: it tells Nest which controllers, services,
// and other modules belong together. It does not handle requests itself.

import { join } from 'path'; // Node helper that builds a filesystem path
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MongooseModule } from '@nestjs/mongoose';

import { PokemonModule } from './pokemon/pokemon.module';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';

// A decorator is a function written with @. Nest reads decorators
// when the app starts and uses them as configuration.
// @Module does not run on each request.
@Module({
  imports: [

    // Serves files from the /public folder (HTML, CSS, images)
    // without a controller method per file.
    // __dirname is the folder of this file after compilation (dist/).
    // '..' steps up to the project root, then into public/.
    ServeStaticModule.forRoot({
      rootPath: join(__dirname,'..','public'),
    }),

    // One database connection for the whole application.
    // forRoot belongs in the root module. forFeature (in PokemonModule)
    // later registers individual collections on this connection.
    // The database name is the last segment: nest-pokemon.
    MongooseModule.forRoot('mongodb://localhost:27017/nest-pokemon'),

    // Feature modules. Importing them registers their routes and providers.
    PokemonModule,

    CommonModule,

    SeedModule,

  ],
})
export class AppModule {}
