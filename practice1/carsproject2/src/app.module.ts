import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CarsModule } from './cars/cars.module';
import { SeedataModule } from './seedata/seedata.module';
import { BrandsModule } from './brands/brands.module';

@Module({
  imports: [CarsModule, SeedataModule, BrandsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
