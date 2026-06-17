import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // CORS con credenciales para que el navegador envíe/reciba cookies httpOnly.
    cors: {
      origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(','),
      credentials: true,
    },
  });
  app.use(cookieParser());
  // La validación de entrada se hace con ZodValidationPipe por endpoint
  // (contratos compartidos en @nexus/contracts), no con class-validator.
  app.setGlobalPrefix('api/v1');
  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 Nexus One API en http://localhost:${port}/api/v1`);
}
bootstrap();
