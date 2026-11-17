// Business logic for Pokemon: create, list, find, update, delete.
// The controller calls these methods and returns their results.
// Throwing an HttpException (NotFoundException, BadRequestException, ...)
// is how a service chooses the HTTP status. Nest catches it and sends the response.

import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

// @Injectable() marks this class as a provider Nest is allowed to construct
// and pass into other constructors (the controller, and the seed).
@Injectable()
export class PokemonService {

  constructor(

    // InjectModel looks up the model registered in PokemonModule.forFeature.
    // Pokemon.name is "Pokemon", which must match the name used there.
    // Model<Pokemon> is the object that has find(), create(), deleteOne(), ...
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>,

  ) {}


  async create(createPokemonDto: CreatePokemonDto) {
    // Save every name in lowercase so "Pikachu" and "pikachu" collide
    // on the unique index instead of becoming two documents.
    // toLocaleLowerCase() uses the locale of the machine running Node.
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {
      // Inserts one document and returns it, including the generated _id.
      const pokemon = await this.pokemonModel.create( createPokemonDto );
      return pokemon;

    } catch (error) {
      // A duplicate name or number is a MongoDB error, not a validation error.
      // The DTO cannot know what is already stored. handleExceptions maps it to HTTP.
      this.handleExceptions( error );
    }

  }



  findAll( paginationDto: PaginationDto ) {

    // Defaults apply only when the property is missing (undefined).
    // limit 10 and offset 0 means "the first 10, ordered by Pokedex number".
    const { limit = 10, offset = 0 } = paginationDto;

    // find() with no filter matches every document.
    // Each method returns the same query so the calls can be chained.
    // The query is sent when Nest awaits the value this method returns.
    return this.pokemonModel.find()
      .limit( limit )   // at most this many documents
      .skip( offset )   // skip this many before collecting the page
      .sort({
        no: 1            // 1 is ascending, so number 1 comes before number 2
      })
      .select('-__v');   // drop __v, Mongoose's internal version counter

  }

  async findOne(term: string) {

    let pokemon: Pokemon;

    // A URL parameter is always a string. +"25" is the number 25.
    // +"pikachu" is NaN, and isNaN(NaN) is true, so names skip this branch.
    // term itself stays a string. Mongoose casts it to a number because
    // the schema declares `no` as a number.
    if ( !isNaN(+term) ) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }

    // MongoID
    // Reached when the term is not numeric, or no document had that number.
    // isValidObjectId checks the format only; it does not query the database.
    if ( !pokemon && isValidObjectId( term ) ) {
      pokemon = await this.pokemonModel.findById( term );
    }

    // Name
    // Last attempt. trim() removes spaces around the text.
    // toLowerCase() matches the lowercase names stored by create() and the seed.
    if ( !pokemon ) {
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase().trim() })
    }


    // Nest turns NotFoundException into HTTP 404.
    if ( !pokemon )
      throw new NotFoundException(`Pokemon with id, name or no "${ term }" not found`);


    return pokemon;
  }

  async update( term: string, updatePokemonDto: UpdatePokemonDto) {

    // findOne already accepts a number, a name, or a Mongo id, and 404s if none match.
    const pokemon = await this.findOne( term );
    if ( updatePokemonDto.name )
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();

    try {
      // updateOne() writes the new fields to MongoDB.
      // It does not refresh the `pokemon` object already loaded in memory.
      await pokemon.updateOne( updatePokemonDto );
      // Response = the document we loaded, with the sent fields overwritten on top.
      // Fields the client did not send stay as they were.
      return { ...pokemon.toJSON(), ...updatePokemonDto };

    } catch (error) {
      this.handleExceptions( error );
    }
  }

  async remove( id: string) {
    // Earlier versions, kept here as notes. They are not executed.
    // const pokemon = await this.findOne( id );
    // await pokemon.deleteOne();
    // return { id };
    // const result = await this.pokemonModel.findByIdAndDelete( id );

    // deleteOne returns { deletedCount }, which is 0 or 1 for a single id.
    // The pipe on the controller already rejected ids with the wrong format.
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });
    if ( deletedCount === 0 )
      throw new BadRequestException(`Pokemon with id "${ id }" not found`);

    // No response body. Nest sends HTTP 200 with an empty payload.
    return;
  }


  // private: only methods inside this class can call it.
  // Used by create and update when MongoDB rejects the write.
  private handleExceptions( error: any ) {
    // 11000 is MongoDB's duplicate-key code (unique name or unique number).
    // keyValue is the field that collided, for example { name: "pikachu" }.
    if ( error.code === 11000 ) {
      throw new BadRequestException(`Pokemon exists in db ${ JSON.stringify( error.keyValue ) }`);
    }
    console.log(error);
    // Any other error becomes HTTP 500. The message says "create" even
    // when the failure happened during update, because both paths share this method.
    throw new InternalServerErrorException(`Can't create Pokemon - Check server logs`);
  }

}
