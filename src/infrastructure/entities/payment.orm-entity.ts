import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { LoanOrmEntity } from './loan.orm-entity';

@Entity('payments')
export class PaymentOrmEntity {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => LoanOrmEntity)
  @JoinColumn({ name: 'loanId' })
  loan: LoanOrmEntity;

  @Column()
  loanId: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  amountPaid: number;

  @Column('decimal', { precision: 10, scale: 2 })
  interestCharged: number;

  @Column('decimal', { precision: 10, scale: 2 })
  capitalPayment: number;

  @Column('decimal', { precision: 10, scale: 2 })
  remainingBalance: number;
}