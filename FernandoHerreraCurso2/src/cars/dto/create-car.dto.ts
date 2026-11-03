import { IsString } from 'class-validator';

/**
 * Body of POST /cars. A DTO (data transfer object) is the contract for one
 * request. The global ValidationPipe reads these decorators at runtime.
 *
 * @IsString() rejects numbers, booleans, and objects. An empty string is
 * still a string, so "" is accepted. Compare with CreateBrandDto, which
 * also requires @MinLength(1).
 *
 * `readonly` is TypeScript only. It does not freeze the object at runtime;
 * it stops this project from assigning createCarDto.brand = ... by mistake.
 */
export class CreateCarDto {

    @IsString()
    readonly brand: string;

    @IsString()
    readonly model: string;

}
