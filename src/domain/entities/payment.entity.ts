// loan-service/src/domain/entities/payment.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Loan } from './loan.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'loan_id' })
  loanId: string;

  @ManyToOne(() => Loan, loan => loan.payments)
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'amount_paid' })
  amountPaid: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'interest_charged' })
  interestCharged: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'capital_payment' })
  capitalPayment: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'remaining_balance' })
  remainingBalance: number;

  @CreateDateColumn({ name: 'payment_date' })
  date: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}