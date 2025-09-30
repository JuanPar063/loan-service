import { LoanType } from './loan-type.entity';

export type LoanStatus = 'solicitud' | 'pendiente_aprobacion' | 'aprobado' | 'rechazado' | 'activo' | 'pagado' | 'cancelado';

export type PaymentFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export class Loan {
  id: string;
  userId: string;
  amount: number;
  interestRate: number;
  status: LoanStatus;
  type: LoanType;
  termMonths?: number; // for fixed installments
  installmentValue?: number; // for fixed installments
  paymentFrequency?: PaymentFrequency; // for fixed installments
  createdAt: Date;
  approvedAt?: Date;
  remainingBalance: number;

  constructor(
    id: string,
    userId: string,
    amount: number,
    interestRate: number,
    status: LoanStatus,
    type: LoanType,
    termMonths?: number,
    installmentValue?: number,
    paymentFrequency?: PaymentFrequency,
    createdAt: Date = new Date(),
    approvedAt?: Date,
    remainingBalance: number = amount
  ) {
    this.id = id;
    this.userId = userId;
    this.amount = amount;
    this.interestRate = interestRate;
    this.status = status;
    this.type = type;
    this.termMonths = termMonths;
    this.installmentValue = installmentValue;
    this.paymentFrequency = paymentFrequency;
    this.createdAt = createdAt;
    this.approvedAt = approvedAt;
    this.remainingBalance = remainingBalance;
  }

  calculateInterest(): number {
    return this.remainingBalance * (this.interestRate / 100);
  }

  isMonthlyInterestType(): boolean {
    return this.type.id === 'monthly_interest';
  }

  isFixedInstallmentsType(): boolean {
    return this.type.id === 'fixed_installments';
  }
}