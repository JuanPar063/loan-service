import { Injectable } from '@nestjs/common';
import { Payment } from '../../../../domain/entities/payment.entity';
import { PaymentRepositoryPort } from '../../../../domain/ports/out/payment-repository.port';

@Injectable()
export class InMemoryPaymentRepository implements PaymentRepositoryPort {
  private store: Payment[] = [];

  async save(payment: Payment): Promise<Payment> {
    const existingIndex = this.store.findIndex(p => p.id === payment.id);
    if (existingIndex >= 0) {
      this.store[existingIndex] = payment;
    } else {
      this.store.push(payment);
    }
    return payment;
  }

  async findByLoanId(loanId: string): Promise<Payment[]> {
    return this.store.filter(p => p.loanId === loanId);
  }
}