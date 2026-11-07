import { IsInt, IsPositive, IsString, Min, MinLength } from 'class-validator';

/**
 * Data Transfer Object for `POST /api/v2/pokemon`.
 *
 * A DTO is the shape of data crossing the HTTP boundary. It is a class,
 * not an interface, because the validation decorators below must attach
 * metadata to a real constructor. `ValidationPipe` in `main.ts` reads that
 * metadata, builds an instance of this class, and rejects invalid bodies
 * with 400 before `PokemonService.create` runs.
 *
 * Only `no` and `name` are allowed. Any other property fails the request,
 * because the global pipe uses `whitelist` together with `forbidNonWhitelisted`.
 */
export class CreatePokemonDto {
  /**
   * Pokedex number.
   *
   * Decorators stack and all of them must pass:
   * - `@IsInt` requires a whole number (a JSON number, not a numeric string).
   * - `@IsPositive` requires a value greater than zero.
   * - `@Min(1)` requires a value of at least 1.
   * For an integer, "greater than zero" and "at least 1" describe the same set.
   * Both stay so each rule is visible on its own.
   */
  @IsInt()
  @IsPositive()
  @Min(1)
  no: number;

  /**
   * Pokemon name.
   *
   * - `@IsString` requires a JSON string.
   * - `@MinLength(1)` rejects `""`.
   * The service trims and lowercases the value before it is stored, and
   * rejects a name that is only spaces.
   */
  @IsString()
  @MinLength(1)
  name: string;
}
