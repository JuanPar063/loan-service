import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanTypeOrmEntity } from '../../../entities/loan-type.orm-entity';

@Injectable()
export class SeedRepository {
  constructor(
    @InjectRepository(LoanTypeOrmEntity)
    private readonly loanTypeRepository: Repository<LoanTypeOrmEntity>,
  ) {}

  async seedLoanTypes(): Promise<void> {
    const existingTypes = await this.loanTypeRepository.find();
    if (existingTypes.length > 0) return; // Already seeded

    const loanTypes = [
      {
        id: 'monthly_interest',
        name: 'Interés Mensual con Abono a Capital',
        description: 'Préstamo con interés mensual sobre la deuda total, posibilidad de abono a capital.',
      },
      {
        id: 'fixed_installments',
        name: 'Cuotas Fijas',
        description: 'Préstamo a cuotas fijas con cantidad definida de cuotas y frecuencia de pago.',
      },
    ];

    await this.loanTypeRepository.save(loanTypes);
    console.log('Loan types seeded successfully');
  }
}