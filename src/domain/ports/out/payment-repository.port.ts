import { Payment } from '../../entities/payment.entity';

export interface PaymentRepositoryPort {
  save(payment: Payment): Promise<Payment>;
  findByLoanId(loanId: string): Promise<Payment[]>;
}