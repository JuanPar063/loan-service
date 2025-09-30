import { Loan } from '../../entities/loan.entity';

export interface LoanRepositoryPort {
  save(loan: Loan): Promise<Loan>;
  findById(id: string): Promise<Loan | null>;
  findAllByUser(userId: string): Promise<Loan[]>;
  findAll(): Promise<Loan[]>;
}