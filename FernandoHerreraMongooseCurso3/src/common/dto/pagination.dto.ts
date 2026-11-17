// Query string of GET /api/v2/pokemon?limit=10&offset=20.
// Both fields are optional. When the client omits them, PokemonService
// uses limit = 10 and offset = 0 (see the defaults in findAll).
//
// Values in a URL are strings. enableImplicitConversion in main.ts
// turns "10" into the number 10 before these decorators run.

import { IsNumber, IsOptional, IsPositive, Min } from 'class-validator';


export class PaginationDto {

    // How many documents to return.
    // @IsOptional() skips the rest of the checks when the parameter is absent.
    // @IsPositive() means greater than 0. @Min(1) means at least 1.
    @IsOptional()
    @IsPositive()
    @IsNumber()
    @Min(1)
    limit?: number;

    // How many documents to skip before the page starts.
    // @IsPositive() requires a number greater than 0, so the explicit
    // query ?offset=0 does not pass validation. Leave offset off the URL
    // to start at the first document; the service then fills in 0.
    @IsOptional()
    @IsNumber()
    @IsPositive()
    offset?: number;

}
