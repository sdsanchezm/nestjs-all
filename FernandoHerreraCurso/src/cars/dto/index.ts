/**
 * Barrel file for this folder.
 *
 * `import { CreateCarDto, UpdateCarDto } from './dto'` resolves to this
 * `index.ts`. Callers depend on the folder's public types, not on which
 * file each class is declared in. Export a DTO here when another file in
 * the app should be allowed to use it.
 */
export { CreateCarDto } from './create-car.dto';
export { UpdateCarDto } from './update-car.dto';
