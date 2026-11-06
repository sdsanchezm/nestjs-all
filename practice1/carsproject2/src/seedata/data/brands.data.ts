import { Brands } from "../../brands/interfaces/brand.interface";
import { v4 as uuid_v4 } from 'uuid';

export const BRANDS_SEED: Brands[] = [
    {
        id: uuid_v4(),
        brand: "Mercedes"
    },
    {
        id: uuid_v4(),
        brand: "Volkswagen"
    },
    {
        id: uuid_v4(),
        brand: "Bmw"
    }
]
