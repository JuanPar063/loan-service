// ...existing code...
import { Module } from '@nestjs/common';
import { LoanService } from './application/services/loan.service';
import { LoanController } from './infrastructure/adapters/in/loan.controller';
import { InMemoryLoanRepository } from './infrastructure/adapters/out/repositories/loan.repository';

@Module({
  imports: [],
  controllers: [LoanController],
  providers: [
    LoanService,
    // Registra el repo en memoria bajo un token. Ajusta la inyección en LoanService si usas otro token.
    { provide: 'LoanRepositoryPort', useClass: InMemoryLoanRepository },
  ],
})
export class AppModule {}
// ...existing code...