import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('loan_types')
export class LoanTypeOrmEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;
}