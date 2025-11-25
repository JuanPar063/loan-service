// loan-service/src/main.ts

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ CORS CONFIGURADO CORRECTAMENTE
  app.enableCors({
    origin: [
      'http://localhost:3004',  // Frontend React
      'http://localhost:3002',  // Por si acaso
      'http://localhost:3000',  // User service
      'http://localhost:3001',  // Auth service
      'http://localhost:3003',  // Admin service
      'http://localhost:3005',  // Gateway
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Loan Service')
    .setDescription('Documentación automática con Swagger para Loan Service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log('='.repeat(60));
  console.log(`✅ Loan Service running on http://localhost:${port}`);
  console.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
  console.log(`🌐 CORS habilitado para frontend en puerto 3004`);
  console.log('='.repeat(60));
}
bootstrap();