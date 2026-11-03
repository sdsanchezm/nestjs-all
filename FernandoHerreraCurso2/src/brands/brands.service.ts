import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { Brand } from './entities/brand.entity';

import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

/**
 * In-memory brand store. One instance is shared by BrandsController and,
 * through BrandsModule.exports, by SeedService. Data lasts until the
 * process exits. GET /seed replaces the array.
 */
@Injectable()
export class BrandsService {

  // Empty until /seed or POST /brands. The comment shows the stored shape.
  private brands: Brand[] = [
    // {
    //   id: uuid(),
    //   name: 'Toyota',
    //   createdAt: new Date().getTime()
    // }
  ]

  /**
   * Names are stored lowercased on create (`Toyota` becomes `toyota`),
   * so a later lookup by name would not depend on the client's casing.
   * update() does not lowercase; a PATCH can store `Toyota` again.
   * createdAt is epoch milliseconds (a number), which JSON can send as-is.
   */
  create(createBrandDto: CreateBrandDto) {

    const { name } = createBrandDto;

    const brand: Brand = {
      id: uuid(),
      name: name.toLocaleLowerCase(),
      createdAt: new Date().getTime(),
    }

    this.brands.push( brand );

    return brand;
  }

  findAll() {
    return this.brands;
  }

  // NotFoundException -> HTTP 404. Used by GET /brands/:id and by update().
  findOne(id: string ) {
    const brand = this.brands.find( brand => brand.id === id );
    if ( !brand )
      throw new NotFoundException(`Brand with id "${ id }" not found`);

    return brand;
  }

  /**
   * findOne throws 404 when the id is missing, so PATCH does not create rows.
   *
   * updatedAt is written onto the current object, then a new object is built:
   * stored fields first, body (`name`) second. UpdateBrandDto has no id,
   * createdAt, or updatedAt, and the global pipe rejects those keys if the
   * client sends them, so the spread replaces name and keeps the timestamps.
   */
  update(id: string, updateBrandDto: UpdateBrandDto) {

    let brandDB = this.findOne( id );

    this.brands = this.brands.map( brand => {
      if( brand.id === id ) {
        brandDB.updatedAt = new Date().getTime();
        brandDB = { ...brandDB, ...updateBrandDto  }
        return brandDB;
      }
      return brand;
    });

    return brandDB;
  }

  /**
   * Drops the matching id. Unlike CarsService.delete, this does not call
   * findOne, so an id that is not in the list is a no-op and the response
   * is still empty HTTP 200. Invalid UUID strings never get here: the
   * controller's ParseUUIDPipe rejects them with 400.
   */
  remove(id: string ) {
    this.brands = this.brands.filter( brand => brand.id !== id );
  }

  /**
   * Same role as CarsService.fillCarsWithSeedData, and the same method name,
   * even though the array it replaces is brands. SeedService passes
   * BRANDS_SEED itself, so the service and the constant share one array
   * until update() or remove() assigns a new one.
   *
   * A create() before that split is push()ed onto BRANDS_SEED and shows up
   * again on the next /seed. A create() after the split does not.
   *
   * update() writes updatedAt onto the object findOne() returned before it
   * copies the row. On the first update after a seed, that object is the one
   * inside BRANDS_SEED, so the next /seed restores the original name and
   * keeps the new updatedAt.
   */
  fillCarsWithSeedData( brands: Brand[] ) {
    this.brands = brands;
  }
}
