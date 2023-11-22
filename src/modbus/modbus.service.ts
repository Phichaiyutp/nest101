import * as Modbus from 'jsmodbus';
import * as net from 'net';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { Injectable } from '@nestjs/common';

interface DeviceConfig {
  deviceId: number;
  deviceName: string;
  deviceGroup: string;
  stationName: string;
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

    const connectToServer = () => {
      try {
        socket.connect(deviceConfig.port, deviceConfig.host, () => {
          console.log(`Connected to ${deviceConfig.host}:${deviceConfig.port} unitId : ${deviceConfig.unitId}`);
        });
      } catch (error) {
        handleConnectionError(error);
      }
    };
    
    const handleConnectionError = (err: { message: any }) => {
      console.log(`Connection error to ${deviceConfig.host}:${deviceConfig.port}: ${err.message}`);
      setTimeout(() => {
        connectToServer();
      }, 5000);
    };

    try {
      socket.on('connect_error', handleConnectionError);

      socket.setTimeout(5000);
      socket.on('timeout', () => {
        const errorMessage = `Connection to ${deviceConfig.host}:${deviceConfig.port} timed out.`;
        //console.error(errorMessage);
        this.logErrorToFile(errorMessage);

        // Close the socket and reconnect after a delay
        socket.end();
        setTimeout(() => {
          connectToServer();
        }, 5000);
      });

      socket.on('close', () => {
        console.log(`Connection closed to ${deviceConfig.host}:${deviceConfig.port} unitId : ${deviceConfig.unitId}`);
      });

      connectToServer(); // Initial connection attempt
    } catch (error) {
      const errorMessage =
        `Error connecting to ${deviceConfig.host}:${deviceConfig.port}:` +
        error;
      //console.error(errorMessage);
      this.logErrorToFile(errorMessage);
    }

