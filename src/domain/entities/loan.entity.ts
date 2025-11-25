// loan-service/src/domain/entities/loan.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Payment } from './payment.entity';

export type LoanStatus = 'solicitud' | 'pendiente_aprobacion' | 'aprobado' | 'rechazado' | 'activo' | 'pagado' | 'cancelado';
export type PaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'interest_rate', default: 0 })
  interestRate: number;

  @Column({ type: 'varchar', length: 50, default: 'solicitud' })
  status: LoanStatus;

  @Column({ type: 'varchar', length: 50, name: 'loan_type' })
  type: string; // 'monthly_interest' | 'fixed_installments'

  @Column({ type: 'int', nullable: true, name: 'term_months' })
  termMonths?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'installment_value' })
  installmentValue?: number;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'payment_frequency' })
  paymentFrequency?: PaymentFrequency;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'remaining_balance' })
  remainingBalance: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'approved_at' })
  approvedAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Payment, payment => payment.loan)
  payments: Payment[];

  // Método para calcular interés mensual
  calculateInterest(): number {
    return Number(this.remainingBalance) * (Number(this.interestRate) / 100);
  }

  isMonthlyInterestType(): boolean {
    return this.type === 'monthly_interest';
  }

  isFixedInstallmentsType(): boolean {
    return this.type === 'fixed_installments';
  }
}