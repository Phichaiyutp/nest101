// src/modbus/modbus.controller.ts

import { Controller, Get, Param } from '@nestjs/common';
import { ModbusService } from './modbus.service';

@Controller('modbus')
export class ModbusController {
  constructor(private readonly modbusService: ModbusService) {}

  @Get('read')
  async readData() {
    this.modbusService.readDevices();
    return 'Reading Modbus data...';
  }
  @Get('disconnect')
  async disconnect() {
    this.modbusService.disconnectAllDevices();
    return 'Disconnect Modbus';
  }

  @Get('disconnect/:id')
  async disconnectByDevice(@Param('id') id: string): Promise<string> {
    await this.modbusService.disconnectByDevice(parseInt(id));
    return 'Disconnect Modbus';
  }
}
