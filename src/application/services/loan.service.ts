import { Injectable } from '@nestjs/common';
import { RequestLoanPort } from '../../domain/ports/in/request-loan.port';
import { LoanRepositoryPort } from '../../domain/ports/out/loan-repository.port';
import { UserExternalPort } from '../../domain/ports/out/user-external.port';
import { Loan } from '../../domain/entities/loan.entity';

@Injectable()
export class LoanService implements RequestLoanPort {
  constructor(
    private readonly loanRepository: LoanRepositoryPort,
    private readonly userExternal: UserExternalPort,
  ) {}

  async requestLoan(loanData: { userId: string; amount: number }): Promise<Loan> {
    const user = await this.userExternal.getUser (loanData.userId);
    if (!user || user.role !== 'client') throw new Error('Invalid user');
    // Lógica simple: Aprobar si amount < 10000
    const loan = new Loan({ ...loanData, interestRate: 5, status: loanData.amount < 10000 ? 'approved' : 'pending' });
    return this.loanRepository.save(loan);
  }
}