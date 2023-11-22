// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ModbusModule } from './modbus/modbus.module';
import { GraphqlModule } from './graphql/graphql.module';
import { HelloResolver } from './hello/hello.resolver';

@Module({
  imports: [ModbusModule, GraphqlModule],
  controllers: [AppController],
  providers: [AppService, HelloResolver],
})
export class AppModule {}
