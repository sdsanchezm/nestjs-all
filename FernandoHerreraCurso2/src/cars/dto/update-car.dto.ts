import { IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Body of PATCH /cars/:id. Every field is optional, so { } or { model: "Civic" }
 * are both valid. Omitted fields are left as they are in CarsService.update,
 * because the service spreads this object over the stored car.
 *
 * @IsOptional() skips the other decorators when the value is null or undefined.
 * An empty string is not skipped: id: "" fails @IsUUID(), and brand: "" fails
 * only if some other decorator rejects it (@IsString() allows "").
 *
 * id is optional. When it is sent, CarsService requires it to match the URL.
 * @IsUUID() already implies a string; @IsString() is a second, explicit check.
 */
export class UpdateCarDto {

    @IsString()
    @IsUUID()
    @IsOptional()
    readonly id?:    string;

    @IsString()
    @IsOptional()
    readonly brand?: string;

    @IsString()
    @IsOptional()
    readonly model?: string;

}
