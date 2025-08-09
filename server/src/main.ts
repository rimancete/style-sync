import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}
void bootstrap();
