import { Injectable } from '@nestjs/common';
import { RequestLoanPort } from '../../domain/ports/in/request-loan.port';
import { LoanRepositoryPort } from '../../domain/ports/out/loan-repository.port';
import { PaymentRepositoryPort } from '../../domain/ports/out/payment-repository.port';
import { UserExternalPort } from '../../domain/ports/out/user-external.port';
import { Loan } from '../../domain/entities/loan.entity';
import { Payment } from '../../domain/entities/payment.entity';
import { LoanType } from '../../domain/entities/loan-type.entity';

@Injectable()
export class LoanService implements RequestLoanPort {
  constructor(
    private readonly loanRepository: LoanRepositoryPort,
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly userExternal: UserExternalPort,
  ) {}

  async requestLoan(loanData: { userId: string; amount: number; typeId: string }): Promise<Loan> {
    const user = await this.userExternal.getUser(loanData.userId);
    if (!user || user.role !== 'client') throw new Error('Invalid user');

    const type = loanData.typeId === 'monthly_interest' ? LoanType.MONTHLY_INTEREST : LoanType.FIXED_INSTALLMENTS;

    const loan = new Loan(
      `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      loanData.userId,
      loanData.amount,
      0, // interestRate will be set on approval
      'solicitud',
      type
    );

    return this.loanRepository.save(loan);
  }

  async approveLoan(loanId: string, approvalData: { interestRate: number; termMonths?: number; installmentValue?: number; paymentFrequency?: string }): Promise<Loan> {
    const loan = await this.loanRepository.findById(loanId);
    if (!loan || loan.status !== 'pendiente_aprobacion') throw new Error('Loan not found or not pending approval');

    loan.status = 'aprobado';
    loan.interestRate = approvalData.interestRate;
    loan.termMonths = approvalData.termMonths;
    loan.installmentValue = approvalData.installmentValue;
    loan.paymentFrequency = approvalData.paymentFrequency as any;
    loan.approvedAt = new Date();

    return this.loanRepository.save(loan);
  }

  async getLoanById(id: string): Promise<Loan | null> {
    return this.loanRepository.findById(id);
  }
  async rejectLoan(loanId: string): Promise<Loan> {
    const loan = await this.loanRepository.findById(loanId);
    if (!loan || loan.status !== 'pendiente_aprobacion') throw new Error('Loan not found or not pending approval');

    loan.status = 'rechazado';
    return this.loanRepository.save(loan);
  }
  async makePayment(loanId: string, amount: number): Promise<Payment> {
    const loan = await this.loanRepository.findById(loanId);
    if (!loan || loan.status !== 'activo') throw new Error('Loan not found or not active');

    const interestCharged = loan.calculateInterest();
    let capitalPayment = amount - interestCharged;
    if (capitalPayment < 0) capitalPayment = 0; // if amount < interest, all to interest

    if (capitalPayment > loan.remainingBalance) capitalPayment = loan.remainingBalance;

    const remainingBalance = loan.remainingBalance - capitalPayment;

    const payment = new Payment(
      `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      loanId,
      new Date(),
      amount,
      interestCharged,
      capitalPayment,
      remainingBalance
    );

    loan.remainingBalance = remainingBalance;
    if (remainingBalance <= 0) {
      loan.status = 'pagado';
    }

    await this.loanRepository.save(loan);
    return this.paymentRepository.save(payment);
  }

  async getBalance(userId: string): Promise<{ totalLoans: number; totalPaid: number }> {
    const loans = await this.loanRepository.findAllByUser(userId);
    const totalLoans = loans.reduce((sum, loan) => sum + loan.amount, 0);

    const paymentsPromises = loans.map(loan => this.paymentRepository.findByLoanId(loan.id));
    const paymentsArrays = await Promise.all(paymentsPromises);
    const totalPaid = paymentsArrays.flat().reduce((sum, payment) => sum + payment.capitalPayment, 0);

    return { totalLoans, totalPaid };
  }

  async getPaymentsByLoan(loanId: string): Promise<Payment[]> {
    return this.paymentRepository.findByLoanId(loanId);
  }

  async getLoansByUser(userId: string): Promise<Loan[]> {
    return this.loanRepository.findAllByUser(userId);
  }

  async getAllLoans(): Promise<Loan[]> {
    return this.loanRepository.findAll();
  }
}