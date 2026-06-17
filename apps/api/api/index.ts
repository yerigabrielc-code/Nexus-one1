// Entrypoint serverless para Vercel. Inicializa NestJS sobre Express una sola vez
// (cacheado entre invocaciones del mismo contenedor) y exporta el handler HTTP.
// Importa desde ../dist (compilado por `nest build`) para conservar la metadata de
// decoradores (la DI de Nest la necesita).
import express from 'express';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../dist/app.module.js';

let cachedApp: express.Express | null = null;

async function bootstrap(): Promise<express.Express> {
  if (cachedApp) return cachedApp;
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    cors: {
      origin: (process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(','),
      credentials: true,
    },
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  await app.init();
  cachedApp = expressApp;
  return expressApp;
}

export default async function handler(req: express.Request, res: express.Response) {
  const app = await bootstrap();
  return app(req, res);
}
