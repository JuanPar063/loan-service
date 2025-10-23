import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LoanService } from './application/services/loan.service';
import { LoanController } from './infrastructure/adapters/in/loan.controller';
import { LoanTypeormRepository } from './infrastructure/adapters/out/repositories/loan-typeorm.repository';
import { PaymentTypeormRepository } from './infrastructure/adapters/out/repositories/payment-typeorm.repository';
import { SeedRepository } from './infrastructure/adapters/out/repositories/seed.repository';
import { UserExternalAdapter } from './infrastructure/adapters/out/user-external.adapter';
import { HttpModule } from '@nestjs/axios';
import { typeOrmConfig } from './infrastructure/config/database.config';
import { LoanOrmEntity } from './infrastructure/entities/loan.orm-entity';
import { PaymentOrmEntity } from './infrastructure/entities/payment.orm-entity';
import { LoanTypeOrmEntity } from './infrastructure/entities/loan-type.orm-entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot(typeOrmConfig),
    TypeOrmModule.forFeature([LoanOrmEntity, PaymentOrmEntity, LoanTypeOrmEntity]),
    HttpModule,
  ],
  controllers: [LoanController],
  providers: [
    LoanService,
    SeedRepository,
    { provide: 'LoanRepositoryPort', useClass: LoanTypeormRepository },
    { provide: 'PaymentRepositoryPort', useClass: PaymentTypeormRepository },
    { provide: 'UserExternalPort', useClass: UserExternalAdapter },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seedRepository: SeedRepository) {}

  async onModuleInit() {
    await this.seedRepository.seedLoanTypes();
  }
}