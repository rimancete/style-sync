import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // Global API prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: 422,
    }),
  );

  // Swagger documentation setup
  if (
    process.env.SWAGGER_ENABLED === 'true' ||
    process.env.NODE_ENV === 'development'
  ) {
    const config = new DocumentBuilder()
      .setTitle(process.env.SWAGGER_TITLE || 'StyleSync API')
      .setDescription(
        process.env.SWAGGER_DESCRIPTION ||
          'Multi-location barbershop booking system API',
      )
      .setVersion(process.env.SWAGGER_VERSION || '1.0')
      .addTag('Health & Monitoring', 'Application and system health endpoints')
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Tenants', 'Branch/location management')
      .addTag('Professionals', 'Staff management')
      .addTag('Services', 'Service catalog and pricing')
      .addTag('Bookings', 'Appointment booking system')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'StyleSync API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });

    logger.log('📚 Swagger documentation is available at: /api/docs');
  }

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);

  logger.log(`🚀 StyleSync API is running on: http://localhost:${port}/api`);
  if (
    process.env.SWAGGER_ENABLED === 'true' ||
    process.env.NODE_ENV === 'development'
  ) {
    logger.log(`📖 API Documentation: http://localhost:${port}/api/docs`);
  }
}

void bootstrap();
