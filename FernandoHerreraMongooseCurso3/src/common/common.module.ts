// Shared module with no routes. Its only job is to create AxiosAdapter
// and make that instance available to other modules.
// A provider is visible inside its own module. Other modules can inject
// it only after this module lists it in exports and they import CommonModule.

import { Module } from '@nestjs/common';
import { AxiosAdapter } from './adapters/axios.adapter';

@Module({
    providers: [ AxiosAdapter ],
    exports: [ AxiosAdapter ]
})
export class CommonModule {}
