import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { LoanOrmEntity } from '../entities/loan.orm-entity';
import { PaymentOrmEntity } from '../entities/payment.orm-entity';
import { LoanTypeOrmEntity } from '../entities/loan-type.orm-entity';

dotenv.config();

const config = {
  type: 'postgres' as const,
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'postgres',
  entities: [LoanOrmEntity, PaymentOrmEntity, LoanTypeOrmEntity],
  synchronize: true,
};

console.log('Database connection config:', {
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password ? '[REDACTED]' : undefined,
  database: config.database,
});

export const typeOrmConfig: TypeOrmModuleOptions = config;