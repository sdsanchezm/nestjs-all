import { PartialType } from '@nestjs/mapped-types';
import { CreatePokemonDto } from './create-pokemon.dto';

/**
 * Data Transfer Object for `PATCH /api/v2/pokemon/:term`.
 *
 * `PartialType` builds a new class from `CreatePokemonDto` with every
 * property made optional. The same validators (`@IsInt`, `@MinLength`, ...)
 * still run when a property is present. A missing property is skipped, so
 * a client can send `{ "name": "bulbasaur" }` without sending `no`.
 *
 * `PATCH` means "change the fields I sent". `PUT` would mean "replace the
 * whole document". This route is `PATCH`, so the partial DTO matches it.
 *
 * An empty body `{}` is valid and updates nothing.
 */
export class UpdatePokemonDto extends PartialType(CreatePokemonDto) {}
