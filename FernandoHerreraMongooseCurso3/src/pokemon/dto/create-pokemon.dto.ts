// DTO means Data Transfer Object: a class that describes data crossing
// a boundary. This one describes the JSON body of POST /api/v2/pokemon.
//
// The decorators below are validation rules. The ValidationPipe in main.ts
// runs them and answers HTTP 400 when a rule fails, before the service runs.
// class-validator checks at runtime. TypeScript types alone disappear
// after compilation and would not reject a bad request.

import { IsInt, IsPositive, IsString, Min, MinLength } from 'class-validator';

export class CreatePokemonDto {

    // Whole number, greater than zero, and at least 1.
    // @IsPositive() means > 0. @Min(1) means >= 1.
    // Together they reject 0, negatives, and decimals.
    @IsInt()
    @IsPositive()
    @Min(1)
    no: number;

    // Text with at least one character. "" fails. A missing name fails.
    @IsString()
    @MinLength(1)
    name: string;

}
