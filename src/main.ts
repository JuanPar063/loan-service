import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Loan Service')
    .setDescription('Documentación automática con Swagger para Loan Service')
    .setVersion('1.0')
    .addBearerAuth() // Soporte para JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 5000);
  console.log(
    `🚀 Loan Service running on http://localhost:${process.env.PORT ?? 5000}`,
  );
  console.log(
    `📖 Swagger docs available at http://localhost:${process.env.PORT ?? 5000}/api/docs`,
  );
}
bootstrap();
