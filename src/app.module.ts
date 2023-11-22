// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ModbusModule } from './modbus/modbus.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [ModbusModule, ApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
