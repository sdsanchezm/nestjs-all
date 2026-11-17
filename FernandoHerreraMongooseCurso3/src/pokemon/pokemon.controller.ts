// The controller is the HTTP layer. It does not query MongoDB.
// It reads the already-validated request and calls PokemonService.
//
// With the prefix from main.ts, the routes are:
//   POST   /api/v2/pokemon
//   GET    /api/v2/pokemon
//   GET    /api/v2/pokemon/:term
//   PATCH  /api/v2/pokemon/:term
//   DELETE /api/v2/pokemon/:id

import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';

import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { PaginationDto } from 'src/common/dto/pagination.dto';

// 'pokemon' is the path shared by every method in this class.
@Controller('pokemon')
export class PokemonController {
  // Dependency injection. Nest sees PokemonService in the constructor,
  // creates that service (or reuses the one it already created), and passes it in.
  // private readonly stores the argument as a property and blocks reassignment.
  constructor(private readonly pokemonService: PokemonService) {}

  // POST /api/v2/pokemon
  // @Body() is the JSON body. The global ValidationPipe has already
  // checked it against CreatePokemonDto. If it was invalid, this method never runs.
  @Post()
  create(@Body() createPokemonDto: CreatePokemonDto) {
    return this.pokemonService.create(createPokemonDto);
  }

  // GET /api/v2/pokemon?limit=10&offset=0
  // @Query() maps the query string onto PaginationDto.
  @Get()
  findAll( @Query() paginationDto: PaginationDto ) {
    return this.pokemonService.findAll( paginationDto );
  }

  // :term is a URL parameter. It may be a name, a Pokedex number, or a Mongo id.
  // The service decides which of those it is.
  @Get(':term')
  findOne(@Param('term') term: string) {
    return this.pokemonService.findOne( term );
  }

  // PATCH updates only the fields present in the body.
  // term works the same way as in findOne.
  @Patch(':term')
  update(@Param('term') term: string, @Body() updatePokemonDto: UpdatePokemonDto) {
    return this.pokemonService.update( term, updatePokemonDto);
  }

  // The second argument of @Param is a pipe. ParseMongoIdPipe runs
  // before remove(), and rejects the request if :id is not a Mongo ObjectId.
  @Delete(':id')
  remove(@Param('id', ParseMongoIdPipe ) id: string) {
    return this.pokemonService.remove( id );
  }
}
