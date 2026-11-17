// Replaces the Pokemon collection with data from the public PokeAPI.
// Called by GET /api/v2/seed. It deletes every Pokemon, then inserts a new set.
// Running it again wipes whatever was added through POST /api/v2/pokemon.

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { PokeResponse } from './interfaces/poke-response.interface';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';


@Injectable()
export class SeedService {



  constructor(
    // Same model PokemonService uses. This injection works because
    // PokemonModule exports MongooseModule and SeedModule imports PokemonModule.
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>,

    // Nest supplies the AxiosAdapter exported by CommonModule.
    // The property is typed as that class, which has the get() method.
    private readonly http: AxiosAdapter,
  ) {}


  async executeSeed() {

    // {} matches every document. Same idea as SQL: DELETE FROM pokemons;
    await this.pokemonModel.deleteMany({}); // delete * from pokemons;

    // <PokeResponse> tells TypeScript what shape the JSON has,
    // so data.results, data.count, and so on are known while coding.
    // It does not check the response at runtime.
    const data = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650');

    // Build a plain array first, then write it in one database call.
    // One insertMany is much faster than 650 separate create() calls.
    const pokemonToInsert: { name: string, no: number }[] = [];

    // Each result looks like { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" }.
    // The list endpoint does not send the Pokedex number as its own field,
    // so the number is read from the URL.
    data.results.forEach(({ name, url }) => {

      const segments = url.split('/');
      // split on "/" leaves an empty string after the trailing slash,
      // so the number is the second-to-last piece.
      // ["https:", "", "pokeapi.co", "api", "v2", "pokemon", "1", ""]
      // The leading + converts the text "1" into the number 1.
      const no = +segments[ segments.length - 2 ];

      // This earlier version inserted one row per loop and had to be async.
      // It is not active. The push below only fills the array.
      // const pokemon = await this.pokemonModel.create({ name, no });
      pokemonToInsert.push({ name, no }); // [{ name: bulbasaur, no: 1 }]

    });

    await this.pokemonModel.insertMany(pokemonToInsert);


    return 'Seed Executed';
  }

}
