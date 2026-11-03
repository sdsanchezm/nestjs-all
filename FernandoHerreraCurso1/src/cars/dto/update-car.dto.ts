import { IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Body of PATCH /cars/:id. Every field is optional, so a client can send
 * just the fields it wants to change.
 *
 * `@IsOptional()` skips the other validators when the value is missing or
 * null. When the value is present, `@IsString()` and `@IsUUID()` still run.
 *
 * `brand` and `model` are declared again, with `@IsOptional()`, rather than
 * by extending `CreateCarDto`. Validators on a parent class still apply, so
 * a subclass would keep brand and model required. Nest can build the
 * optional version for you with `PartialType` from `@nestjs/mapped-types`;
 * this class writes that contract out by hand.
 */
export class UpdateCarDto {
  @IsString()
  @IsUUID()
  @IsOptional()
  readonly id?: string;

  @IsString()
  @IsOptional()
  readonly brand?: string;

  @IsString()
  @IsOptional()
  readonly model?: string;
}
