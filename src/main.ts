import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser'
require("randomstring");

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    allowedHeaders: ['content-type', 'Authorization'],
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:4000',
    credentials: true,
  });
  app.use(cookieParser());
  await app.listen(process.env.PORT || 3000, "0.0.0.0");
}
bootstrap();
