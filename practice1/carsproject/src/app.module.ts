import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CarsModule } from './cars/cars.module.js';

@Module({
  imports: [CarsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
