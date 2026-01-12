// loan-service/src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { LoanService } from './application/services/loan.service';
import { LoanController } from './infrastructure/adapters/in/loan.controller';
import { Loan } from './domain/entities/loan.entity';
import { Payment } from './domain/entities/payment.entity';
import { ProfileExternalAdapter } from 'infrastructure/adapters/in/ProfileExteralHTTP';

@Module({
  imports: [
    // Configuración de TypeORM
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5434', 10),
      username: process.env.DATABASE_USER || 'admin',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'loans-service',
      entities: [Loan, Payment],
      synchronize: true, // ⚠️ Solo para desarrollo, desactivar en producción
      logging: process.env.NODE_ENV === 'development',
    }),
    // Registrar las entidades en el módulo
    TypeOrmModule.forFeature([Loan, Payment]),
    HttpModule,
  ],
  controllers: [LoanController],
  providers: [LoanService, ProfileExternalAdapter],
  exports: [LoanService],
})
export class AppModule {}