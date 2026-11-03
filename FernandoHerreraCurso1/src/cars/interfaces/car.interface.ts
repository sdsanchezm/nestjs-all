/**
 * Shape of a car once it is stored by `CarsService`.
 *
 * This is the domain model: id, brand, and model. It is not a request DTO
 * and it is not validated. Request bodies use the classes in `dto/`, which
 * can carry class-validator decorators. An interface cannot, because
 * TypeScript erases it when it compiles.
 */
export interface Car {
  id: string;
  brand: string;
  model: string;
}
