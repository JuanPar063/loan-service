import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRepositoryPort } from '../../../../domain/ports/out/payment-repository.port';
import { Payment } from '../../../../domain/entities/payment.entity';
import { PaymentOrmEntity } from '../../../entities/payment.orm-entity';

@Injectable()
export class PaymentTypeormRepository implements PaymentRepositoryPort {
  constructor(
    @InjectRepository(PaymentOrmEntity)
    private readonly paymentRepository: Repository<PaymentOrmEntity>,
  ) {}

  async save(payment: Payment): Promise<Payment> {
    const paymentEntity = this.paymentRepository.create({
      id: payment.id,
      loanId: payment.loanId,
      date: payment.date,
      amountPaid: payment.amountPaid,
      interestCharged: payment.interestCharged,
      capitalPayment: payment.capitalPayment,
      remainingBalance: payment.remainingBalance,
    });

    await this.paymentRepository.save(paymentEntity);
    return payment;
  }

  async findByLoanId(loanId: string): Promise<Payment[]> {
    const paymentEntities = await this.paymentRepository.find({
      where: { loanId },
      order: { date: 'ASC' },
    });

    return paymentEntities.map(entity => new Payment(
      entity.id,
      entity.loanId,
      entity.date,
      entity.amountPaid,
      entity.interestCharged,
      entity.capitalPayment,
      entity.remainingBalance,
    ));
  }
}