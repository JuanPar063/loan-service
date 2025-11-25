// loan-service/src/application/services/loan.service.ts

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan } from '../../domain/entities/loan.entity';
import { Payment } from '../../domain/entities/payment.entity';

export interface LoanBalanceDto {
  userId: string;
  totalLoans: number;
  activeLoans: number;
  totalBorrowed: number;
  totalPaid: number;
  totalPending: number;
  loans: LoanDetailDto[];
}

export interface LoanDetailDto {
  id: string;
  amount: number;
  interestRate: number;
  status: string;
  type: string;
  remainingBalance: number;
  totalPaid: number;
  nextPaymentDue?: Date;
  createdAt: Date;
  approvedAt?: Date;
  payments: PaymentDetailDto[];
}

export interface PaymentDetailDto {
  id: string;
  date: Date;
  amountPaid: number;
  interestCharged: number;
  capitalPayment: number;
  remainingBalance: number;
}

@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  /**
   * ✅ NUEVO: Obtiene el balance completo de préstamos de un usuario
   */
  async getLoanBalance(userId: string): Promise<LoanBalanceDto> {
    this.logger.log(`📊 Obteniendo balance para usuario: ${userId}`);

    // Obtener todos los préstamos del usuario con sus pagos
    const loans = await this.loanRepository.find({
      where: { userId },
      relations: ['payments'],
      order: { createdAt: 'DESC' },
    });

    if (loans.length === 0) {
      this.logger.warn(`Usuario ${userId} no tiene préstamos`);
      return {
        userId,
        totalLoans: 0,
        activeLoans: 0,
        totalBorrowed: 0,
        totalPaid: 0,
        totalPending: 0,
        loans: [],
      };
    }

    // Calcular totales
    let totalBorrowed = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let activeLoans = 0;

    const loanDetails: LoanDetailDto[] = loans.map((loan) => {
      const loanAmount = Number(loan.amount);
      const loanPending = Number(loan.remainingBalance);
      
      // Sumar al total prestado
      totalBorrowed += loanAmount;
      totalPending += loanPending;

      // Calcular total pagado en este préstamo
      const loanTotalPaid = loan.payments.reduce(
        (sum, payment) => sum + Number(payment.capitalPayment),
        0,
      );
      totalPaid += loanTotalPaid;

      // Contar préstamos activos
      if (loan.status === 'activo' || loan.status === 'aprobado') {
        activeLoans++;
      }

      // Mapear pagos
      const paymentDetails: PaymentDetailDto[] = loan.payments.map((payment) => ({
        id: payment.id,
        date: payment.date,
        amountPaid: Number(payment.amountPaid),
        interestCharged: Number(payment.interestCharged),
        capitalPayment: Number(payment.capitalPayment),
        remainingBalance: Number(payment.remainingBalance),
      }));

      return {
        id: loan.id,
        amount: loanAmount,
        interestRate: Number(loan.interestRate),
        status: loan.status,
        type: loan.type,
        remainingBalance: loanPending,
        totalPaid: loanTotalPaid,
        createdAt: loan.createdAt,
        approvedAt: loan.approvedAt,
        payments: paymentDetails,
      };
    });

    this.logger.log(`✅ Balance calculado - Prestado: ${totalBorrowed}, Pagado: ${totalPaid}, Pendiente: ${totalPending}`);

    return {
      userId,
      totalLoans: loans.length,
      activeLoans,
      totalBorrowed,
      totalPaid,
      totalPending,
      loans: loanDetails,
    };
  }

  /**
   * Solicita un nuevo préstamo
   */
  async requestLoan(loanData: {
    userId: string;
    amount: number;
    typeId: string;
  }): Promise<Loan> {
    this.logger.log(`🆕 Solicitando préstamo para usuario: ${loanData.userId}`);

    const loan = this.loanRepository.create({
      userId: loanData.userId,
      amount: loanData.amount,
      interestRate: 0,
      status: 'solicitud',
      type: loanData.typeId,
      remainingBalance: loanData.amount,
    });

    return await this.loanRepository.save(loan);
  }

  /**
   * Aprueba un préstamo
   */
  async approveLoan(
    loanId: string,
    approvalData: {
      interestRate: number;
      termMonths?: number;
      installmentValue?: number;
      paymentFrequency?: string;
    },
  ): Promise<Loan> {
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });

    if (!loan) {
      throw new NotFoundException(`Préstamo con ID ${loanId} no encontrado`);
    }

    if (loan.status !== 'solicitud' && loan.status !== 'pendiente_aprobacion') {
      throw new BadRequestException('El préstamo no está en estado de aprobación');
    }

    loan.status = 'activo';
    loan.interestRate = approvalData.interestRate;
    loan.termMonths = approvalData.termMonths;
    loan.installmentValue = approvalData.installmentValue;
    loan.paymentFrequency = approvalData.paymentFrequency as any;
    loan.approvedAt = new Date();

    return await this.loanRepository.save(loan);
  }

  /**
   * Registra un pago
   */
  async makePayment(loanId: string, amount: number): Promise<Payment> {
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });

    if (!loan) {
      throw new NotFoundException(`Préstamo con ID ${loanId} no encontrado`);
    }

    if (loan.status !== 'activo') {
      throw new BadRequestException('El préstamo no está activo');
    }

    const interestCharged = loan.calculateInterest();
    let capitalPayment = amount - interestCharged;
    if (capitalPayment < 0) capitalPayment = 0;

    if (capitalPayment > Number(loan.remainingBalance)) {
      capitalPayment = Number(loan.remainingBalance);
    }

    const remainingBalance = Number(loan.remainingBalance) - capitalPayment;

    const payment = this.paymentRepository.create({
      loanId: loan.id,
      amountPaid: amount,
      interestCharged,
      capitalPayment,
      remainingBalance,
      date: new Date(),
    });

    loan.remainingBalance = remainingBalance;
    if (remainingBalance <= 0) {
      loan.status = 'pagado';
    }

    await this.loanRepository.save(loan);
    return await this.paymentRepository.save(payment);
  }

  /**
   * Obtiene un préstamo por ID
   */
  async getLoanById(id: string): Promise<Loan | null> {
    return await this.loanRepository.findOne({
      where: { id },
      relations: ['payments'],
    });
  }

  /**
   * Obtiene todos los préstamos de un usuario
   */
  async getLoansByUser(userId: string): Promise<Loan[]> {
    return await this.loanRepository.find({
      where: { userId },
      relations: ['payments'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtiene todos los préstamos (para admin)
   */
  async getAllLoans(): Promise<Loan[]> {
    return await this.loanRepository.find({
      relations: ['payments'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Rechaza un préstamo
   */
  async rejectLoan(loanId: string): Promise<Loan> {
    const loan = await this.loanRepository.findOne({ where: { id: loanId } });

    if (!loan) {
      throw new NotFoundException(`Préstamo con ID ${loanId} no encontrado`);
    }

    loan.status = 'rechazado';
    return await this.loanRepository.save(loan);
  }

  /**
   * Obtiene los pagos de un préstamo
   */
  async getPaymentsByLoan(loanId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { loanId },
      order: { date: 'DESC' },
    });
  }
}