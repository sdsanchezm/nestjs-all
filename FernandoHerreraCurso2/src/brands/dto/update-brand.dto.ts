// import { PartialType } from '@nestjs/mapped-types';
// import { CreateBrandDto } from './create-brand.dto';
import { IsString, MinLength } from 'class-validator';

/**
 * Body of PATCH /brands/:id.
 *
 * PartialType(CreateBrandDto) would build this class for you and make every
 * field of CreateBrandDto optional. That version is left commented out.
 * The class below keeps `name` required, so a PATCH without `name` is 400.
 * Sending only { name: "Volvo" } is the successful case.
 *
 * There is no id field. A body that includes id is rejected by
 * forbidNonWhitelisted in main.ts, so a PATCH cannot retarget another row.
 */
// export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
export class UpdateBrandDto {

    @IsString()
    @MinLength(1)
    name: string;
}
