// npm install class-validator
import { IsString, isString } from "class-validator";

export class CreateCarDto {

    @IsString()
    readonly model: string;

    @IsString()
    readonly brand: string;
}
