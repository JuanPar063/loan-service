import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanRepositoryPort } from '../../../../domain/ports/out/loan-repository.port';
import { Loan } from '../../../../domain/entities/loan.entity';
import { LoanOrmEntity } from '../../../entities/loan.orm-entity';
import { LoanTypeOrmEntity } from '../../../entities/loan-type.orm-entity';

@Injectable()
export class LoanTypeormRepository implements LoanRepositoryPort {
  constructor(
    @InjectRepository(LoanOrmEntity)
    private readonly loanRepository: Repository<LoanOrmEntity>,
    @InjectRepository(LoanTypeOrmEntity)
    private readonly loanTypeRepository: Repository<LoanTypeOrmEntity>,
  ) {}

  async save(loan: Loan): Promise<Loan> {
    const loanType = await this.loanTypeRepository.findOne({ where: { id: loan.type.id } });
    if (!loanType) {
      throw new Error(`Loan type ${loan.type.id} not found`);
    }

    const loanEntity = this.loanRepository.create({
      id: loan.id,
      userId: loan.userId,
      amount: loan.amount,
      interestRate: loan.interestRate,
      status: loan.status,
      typeId: loan.type.id,
      termMonths: loan.termMonths,
      installmentValue: loan.installmentValue,
      paymentFrequency: loan.paymentFrequency,
      createdAt: loan.createdAt,
      approvedAt: loan.approvedAt,
      remainingBalance: loan.remainingBalance,
    });

    await this.loanRepository.save(loanEntity);
    return loan;
  }

  async findById(id: string): Promise<Loan | null> {
    const loanEntity = await this.loanRepository.findOne({
      where: { id },
      relations: ['type'],
    });
    if (!loanEntity) return null;

    return new Loan(
      loanEntity.id,
      loanEntity.userId,
      loanEntity.amount,
      loanEntity.interestRate,
      loanEntity.status as any,
      {
        id: loanEntity.type.id,
        name: loanEntity.type.name,
        description: loanEntity.type.description,
      },
      loanEntity.termMonths,
      loanEntity.installmentValue,
      loanEntity.paymentFrequency as any,
      loanEntity.createdAt,
      loanEntity.approvedAt,
      loanEntity.remainingBalance,
    );
  }

  async findAllByUser(userId: string): Promise<Loan[]> {
    const loanEntities = await this.loanRepository.find({
      where: { userId },
      relations: ['type'],
    });

    return loanEntities.map(entity => new Loan(
      entity.id,
      entity.userId,
      entity.amount,
      entity.interestRate,
      entity.status as any,
      {
        id: entity.type.id,
        name: entity.type.name,
        description: entity.type.description,
      },
      entity.termMonths,
      entity.installmentValue,
      entity.paymentFrequency as any,
      entity.createdAt,
      entity.approvedAt,
      entity.remainingBalance,
    ));
  }

  async findAll(): Promise<Loan[]> {
    const loanEntities = await this.loanRepository.find({
      relations: ['type'],
    });

    return loanEntities.map(entity => new Loan(
      entity.id,
      entity.userId,
      entity.amount,
      entity.interestRate,
      entity.status as any,
      {
        id: entity.type.id,
        name: entity.type.name,
        description: entity.type.description,
      },
      entity.termMonths,
      entity.installmentValue,
      entity.paymentFrequency as any,
      entity.createdAt,
      entity.approvedAt,
      entity.remainingBalance,
    ));
  }
}