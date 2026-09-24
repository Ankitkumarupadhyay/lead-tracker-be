import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import express, { Express, Request, Response } from 'express';
import { AppModule } from './src/app.module.js';

const server: Express = express();
let app: INestApplication | null = null;

export async function bootstrapServer(): Promise<Express> {
  if (!app) {
    app = await NestFactory.create(AppModule, new ExpressAdapter(server));

    const configService = app.get(ConfigService);
    const frontendUrl = configService.get<string>('FRONTEND_URL') || process.env.FRONTEND_URL;
    const allowedOrigins = frontendUrl
      ? frontendUrl.split(',').map((url) => url.trim())
      : true;

    // Enable Cross-Origin Resource Sharing for frontend
    app.enableCors({
      origin: allowedOrigins,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    // Global API routing prefix
    app.setGlobalPrefix('api');

    // Global DTO validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
  }
  return server;
}

export default async function handler(req: Request, res: Response) {
  await bootstrapServer();
  return server(req, res);
}
