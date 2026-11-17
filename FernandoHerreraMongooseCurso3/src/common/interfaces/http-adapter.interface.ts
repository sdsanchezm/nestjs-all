// A contract: any class that implements HttpAdapter must provide get().
// SeedService depends on this shape, not on the axios library directly.
// That is the adapter pattern. Another class could implement the same
// get() method with a different HTTP library, and SeedService would not change.
//
// Interfaces exist only while TypeScript compiles. They are removed from
// the JavaScript that Node runs, and they do not validate data at runtime.

export interface HttpAdapter {
    // <T> is a generic, a type parameter the caller fills in.
    // get<PokeResponse>(url) means "this Promise resolves to a PokeResponse".
    get<T>( url: string ): Promise<T>;
}
