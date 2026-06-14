// loan-service/src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { APP_GUARD } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';

import { LoanService } from './application/services/loan.service';
import { LoanController } from './infrastructure/adapters/in/loan.controller';
import { HealthController } from './infrastructure/health/health.controller';
import { Loan } from './domain/entities/loan.entity';
import { Payment } from './domain/entities/payment.entity';
import { PaymentIdempotency } from './domain/entities/payment-idempotency.entity';
import { ProfileExternalAdapter } from './infrastructure/adapters/in/ProfileExternalHTTP';
import { EventsPublisher } from './infrastructure/messaging/events.publisher';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        genReqId: (req) =>
          (req.headers['x-request-id'] as string) ||
          (req.headers['traceparent'] as string) ||
          randomUUID(),
        redact: ['req.headers.authorization'],
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5434', 10),
      username: process.env.DATABASE_USER || 'admin',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'loans-service',
      entities: [Loan, Payment, PaymentIdempotency],
      // En producción NO se sincroniza el esquema automáticamente (usar migraciones).
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([Loan, Payment, PaymentIdempotency]),
    HttpModule,
    TerminusModule,
  ],
  controllers: [LoanController, HealthController],
  providers: [
    LoanService,
    ProfileExternalAdapter,
    EventsPublisher,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [LoanService],
})
export class AppModule {}
