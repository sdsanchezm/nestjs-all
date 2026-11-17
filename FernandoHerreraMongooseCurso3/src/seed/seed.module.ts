// Wires the seed feature: one controller and one service.
// SeedService's constructor needs the Pokemon model and AxiosAdapter.
// Those are created in other modules, so this module imports them.
// Importing a module gives access only to what that module exports.

import { Module } from '@nestjs/common';
import { CommonModule } from './../common/common.module';
import { PokemonModule } from './../pokemon/pokemon.module';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [
    PokemonModule,
    CommonModule,
  ]
})
export class SeedModule {}
