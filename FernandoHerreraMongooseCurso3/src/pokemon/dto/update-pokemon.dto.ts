// Body of PATCH /api/v2/pokemon/:term.
// A partial update may send only name, only no, or both.
//
// PartialType copies CreatePokemonDto and marks every property optional,
// while keeping the same rules for any property that is present.
// {} is valid. { "name": "" } still fails @MinLength(1).

import { PartialType } from '@nestjs/mapped-types';
import { CreatePokemonDto } from './create-pokemon.dto';

export class UpdatePokemonDto extends PartialType(CreatePokemonDto) {}
