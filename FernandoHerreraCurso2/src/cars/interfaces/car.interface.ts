/**
 * A car as it is stored, including the server-generated id.
 *
 * This is an interface: it exists only while TypeScript compiles, and it
 * disappears from the JavaScript output. It cannot hold validation
 * decorators. Those belong on the DTO classes, which do exist at runtime.
 *
 * Brands use a class (Brand) for the same job. Either form describes the
 * shape; the class is available at runtime, the interface is not.
 */
export interface Car {

    id:    string;
    brand: string;
    model: string;

}
