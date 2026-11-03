import { IsString } from 'class-validator';

/**
 * DTO (data transfer object): the body of POST /cars, not the stored car.
 *
 * `ValidationPipe` can only validate a class. TypeScript interfaces are
 * removed at compile time, so they cannot hold decorators. `@IsString()`
 * is metadata that class-validator reads when the pipe runs.
 *
 * A property with no decorator is rejected, because `main.ts` sets
 * `forbidNonWhitelisted`. Adding a field to the allowed body means adding
 * it here with a validator.
 *
 * `readonly` is a TypeScript constraint for this codebase. It does not
 * freeze the object at runtime.
 */
export class CreateCarDto {
  @IsString()
  readonly brand: string;

  @IsString()
  readonly model: string;
}
