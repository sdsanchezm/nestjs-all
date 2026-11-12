import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { Pokemon, PokemonSchema } from './entities/pokemon.entity';

const MongooseModuleImport = MongooseModule.forFeature([
  {
    name: Pokemon.name,
    schema: PokemonSchema,
  },
]);

/**
 * Feature module for the Pokemon resource.
 *
 * A feature module groups one area of the app. Nest does not see a controller
 * or a provider unless some module declares it.
 *
 * - `controllers`: classes that handle HTTP routes. Nest creates them and
 *   injects their constructor dependencies.
 * - `providers`: classes Nest can inject. `PokemonService` is `@Injectable`,
 *   and listing it here registers it in this module's injector.
 * - `imports`: other modules whose exports this module needs.
 *   `forFeature` registers the schema on the connection opened by
 *   `MongooseModule.forRoot` in `AppModule`. The `name` must be `Pokemon.name`
 *   because `PokemonService` injects the model with `@InjectModel(Pokemon.name)`.
 */
@Module({
  controllers: [PokemonController],
  providers: [PokemonService],
  imports: [MongooseModuleImport],
})
export class PokemonModule {}