    const IntervalByDevice: NodeJS.Timeout[] = [];
    return { client, socket, deviceConfig, IntervalByDevice };
  }

  private async initialize() {
    try {
      const config_file = path.resolve('src/modbus', 'config.json');
      this.config = JSON.parse(await fsPromises.readFile(config_file, 'utf8'));
      this.modbusClients = this.config.map(this.createModbusClient);
    } catch (error) {
      const errorMessage = 'Error initializing Modbus service:' + error;
      //console.error(errorMessage);
      this.logErrorToFile(errorMessage);
    }
  }

  private async reReadConfig(index:number) {
    try {
      const config_file = path.resolve('src/modbus', 'config.json');
      this.config = JSON.parse(await fsPromises.readFile(config_file, 'utf8'));
      this.modbusClients[index] = this.createModbusClient(this.config[index]);
    } catch (error) {
      const errorMessage = 'Error initializing Modbus service:' + error;
      //console.error(errorMessage);
      this.logErrorToFile(errorMessage);
    }
  }

  private checkDatatype(
    buffer: Buffer,
    datatype: string,
    swap: string,
  ): number {
    const byteOffset = 0;
    let readFunction: { call: (arg0: Buffer, arg1: number) => number };
    switch (swap) {
      case 'BE':
        readFunction = buffer[`read${datatype}BE`];
        break;
      case 'LE':
        readFunction = buffer[`read${datatype}LE`];
        break;
      case 'null':
        readFunction = buffer[`read${datatype}`];
        break;
      default:
        break;
    }
    if (readFunction) {
      return readFunction.call(buffer, byteOffset);
    } else {
      throw new Error(`Unsupported datatype: ${datatype}`);
    }
  }

  private async logErrorToFile(error: any) {
    try {
      const timestamp = new Date().toISOString();
      let errorMessage: string;

      if (typeof error === 'object') {
        errorMessage = `${timestamp}: ${JSON.stringify(error)}\n`;
      } else {
        errorMessage = `${timestamp}: ${error}\n`;
      }

      const logFilePath = path.resolve('src/modbus', 'error.log');
      await fsPromises.appendFile(logFilePath, errorMessage);
    } catch (logError) {
      console.error('Error writing to log file:', logError);
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
      const errorMessage = 'Error exporting data to modbusData.json:' + error;
      this.logErrorToFile(errorMessage);
      //console.error(errorMessage);
    }
  }

  private readData = async (client: any, deviceConfig: DeviceConfig) => {
    const device = {
      deviceId: deviceConfig.deviceId,
      deviceName: deviceConfig.deviceName,
      deviceGroup: deviceConfig.deviceGroup,
      stationName: deviceConfig.stationName,
      host: deviceConfig.host,
      members: [] as { label: string; value: string; unit: string }[],
      ts: Math.floor(Date.now() / 1000),
    };

    for (const address of deviceConfig.addresses) {
      if (address.fc === 3) {
        try {
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
      } catch(error){
        /*
        const customError = {
          info: {
            deviceId: deviceConfig.deviceId,
            deviceName: deviceConfig.deviceName,
            deviceGroup: deviceConfig.deviceGroup,
            stationName: deviceConfig.stationName,
            host: deviceConfig.host,
            port: deviceConfig.port,
            label: address.label,
          },
          error: error,
        };
          console.error(customError);
          this.logErrorToFile(customError);
          */
      }
      }
    }
    this.devices[deviceConfig.deviceId] = device;
    this.exportToJson(this.devices);
  };

  private disconnectModbusClients() {
    this.modbusClients.forEach((modbusClient) => {
      try {
        clearInterval(
          modbusClient.IntervalByDevice[modbusClient.deviceConfig.deviceId],
        );
        modbusClient.socket.end();
        console.log(
          `Disconnected from ${modbusClient.deviceConfig.host}:${modbusClient.deviceConfig.port}`,
        );
      } catch (error) {
        const errorMessage =
          `Error disconnecting from ${modbusClient.deviceConfig.host}:${modbusClient.deviceConfig.port}:` +
          error;
        this.logErrorToFile(errorMessage);
        //console.error(errorMessage);
      }
    });
    this.modbusClients = [];
  }

  private disconnectModbusClient(id: number) {
    try {
      clearInterval(this.modbusClients[id].IntervalByDevice[id]);
      this.modbusClients[id].socket.end();
      console.log(
        `Disconnected from ${this.modbusClients[id].deviceConfig.host}:${this.modbusClients[id].deviceConfig.port}`,
      );
    } catch (error) {
      const errorMessage =
        `Error disconnecting from ${this.modbusClients[id].deviceConfig.host}:${this.modbusClients[id].deviceConfig.port}:` +
        error;
      this.logErrorToFile(errorMessage);
      //console.error(errorMessage);
    }
  }

  // -- Service --
  async readDevices() {
    try {
      await this.initialize();

      if (!this.modbusClients.length) {
        //console.error('No Modbus clients available.');
        this.logErrorToFile('No Modbus clients available.');
        return;
      }
      const errorCounts: number[] = Array(this.modbusClients.length).fill(0);

      const promises = this.modbusClients.map((modbusClient, index) => {
        return new Promise<void>((resolve, reject) => {
          const intervalId = setInterval(async () => {
            try {
              await this.readData(modbusClient, modbusClient.deviceConfig);
              resolve();
            } catch (error) {
              const customError = {
                info: {
                  deviceId: modbusClient.deviceConfig.deviceId,
                  deviceName: modbusClient.deviceConfig.deviceName,
                  deviceGroup: modbusClient.deviceConfig.deviceGroup,
                  stationName: modbusClient.deviceConfig.stationName,
                  host: modbusClient.deviceConfig.host,
                  port: modbusClient.deviceConfig.port,
                },
                error: error,
              };
              //console.error(customError);
              console.error(errorCounts[index]);
              errorCounts[index]++;
              // Check if the maximum error count is can't read modbus
              if (errorCounts[index] >= 10) {
                this.logErrorToFile(customError);
                this.disconnectModbusClient(modbusClient.deviceConfig.deviceId);
                //reconnect modbus
                this.reReadConfig(index);
                reject(customError);
              }
            }
          }, modbusClient.deviceConfig.interval);
          modbusClient.IntervalByDevice[modbusClient.deviceConfig.deviceId] =
            intervalId;
        });
      });
      return Promise.all(promises);
    } catch (error) {
      const errorMessage = 'Error in readDevices:' + error;
      this.logErrorToFile(errorMessage);
      //console.error(errorMessage);
      throw error;
    }
  }

  async disconnectAllDevices() {
    try {
      this.disconnectModbusClients();
      console.log('All Modbus clients disconnected.');
    } catch (error) {
      const errorMessage = 'Error disconnecting Modbus clients:' + error;
      this.logErrorToFile(errorMessage);
      //console.error(errorMessage);
    }
  }

  async disconnectByDevice(id: number) {
    try {
      this.disconnectModbusClient(id);
      console.log(`Modbus device id: ${id} disconnected.`);
    } catch (error) {
      const errorMessage =
        `Error disconnecting Modbus device id: ${id}` + error;
      this.logErrorToFile(errorMessage);
      //console.error(errorMessage);
    }
  }
}
