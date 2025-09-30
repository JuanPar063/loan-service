// ...existing code...
import { Module } from '@nestjs/common';
import { LoanService } from './application/services/loan.service';
import { LoanController } from './infrastructure/adapters/in/loan.controller';
import { InMemoryLoanRepository } from './infrastructure/adapters/out/repositories/loan.repository';
import { InMemoryPaymentRepository } from './infrastructure/adapters/out/repositories/payment.repository';
import { UserExternalAdapter } from './infrastructure/adapters/out/user-external.adapter';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [LoanController],
  providers: [
    LoanService,
    // Registra el repo en memoria bajo un token. Ajusta la inyección en LoanService si usas otro token.
    { provide: 'LoanRepositoryPort', useClass: InMemoryLoanRepository },
    { provide: 'PaymentRepositoryPort', useClass: InMemoryPaymentRepository },
    { provide: 'UserExternalPort', useClass: UserExternalAdapter },
  ],
})
export class AppModule {}
// ...existing code...