// src/modbus/modbus.module.ts

import { Module } from '@nestjs/common';
import { ModbusController } from './modbus.controller';
import { ModbusService } from './modbus.service';

@Module({
  controllers: [ModbusController],
  providers: [ModbusService],
  exports: [ModbusService],
})
export class ModbusModule {}
