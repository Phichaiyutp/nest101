import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // You might want to perform additional actions here, such as logging or cleanup.
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // You might want to perform additional actions here, such as logging or cleanup.
});
