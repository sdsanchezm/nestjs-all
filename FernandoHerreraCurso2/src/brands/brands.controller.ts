import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

/**
 * HTTP adapter for brands. Routes live under /brands.
 * Parameter ids go through ParseUUIDPipe (400 when the string is not a UUID)
 * before the service runs. Body fields are checked by the global
 * ValidationPipe against CreateBrandDto or UpdateBrandDto.
 */
@Controller('brands')
export class BrandsController {

  constructor(
    private readonly brandsService: BrandsService
  ) {}

  // POST defaults to HTTP 201 and returns the stored brand (lowercased name).
  @Post()
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get()
  findAll() {
    return this.brandsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe ) id: string) {
    return this.brandsService.findOne( id );
  }

  // UpdateBrandDto.name is required, so PATCH must send a name.
  // This is stricter than PATCH /cars, where every field is optional.
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe ) id: string,
    @Body() updateBrandDto: UpdateBrandDto
  ) {
    return this.brandsService.update( id, updateBrandDto );
  }

  /**
   * remove() does not check that the id exists. A well-formed UUID that
   * matches nothing still ends as HTTP 200 and the list is unchanged.
   * DELETE /cars/:id is different: a missing car is 404.
   */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe ) id: string) {
    return this.brandsService.remove( id );
  }
}
