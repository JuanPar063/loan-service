import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { LoanTypeOrmEntity } from './loan-type.orm-entity';

@Entity('loans')
export class LoanOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  userId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  interestRate: number;

  @Column()
  status: string;

  @ManyToOne(() => LoanTypeOrmEntity)
  @JoinColumn({ name: 'typeId' })
  type: LoanTypeOrmEntity;

  @Column()
  typeId: string;

  @Column({ nullable: true })
  termMonths?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  installmentValue?: number;

  @Column({ nullable: true })
  paymentFrequency?: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  remainingBalance: number;
}