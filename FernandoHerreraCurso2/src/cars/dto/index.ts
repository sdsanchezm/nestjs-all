/**
 * Barrel file. Importing from './dto' loads this index, so CarsService can
 * write `import { CreateCarDto, UpdateCarDto } from './dto'` instead of
 * two deep paths. Add a new DTO by exporting it from here.
 */
export { UpdateCarDto } from './update-car.dto';
export { CreateCarDto } from './create-car.dto';
