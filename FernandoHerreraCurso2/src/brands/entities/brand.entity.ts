/**
 * Stored brand. "Entity" here means the record the service keeps, as opposed
 * to a DTO, which is only the request body.
 *
 * This is a class with no constructor and no decorators. TypeScript still
 * allows `const brand: Brand = { id, name, createdAt }` because the object
 * has the same fields (structural typing). Nothing about this class is
 * checked at runtime; validation happens on the DTOs before create/update.
 *
 * createdAt is always set. updatedAt appears only after PATCH.
 * Both are numbers (Date.getTime()), not Date objects.
 */
export class Brand {

    id: string;
    name: string;

    createdAt: number;
    updatedAt?: number;

}
