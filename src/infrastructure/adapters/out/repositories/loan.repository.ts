import { Injectable } from '@nestjs/common';
import { Loan } from '../../../../domain/entities/loan.entity';
import { LoanRepositoryPort } from '../../../../domain/ports/out/loan-repository.port';

@Injectable()
export class InMemoryLoanRepository implements LoanRepositoryPort {
  private store: Loan[] = [];

  async save(loan: Loan): Promise<Loan> {
    const existingIndex = this.store.findIndex(l => l.id === loan.id);
    if (existingIndex >= 0) {
      this.store[existingIndex] = loan;
    } else {
      this.store.push(loan);
    }
    return loan;
  }

  async findById(id: string): Promise<Loan | null> {
    return this.store.find(l => l.id === id) ?? null;
  }

  async findAllByUser(userId: string): Promise<Loan[]> {
    return this.store.filter(l => l.userId === userId);
  }

  async findAll(): Promise<Loan[]> {
    return [...this.store];
  }
}