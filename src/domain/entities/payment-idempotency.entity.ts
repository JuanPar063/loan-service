// loan-service/src/domain/entities/payment-idempotency.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique, Index } from 'typeorm';

/**
 * Registra la respuesta de un pago para una clave de idempotencia dada, de modo
 * que reintentos con el mismo `Idempotency-Key` (red lenta, doble click) no creen
 * pagos duplicados: se devuelve el pago ya creado.
 */
@Entity('payment_idempotency')
@Unique('uq_loan_idempotency_key', ['loanId', 'idempotencyKey'])
export class PaymentIdempotency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'loan_id' })
  loanId: string;

  @Column({ name: 'idempotency_key' })
  idempotencyKey: string;

  @Column({ name: 'payment_id' })
  paymentId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
