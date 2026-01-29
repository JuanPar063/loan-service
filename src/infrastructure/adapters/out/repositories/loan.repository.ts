import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../../../domain/entities/loan.entity';

@Injectable()
export class LoanRepository {
  constructor(
    @InjectRepository(Loan)
    private readonly repo: Repository<Loan>,
  ) {}

  async findById(id: string): Promise<Loan | null> {
    return this.repo.findOne({ 
      where: { id },
      relations: ['payments'],
    });
  }

  async findAllByUser(userId: string): Promise<Loan[]> {
    return this.repo.find({ where: { userId } });
  }

  async findByUserIdWithPayments(userId: string): Promise<Loan[]> {
    return this.repo.find({
      where: { userId },
      relations: ['payments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<Loan[]> {
    return this.repo.find();
  }

  async findAllWithPayments(): Promise<Loan[]> {
    return this.repo.find({
      relations: ['payments'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPending(page: number, limit: number): Promise<{ loans: Loan[]; total: number }> {
    const [loans, total] = await this.repo.findAndCount({
      where: { status: 'pendiente_aprobacion' },
      relations: ['payments'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { loans, total };
  }

  async save(loan: Loan): Promise<Loan> {
    return this.repo.save(loan);
  }

  async update(id: string, data: Partial<Loan>): Promise<void> {
    await this.repo.update(id, data);
  }
}