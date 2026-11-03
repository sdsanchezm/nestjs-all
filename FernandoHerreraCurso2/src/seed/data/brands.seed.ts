import { v4 as uuid } from 'uuid';
import { Brand } from 'src/brands/entities/brand.entity';

/**
 * Sample brands. Same timing as CARS_SEED: ids and createdAt are computed
 * when this module is first imported (process start), not when /seed runs.
 *
 * The import `src/brands/...` works because tsconfig baseUrl is the project
 * root. cars.seed.ts instead uses a relative path (`../../cars/...`).
 * Both resolve to a file under src; neither style changes runtime behavior.
 */
export const BRANDS_SEED: Brand[] = [
    {
        id: uuid(),
        name: 'Volvo',
        createdAt: new Date().getTime(),
    },
    {
        id: uuid(),
        name: 'Toyota',
        createdAt: new Date().getTime(),
    },
    {
        id: uuid(),
        name: 'Honda',
        createdAt: new Date().getTime(),
    },
    {
        id: uuid(),
        name: 'Jeep',
        createdAt: new Date().getTime(),
    },
    {
        id: uuid(),
        name: 'Tesla',
        createdAt: new Date().getTime(),
    },
]
