import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { PokemonService } from './pokemon.service';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';

/**
 * HTTP adapter for the Pokemon resource.
 *
 * `@Controller('pokemon')` sets this class's path segment. Combined with the
 * global prefix from `main.ts`, the routes below live under `/api/v2/pokemon`.
 *
 * The controller's job is to read the request and call the service. Business
 * rules and MongoDB access stay in `PokemonService`.
 *
 * Constructor injection: `private readonly pokemonService` tells Nest to
 * create a `PokemonService` (registered in `PokemonModule`) and assign it
 * to this property. `readonly` keeps the reference from being replaced.
 */
@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonService: PokemonService) {}

  /**
   * `POST /api/v2/pokemon`
   *
   * `@Body()` is the JSON body, already checked by the global `ValidationPipe`
   * against `CreatePokemonDto`. The parameter type is what tells the pipe
   * which class to validate.
   */
  @Post()
  create(@Body() createPokemonDto: CreatePokemonDto) {
    return this.pokemonService.create(createPokemonDto);
  }

  /**
   * `GET /api/v2/pokemon`
   *
   * This route has no parameter, so it is the collection. Nest matches it
   * separately from `GET /api/v2/pokemon/:term`.
   */
  @Get()
  findAll() {
    return this.pokemonService.findAll();
  }

  /**
   * `GET /api/v2/pokemon/:term`
   *
   * `:term` is a path parameter. It may be a pokedex number, a MongoDB id,
   * or a name. The service decides which one it is. No pipe is applied here,
   * because a name or a number would be rejected by `ParseMongoIdPipe`.
   *
   * `@Param('term')` pulls that one segment out as a string.
   */
  @Get(':term')
  findOne(@Param('term') term: string) {
    return this.pokemonService.findOne(term);
  }

  /**
   * `PATCH /api/v2/pokemon/:term`
   *
   * The path identifies the document (number, id, or name). The body carries
   * the fields to change and is validated as `UpdatePokemonDto`.
   */
  @Patch(':term')
  update(
    @Param('term') term: string,
    @Body() updatePokemonDto: UpdatePokemonDto,
  ) {
    return this.pokemonService.update(term, updatePokemonDto);
  }

  /**
   * `DELETE /api/v2/pokemon/:id`
   *
   * Removal accepts only a MongoDB id. The parameter is named `id` to say so.
   * The name is local to this method; the URL shape is still one segment,
   * the same pattern as `:term` on the routes above.
   *
   * `ParseMongoIdPipe` runs on that segment before `remove` is called.
   * An invalid id becomes a 400 and the service is not called.
   */
  @Delete(':id')
  remove(@Param('id', ParseMongoIdPipe) id: string) {
    return this.pokemonService.remove(id);
  }
}
