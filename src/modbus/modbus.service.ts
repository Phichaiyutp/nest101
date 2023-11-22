import * as Modbus from 'jsmodbus';
import * as net from 'net';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { Injectable } from '@nestjs/common';

interface DeviceConfig {
  deviceId: number;
  deviceName: string;
  unitId: number;
  port: number;
  host: string;
  addresses: {
    label: string;
    unit: string;
    datatype: string;
    swap: string;
    scale: number;
    fc: number;
    address: number;
    length: number;
    offset: number;
  }[];
  interval: number;
}

@Injectable()
export class ModbusService {
  private config: DeviceConfig[];

  constructor() {}

  private modbusClients: {
    client: any;
    socket: any;
    deviceConfig: DeviceConfig;
    IntervalByDevice: NodeJS.Timeout[];
  }[] = [];
  private devices: {
    deviceName: string;
    members: { label: string; value: string; unit: string }[];
  }[] = [];

  private createModbusClient(deviceConfig: DeviceConfig) {
    const socket = new net.Socket();
    const client = new Modbus.client.TCP(socket, deviceConfig.unitId);
    try {
      socket.connect(deviceConfig.port, deviceConfig.host, () =>
        console.log(
          `Connected to ${deviceConfig.host}:${deviceConfig.port} unitId : ${deviceConfig.unitId}`,
        ),
      );
    } catch (error) {
      console.error(
        `Error connecting to ${deviceConfig.host}:${deviceConfig.port}:`,
        error,
      );
    }
    socket.on('close', () =>
      console.log(
        `Connection closed to ${deviceConfig.host}:${deviceConfig.port} unitId : ${deviceConfig.unitId}`,
      ),
    );
    const IntervalByDevice: NodeJS.Timeout[] = [];
    return { client, socket, deviceConfig, IntervalByDevice };
  }

  private async initialize() {
    try {
      const config_file = path.resolve('src/modbus', 'config.json');
      this.config = JSON.parse(await fsPromises.readFile(config_file, 'utf8'));
      this.modbusClients = this.config.map(this.createModbusClient);
    } catch (error) {
      console.error('Error initializing Modbus service:', error);
    }
  }

  private checkDatatype(
    buffer: Buffer,
    datatype: string,
    swap: string,
  ): number {
    const byteOffset = 0;
    const readFunction =
      swap === 'BE' ? buffer[`read${datatype}BE`] : buffer[`read${datatype}LE`];

    if (readFunction) {
      return readFunction.call(buffer, byteOffset);
    } else {
      throw new Error(`Unsupported datatype: ${datatype}`);
    }
  }

  private async exportToJson(
    devices: {
      deviceName: string;
      members: { label: string; value: string; unit: string }[];
    }[],
  ) {
    try {
      const jsonData = JSON.stringify(devices, null, 2);
      const modbusData = path.resolve('src/modbus', 'modbusData.json');
      await fsPromises.writeFile(modbusData, jsonData, 'utf8');
      //console.log('Data exported to modbusData.json successfully.');
    } catch (error) {
      console.error('Error exporting data to modbusData.json:', error);
    }
  }

  private readData = async (client: any, deviceConfig: DeviceConfig) => {
    const device = {
      deviceId: deviceConfig.deviceId,
      deviceName: deviceConfig.deviceName,
      members: [] as { label: string; value: string; unit: string }[],
    };

    for (const address of deviceConfig.addresses) {
      if (address.fc === 3) {
        const resp = await client.client.readHoldingRegisters(
          address.address,
          address.length,
        );
        const modbusValue: number = this.checkDatatype(
          resp.response.body.valuesAsBuffer,
          address.datatype,
          address.swap,
        );
        device.members.push({
          label: address.label,
          value: (modbusValue * address.scale + address.offset).toFixed(3),
          unit: address.unit,
        });
      }
    }
    this.devices[deviceConfig.deviceId] = device;
    this.exportToJson(this.devices);
  };

  private disconnectModbusClients() {
    this.modbusClients.forEach((modbusClient) => {
      try {
        const deviceId: number = modbusClient.deviceConfig.deviceId;
        clearInterval(modbusClient.IntervalByDevice[deviceId]);
        //modbusClient.socket.destroy(); // Close the socket
        modbusClient.socket.end(); // Close the socket
        console.log(
          `Disconnected from ${modbusClient.deviceConfig.host}:${modbusClient.deviceConfig.port}`,
        );
      } catch (error) {
        console.error(
          `Error disconnecting from ${modbusClient.deviceConfig.host}:${modbusClient.deviceConfig.port}:`,
          error,
        );
      }
    });
    // Clear the modbusClients array
    this.modbusClients = [];
  }

  private disconnectModbusClient(id: number) {
    try {
      const deviceId: number = this.modbusClients[id].deviceConfig.deviceId;
      clearInterval(this.modbusClients[id].IntervalByDevice[deviceId]);
      //modbusClient.socket.destroy(); // Close the socket
      this.modbusClients[id].socket.end(); // Close the socket
      console.log(
        `Disconnected from ${this.modbusClients[id].deviceConfig.host}:${this.modbusClients[id].deviceConfig.port}`,
      );
    } catch (error) {
      console.error(
        `Error disconnecting from ${this.modbusClients[id].deviceConfig.host}:${this.modbusClients[id].deviceConfig.port}:`,
        error,
      );
    }
    // Clear the modbusClients array
    this.modbusClients[id] = null;
  }

  // -- Service --
  async readDevices() {
    try {
      await this.initialize();
    } catch (error) {
      console.error('Error initialize:', error);
    }

    if (!this.modbusClients.length) {
      console.error('No Modbus clients available.');
      return;
    }

    this.modbusClients.forEach((modbusClient) => {
      const deviceId: number = modbusClient.deviceConfig.deviceId;
      modbusClient.IntervalByDevice[deviceId] = setInterval(async () => {
        try {
          await this.readData(modbusClient, modbusClient.deviceConfig);
        } catch (error) {
          console.error(
            'Error reading data device name:',
            modbusClient.deviceConfig.deviceName,
            error,
          );
        }
      }, modbusClient.deviceConfig.interval);
    });
  }
  async disconnectAllDevices() {
    try {
      this.disconnectModbusClients();
      console.log('All Modbus clients disconnected.');
    } catch (error) {
      console.error('Error disconnecting Modbus clients:', error);
    }
  }
  async disconnectByDevice(id: number) {
    try {
      this.disconnectModbusClient(id);
      console.log(`Modbus device id: ${id} disconnected.`);
    } catch (error) {
      console.error(`Error disconnecting Modbus device id: ${id}`, error);
    }
  }
}
