// Feature module for Pokemon. It connects three things:
// the HTTP routes (controller), the business logic (service),
// and the MongoDB collection (Mongoose model).

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { Pokemon, PokemonSchema } from './entities/pokemon.entity';

@Module({
  // Controllers Nest should create and bind to routes.
  controllers: [PokemonController],
  // Providers Nest can inject. PokemonService is created once and shared.
  providers: [PokemonService],
  imports: [
    // forFeature registers a model on the connection opened in AppModule.
    // After this, @InjectModel(Pokemon.name) works inside this module.
    MongooseModule.forFeature([
      {
        // Pokemon.name is the string "Pokemon". Mongoose uses it as the
        // model name and stores documents in the "pokemons" collection.
        name: Pokemon.name,
        // Rules for each document: field names, types, unique, indexes.
        schema: PokemonSchema,
      },
    ])
  ],
  // A provider stays private to this module unless it is exported.
  // SeedModule imports PokemonModule so it can inject the same model.
  exports: [
    MongooseModule
  ]
})
export class PokemonModule {}
