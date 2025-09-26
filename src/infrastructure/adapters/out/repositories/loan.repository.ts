import { Injectable } from '@nestjs/common';
import { Loan } from '../../../../domain/entities/loan.entity';
import { LoanRepositoryPort } from '../../../../domain/ports/out/loan-repository.port';

@Injectable()
export class InMemoryLoanRepository implements LoanRepositoryPort {
  private store: Loan[] = [];

  async create(loanData: { userId: string; amount: number; termMonths: number }): Promise<Loan> {
    const id = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const loan = new Loan({
      id,
      userId: loanData.userId,
      amount: loanData.amount,
      termMonths: loanData.termMonths,
      interestRate: 0.05,
      status: 'pending',
      createdAt: new Date(),
    } as Partial<Loan>);
    this.store.push(loan);
    return loan;
  }

  async findById(id: string): Promise<Loan | null> {
    return this.store.find(l => l.id === id) ?? null;
  }

  async findAllByUser(userId: string): Promise<Loan[]> {
    return this.store.filter(l => l.userId === userId);
  }
}