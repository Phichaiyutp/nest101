"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.ModbusService = void 0;
var Modbus = require("jsmodbus");
var net = require("net");
var fsPromises = require("fs/promises");
var path = require("path");
var common_1 = require("@nestjs/common");
var ModbusService = /** @class */ (function () {
    function ModbusService() {
        var _this = this;
        this.modbusClients = [];
        this.devices = [];
        this.readData = function (client, deviceConfig) { return __awaiter(_this, void 0, void 0, function () {
            var device, _i, _a, address, resp, modbusValue, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        device = {
                            deviceId: deviceConfig.deviceId,
                            deviceName: deviceConfig.deviceName,
                            deviceGroup: deviceConfig.deviceGroup,
                            stationName: deviceConfig.stationName,
                            host: deviceConfig.host,
                            members: [],
                            ts: Math.floor(Date.now() / 1000)
                        };
                        _i = 0, _a = deviceConfig.addresses;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        address = _a[_i];
                        if (!(address.fc === 3)) return [3 /*break*/, 5];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, client.client.readHoldingRegisters(address.address, address.length)];
                    case 3:
                        resp = _b.sent();
                        modbusValue = this.checkDatatype(resp.response.body.valuesAsBuffer, address.datatype, address.swap);
                        device.members.push({
                            label: address.label,
                            value: (modbusValue * address.scale + address.offset).toFixed(3),
                            unit: address.unit
                        });
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        this.devices[deviceConfig.deviceId] = device;
                        this.exportToJson(this.devices);
                        return [2 /*return*/];
                }
            });
        }); };
    }
    ModbusService.prototype.createModbusClient = function (deviceConfig) {
        var _this = this;
        var socket = new net.Socket();
        var client = new Modbus.client.TCP(socket, deviceConfig.unitId);
        var connectToServer = function () {
            try {
                socket.connect(deviceConfig.port, deviceConfig.host, function () {
                    console.log("Connected to " + deviceConfig.host + ":" + deviceConfig.port + " unitId : " + deviceConfig.unitId);
                });
            }
            catch (error) {
                handleConnectionError(error);
            }
        };
        var handleConnectionError = function (err) {
            console.log("Connection error to " + deviceConfig.host + ":" + deviceConfig.port + ": " + err.message);
            setTimeout(function () {
                connectToServer();
            }, 5000);
        };
        try {
            socket.on('connect_error', handleConnectionError);
            socket.setTimeout(5000);
            socket.on('timeout', function () {
                var errorMessage = "Connection to " + deviceConfig.host + ":" + deviceConfig.port + " timed out.";
                //console.error(errorMessage);
                _this.logErrorToFile(errorMessage);
                // Close the socket and reconnect after a delay
                socket.end();
                setTimeout(function () {
                    connectToServer();
                }, 5000);
            });
            socket.on('close', function () {
                console.log("Connection closed to " + deviceConfig.host + ":" + deviceConfig.port + " unitId : " + deviceConfig.unitId);
            });
            connectToServer(); // Initial connection attempt
        }
        catch (error) {
            var errorMessage = "Error connecting to " + deviceConfig.host + ":" + deviceConfig.port + ":" +
                error;
            //console.error(errorMessage);
            this.logErrorToFile(errorMessage);
        }
        var IntervalByDevice = [];
        return { client: client, socket: socket, deviceConfig: deviceConfig, IntervalByDevice: IntervalByDevice };
    };
    ModbusService.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var config_file, _a, _b, _c, error_2, errorMessage;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        config_file = path.resolve('src/modbus', 'config.json');
                        _a = this;
                        _c = (_b = JSON).parse;
                        return [4 /*yield*/, fsPromises.readFile(config_file, 'utf8')];
                    case 1:
                        _a.config = _c.apply(_b, [_d.sent()]);
                        this.modbusClients = this.config.map(this.createModbusClient);
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _d.sent();
                        errorMessage = 'Error initializing Modbus service:' + error_2;
                        //console.error(errorMessage);
                        this.logErrorToFile(errorMessage);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ModbusService.prototype.reReadConfig = function (index) {
        return __awaiter(this, void 0, void 0, function () {
            var config_file, _a, _b, _c, error_3, errorMessage;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        config_file = path.resolve('src/modbus', 'config.json');
                        _a = this;
                        _c = (_b = JSON).parse;
                        return [4 /*yield*/, fsPromises.readFile(config_file, 'utf8')];
                    case 1:
                        _a.config = _c.apply(_b, [_d.sent()]);
                        this.modbusClients[index] = this.createModbusClient(this.config[index]);
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _d.sent();
                        errorMessage = 'Error initializing Modbus service:' + error_3;
                        //console.error(errorMessage);
                        this.logErrorToFile(errorMessage);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ModbusService.prototype.checkDatatype = function (buffer, datatype, swap) {
        var byteOffset = 0;
        var readFunction;
        switch (swap) {
            case 'BE':
                readFunction = buffer["read" + datatype + "BE"];
                break;
            case 'LE':
                readFunction = buffer["read" + datatype + "LE"];
                break;
            case 'null':
                readFunction = buffer["read" + datatype];
                break;
            default:
                break;
        }
        if (readFunction) {
            return readFunction.call(buffer, byteOffset);
        }
        else {
            throw new Error("Unsupported datatype: " + datatype);
        }
    };
    ModbusService.prototype.logErrorToFile = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, errorMessage, logFilePath, logError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        timestamp = new Date().toISOString();
                        errorMessage = void 0;
                        if (typeof error === 'object') {
                            errorMessage = timestamp + ": " + JSON.stringify(error) + "\n";
                        }
                        else {
                            errorMessage = timestamp + ": " + error + "\n";
                        }
                        logFilePath = path.resolve('src/modbus', 'error.log');
                        return [4 /*yield*/, fsPromises.appendFile(logFilePath, errorMessage)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        logError_1 = _a.sent();
                        console.error('Error writing to log file:', logError_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ModbusService.prototype.exportToJson = function (devices) {
        return __awaiter(this, void 0, void 0, function () {
            var jsonData, modbusData, error_4, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        jsonData = JSON.stringify(devices, null, 2);
                        modbusData = path.resolve('src/modbus', 'modbusData.json');
                        return [4 /*yield*/, fsPromises.writeFile(modbusData, jsonData, 'utf8')];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        errorMessage = 'Error exporting data to modbusData.json:' + error_4;
                        this.logErrorToFile(errorMessage);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ModbusService.prototype.disconnectModbusClients = function () {
        var _this = this;
        this.modbusClients.forEach(function (modbusClient) {
            try {
                clearInterval(modbusClient.IntervalByDevice[modbusClient.deviceConfig.deviceId]);
                modbusClient.socket.end();
                console.log("Disconnected from " + modbusClient.deviceConfig.host + ":" + modbusClient.deviceConfig.port);
            }
            catch (error) {
                var errorMessage = "Error disconnecting from " + modbusClient.deviceConfig.host + ":" + modbusClient.deviceConfig.port + ":" +
                    error;
                _this.logErrorToFile(errorMessage);
                //console.error(errorMessage);
            }
        });
        this.modbusClients = [];
    };
    ModbusService.prototype.disconnectModbusClient = function (id) {
        try {
            clearInterval(this.modbusClients[id].IntervalByDevice[id]);
            this.modbusClients[id].socket.end();
            console.log("Disconnected from " + this.modbusClients[id].deviceConfig.host + ":" + this.modbusClients[id].deviceConfig.port);
        }
        catch (error) {
            var errorMessage = "Error disconnecting from " + this.modbusClients[id].deviceConfig.host + ":" + this.modbusClients[id].deviceConfig.port + ":" +
                error;
            this.logErrorToFile(errorMessage);
            //console.error(errorMessage);
        }
    };
    // -- Service --
    ModbusService.prototype.readDevices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var errorCounts_1, promises, error_5, errorMessage;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.initialize()];
                    case 1:
                        _a.sent();
                        if (!this.modbusClients.length) {
                            //console.error('No Modbus clients available.');
                            this.logErrorToFile('No Modbus clients available.');
                            return [2 /*return*/];
                        }
                        errorCounts_1 = Array(this.modbusClients.length).fill(0);
                        promises = this.modbusClients.map(function (modbusClient, index) {
                            return new Promise(function (resolve, reject) {
                                var intervalId = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                                    var error_6, customError;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                _a.trys.push([0, 2, , 3]);
                                                return [4 /*yield*/, this.readData(modbusClient, modbusClient.deviceConfig)];
                                            case 1:
                                                _a.sent();
                                                resolve();
                                                return [3 /*break*/, 3];
                                            case 2:
                                                error_6 = _a.sent();
                                                customError = {
                                                    info: {
                                                        deviceId: modbusClient.deviceConfig.deviceId,
                                                        deviceName: modbusClient.deviceConfig.deviceName,
                                                        deviceGroup: modbusClient.deviceConfig.deviceGroup,
                                                        stationName: modbusClient.deviceConfig.stationName,
                                                        host: modbusClient.deviceConfig.host,
                                                        port: modbusClient.deviceConfig.port
                                                    },
                                                    error: error_6
                                                };
                                                //console.error(customError);
                                                console.error(errorCounts_1[index]);
                                                errorCounts_1[index]++;
                                                // Check if the maximum error count is can't read modbus
                                                if (errorCounts_1[index] >= 10) {
                                                    this.logErrorToFile(customError);
                                                    this.disconnectModbusClient(modbusClient.deviceConfig.deviceId);
                                                    //reconnect modbus
                                                    this.reReadConfig(index);
                                                    reject(customError);
                                                }
                                                return [3 /*break*/, 3];
                                            case 3: return [2 /*return*/];
                                        }
                                    });
                                }); }, modbusClient.deviceConfig.interval);
                                modbusClient.IntervalByDevice[modbusClient.deviceConfig.deviceId] =
                                    intervalId;
                            });
                        });
                        return [2 /*return*/, Promise.all(promises)];
                    case 2:
                        error_5 = _a.sent();
                        errorMessage = 'Error in readDevices:' + error_5;
                        this.logErrorToFile(errorMessage);
                        //console.error(errorMessage);
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ModbusService.prototype.disconnectAllDevices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var errorMessage;
            return __generator(this, function (_a) {
                try {
                    this.disconnectModbusClients();
                    console.log('All Modbus clients disconnected.');
                }
                catch (error) {
                    errorMessage = 'Error disconnecting Modbus clients:' + error;
                    this.logErrorToFile(errorMessage);
                    //console.error(errorMessage);
                }
                return [2 /*return*/];
            });
        });
    };
    ModbusService.prototype.disconnectByDevice = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var errorMessage;
            return __generator(this, function (_a) {
                try {
                    this.disconnectModbusClient(id);
                    console.log("Modbus device id: " + id + " disconnected.");
                }
                catch (error) {
                    errorMessage = "Error disconnecting Modbus device id: " + id + error;
                    this.logErrorToFile(errorMessage);
                    //console.error(errorMessage);
                }
                return [2 /*return*/];
            });
        });
    };
    ModbusService = __decorate([
        common_1.Injectable()
    ], ModbusService);
    return ModbusService;
}());
exports.ModbusService = ModbusService;
