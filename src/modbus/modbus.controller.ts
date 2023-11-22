// src/modbus/modbus.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ModbusService } from './modbus.service';

@Controller('modbus')
export class ModbusController {
  constructor(private readonly modbusService: ModbusService) {}

  @Get('read')
  async readData() {
    try {
      await this.modbusService.readDevices();
      return { message: 'Reading data started successfully.' };
    } catch (error) {
      return { error: 'Error reading data.', details: error };
    }
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
