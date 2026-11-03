import { IsString, MinLength } from 'class-validator';

/**
 * Body of POST /brands. Both decorators must pass: name has to be a string
 * and its length has to be at least 1, so "" is rejected. A string of spaces
 * (" ") has length 1 and is accepted.
 *
 * The service then stores name.toLocaleLowerCase(). This DTO does not
 * change case; it only checks the raw body.
 */
export class CreateBrandDto {

    @IsString()
    @MinLength(1)
    name: string;

}
