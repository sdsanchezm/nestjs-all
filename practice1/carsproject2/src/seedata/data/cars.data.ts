import { Car } from "../../cars/interfaces/car.interface";
import { v4 as uuid_v4 } from 'uuid';


export const CARS_SEED: Car[] = [
    {
        id: uuid_v4(),
        model: "1976",
        brand: "Renault"
    },
    {
        id: uuid_v4(),
        model: "1985",
        brand: "Honda"
    },
    {
        id: uuid_v4(),
        model: "1993",
        brand: "Chevrolet"
    }
]