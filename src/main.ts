import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser'
require("randomstring");

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    allowedHeaders: ['content-type', 'Authorization'],
    origin: 'http://localhost:4000',
    credentials: true,
  });
  app.enableCors({
    allowedHeaders: ['content-type', 'Authorization'],
    origin: 'https://edlabs.netlify.app',
    credentials: true,
  });
  app.use(cookieParser());
  await app.listen(process.env.PORT || 3000, "0.0.0.0");
}
bootstrap();
