import { Loan } from '../../entities/loan.entity';

export interface LoanRepositoryPort {
  create(loanData: { userId: string; amount: number; termMonths: number }): Promise<Loan>;
  findById(id: string): Promise<Loan | null>;
  findAllByUser(userId: string): Promise<Loan[]>;
}