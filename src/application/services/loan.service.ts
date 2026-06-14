// loan-service/src/application/services/loan.service.ts

import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Loan, LoanStatus, LoanType } from '../../domain/entities/loan.entity';
import { Payment } from '../../domain/entities/payment.entity';
import { PaymentIdempotency } from '../../domain/entities/payment-idempotency.entity';
import { ProfileExternalAdapter } from '../../infrastructure/adapters/in/ProfileExternalHTTP';
import { EventsPublisher } from '../../infrastructure/messaging/events.publisher';


export interface EnrichedLoanDto extends Omit<Loan, 'calculateInterest' | 'isMonthlyInterestType' | 'isFixedInstallmentsType' | 'canTransitionTo'> {
  user: {
    name: string;
    document: string;
    phone: any;
  };
}

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

export interface EnrichedLoanForAnalysis {
  id: string;
  user_id: string;
  amount: number;
  approved_amount: number;
  interest_rate: number;
  term_months: number;
  status: string;
  remainingBalance: number;
  installmentValue: number;
  totalPaid: number;
  payments: EnrichedPaymentForAnalysis[];
  created_at: Date;
  updated_at: Date;
}

export interface EnrichedPaymentForAnalysis {
  id: string;
  loan_id: string;
  amount: number;
  date: string;      // Fecha en que se realizó el pago (ISO)
  dueDate: string;   // Fecha límite del pago (ISO)
  status: string;
}

@Injectable()
export class LoanService {
  private readonly logger = new Logger(LoanService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentIdempotency)
    private readonly idempotencyRepository: Repository<PaymentIdempotency>,
    private readonly profileExternalAdapter: ProfileExternalAdapter,
    private readonly events: EventsPublisher,
  ) {}

  /** Cambia el estado del préstamo validando la máquina de estados. */
  private transitionStatus(loan: Loan, next: LoanStatus): void {
    if (loan.status === next) return;
    if (!loan.canTransitionTo(next)) {
      throw new BadRequestException(
        `Transición de estado inválida: '${loan.status}' → '${next}'.`,
      );
    }
    loan.status = next;
  }

  /**
   * Devuelve el pago ya registrado para una clave de idempotencia, si existe.
   * Permite que reintentos con el mismo Idempotency-Key no dupliquen pagos.
   */
  private async findIdempotentPayment(
    loanId: string,
    key?: string,
  ): Promise<Payment | null> {
    if (!key) return null;
    const record = await this.idempotencyRepository.findOne({
      where: { loanId, idempotencyKey: key },
    });
    if (!record) return null;
    this.logger.warn(
      `↩️ Pago idempotente reutilizado (loan ${loanId}, key ${key}) → payment ${record.paymentId}`,
    );
    return this.paymentRepository.findOne({ where: { id: record.paymentId } });
  }

  /** Persiste el vínculo (loanId, key) → paymentId para futuros reintentos. */
  private async recordIdempotency(
    loanId: string,
    key: string | undefined,
    paymentId: string,
  ): Promise<void> {
    if (!key) return;
    try {
      await this.idempotencyRepository.save(
        this.idempotencyRepository.create({ loanId, idempotencyKey: key, paymentId }),
      );
    } catch (err) {
      // Una violación de unicidad aquí significa que otro request concurrente ya
      // registró la clave; no es fatal para la respuesta actual.
      this.logger.warn(`No se pudo registrar idempotencia (loan ${loanId}, key ${key})`);
    }
  }

  /**
   * ✅ Obtiene el balance completo de préstamos de un usuario
   */
  async getLoanBalance(userId: string): Promise<LoanBalanceDto> {
    this.logger.log(`📊 Obteniendo balance para usuario: ${userId}`);

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

    let totalBorrowed = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let activeLoans = 0;

    const loanDetails: LoanDetailDto[] = loans.map((loan) => {
      const loanAmount = Number(loan.amount);
      const loanPending = Number(loan.remainingBalance);
      
      totalBorrowed += loanAmount;
      totalPending += loanPending;

      const loanTotalPaid = loan.payments.reduce(
        (sum, payment) => sum + Number(payment.capitalPayment),
        0,
      );
      totalPaid += loanTotalPaid;

      if (loan.status === 'activo' || loan.status === 'aprobado') {
        activeLoans++;
      }

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

// ✅ Fragmento del método getPendingLoans mejorado

async getPendingLoans(
  page: number,
  limit: number,
): Promise<{
  data: EnrichedLoanDto[];
  total: number;
  page: number;
  limit: number;
}> {
  this.logger.log(`📋 Obteniendo préstamos pendientes - Página: ${page}, Límite: ${limit}`);

  const [loans, total] = await this.loanRepository.findAndCount({
    where: { status: 'pendiente_aprobacion' },
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  this.logger.log(`📊 Préstamos pendientes encontrados: ${total}`);

  // Enriquecer con datos del usuario
  const enrichedLoans: EnrichedLoanDto[] = await Promise.all(
    loans.map(async (loan) => {
      try {
        this.logger.debug(`🔍 Obteniendo perfil para usuario: ${loan.userId}`);
        
        const profile = await this.profileExternalAdapter.getProfile(loan.userId);
        
        this.logger.debug(`✅ Perfil obtenido: ${profile.first_name} ${profile.last_name}`);

        return {
          ...loan,
          user: {
            name: `${profile.first_name} ${profile.last_name}`,
            document: `${profile.document_type} ${profile.document_number}`,
            phone: profile.phone,
          },
        };
      } catch (error) {
        this.logger.error(`❌ Error obteniendo perfil para loan ${loan.id}:`, error);
        
        // Retornar datos por defecto si falla
        return {
          ...loan,
          user: {
            name: 'Usuario Desconocido',
            document: 'N/A',
            phone: 'N/A',
          },
        };
      }
    }),
  );

  this.logger.log(`✅ ${enrichedLoans.length} préstamos enriquecidos con datos de usuario`);

  return {
    data: enrichedLoans,
    total,
    page,
    limit,
  };
}

// ...existing code (imports y constructor)...

async getLoansForCreditAnalysis(userId: string): Promise<EnrichedLoanForAnalysis[]> {
  // Usar el repositorio de TypeORM directamente
  const loans = await this.loanRepository.find({
    where: { userId },
    relations: ['payments'],
    order: { createdAt: 'DESC' },
  });

  return loans.map((loan) => {
    // Calcular total pagado
    const totalPaid = (loan.payments || []).reduce(
      (sum, p) => sum + Number(p.capitalPayment || 0),
      0,
    );
    
    const approvedAmount = Number(loan.amount || 0);
    const interestRate = Number(loan.interestRate || 0);
    const termMonths = Number(loan.termMonths || 1);

    // Calcular interés total y monto total a pagar.
    // interestRate es MENSUAL (consistente con Loan.calculateInterest()), por lo que
    // el interés simple total del plazo es: principal * tasaMensual * nº de meses.
    // (Antes usaba termMonths/12, lo que asumía erróneamente una tasa anual.)
    const totalInterest = approvedAmount * (interestRate / 100) * termMonths;
    const totalToPay = approvedAmount + totalInterest;
    const remainingBalance = Number(loan.remainingBalance || 0);

    // Calcular valor de cuota mensual
    const installmentValue = Number(loan.installmentValue) || (termMonths > 0 ? totalToPay / termMonths : 0);

    // Enriquecer pagos con fecha de vencimiento
    const enrichedPayments = this.enrichPaymentsWithDueDate(loan);

    return {
      id: loan.id,
      user_id: loan.userId,
      amount: Number(loan.amount),
      approved_amount: approvedAmount,
      interest_rate: interestRate,
      term_months: termMonths,
      status: loan.status,
      remainingBalance: Math.round(remainingBalance * 100) / 100,
      installmentValue: Math.round(installmentValue * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      payments: enrichedPayments,
      created_at: loan.createdAt,
      updated_at: loan.updatedAt,
    };
  });
}

/**
 * Enriquece los pagos con la fecha de vencimiento calculada
 */
private enrichPaymentsWithDueDate(loan: Loan): EnrichedPaymentForAnalysis[] {
  const payments = loan.payments || [];
  const loanStartDate = new Date(loan.createdAt);
  const termMonths = Number(loan.termMonths || 12);

  // Generar fechas de vencimiento para cada mes
  const dueDates: Date[] = [];
  for (let i = 1; i <= termMonths; i++) {
    const dueDate = new Date(loanStartDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    dueDates.push(dueDate);
  }

  // Asignar fecha de vencimiento a cada pago
  return payments.map((payment, index) => {
    const paymentDate = new Date(payment.date || payment.createdAt);
    const dueDate = dueDates[index] || dueDates[dueDates.length - 1] || paymentDate;

    return {
      id: payment.id,
      loan_id: loan.id,
      amount: Number(payment.amountPaid || 0),
      date: paymentDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'completed',
    };
  });
}

// ...existing code...

async searchPendingByDocument(documentNumber: string): Promise<EnrichedLoanDto[]> {
  this.logger.log(`🔍 Buscando préstamos pendientes por documento: ${documentNumber}`);

  // Buscar usuario por documento
  const profile = await this.profileExternalAdapter.getProfileByDocumentNumber(
    documentNumber,
  );
  
  if (!profile) {
    throw new NotFoundException(`Usuario con documento ${documentNumber} no encontrado`);
  }

  this.logger.log(`✅ Usuario encontrado: ${profile.first_name} ${profile.last_name} (${profile.id_user})`);

  // Buscar préstamos pendientes de ese usuario
  const loans = await this.loanRepository.find({
    where: {
      userId: profile.id_user,
      status: 'pendiente_aprobacion',
    },
    order: { createdAt: 'DESC' },
  });

  this.logger.log(`📊 Préstamos pendientes encontrados: ${loans.length}`);

  // Enriquecer con datos del usuario
  return loans.map(loan => ({
    ...loan,
    user: {
      name: `${profile.first_name} ${profile.last_name}`,
      document: `${profile.document_type} ${profile.document_number}`,
      phone: profile.phone,
    },
  }));
}
  /**
   * Solicita un nuevo préstamo
   */
async requestLoan(loanData: {
    userId: string;
    amount: number;
    typeId: LoanType;
  }): Promise<Loan> {
    this.logger.log(`🆕 Solicitando préstamo para usuario: ${loanData.userId}`);

    // Chequeo de capacidad de endeudamiento ANTES de crear la solicitud.
    await this.assertWithinCapacity(loanData.userId, loanData.amount);

    const loan = this.loanRepository.create({
      userId: loanData.userId,
      amount: loanData.amount,
      interestRate: 0,
      status: 'pendiente_aprobacion',
      type: loanData.typeId,
      remainingBalance: loanData.amount,
    });

    return await this.loanRepository.save(loan);
  }

  /**
   * Valida que el préstamo solicitado no exceda una capacidad de endeudamiento
   * estimada (heurística: múltiplo del ingreso mensual menos la exposición actual).
   * Es un chequeo previo básico; el análisis completo vive en admin-service.
   */
  private async assertWithinCapacity(
    userId: string,
    requestedAmount: number,
  ): Promise<void> {
    const activeLoans = await this.loanRepository.find({
      where: [
        { userId, status: 'activo' },
        { userId, status: 'aprobado' },
        { userId, status: 'pendiente_aprobacion' },
      ],
    });
    const currentExposure = activeLoans.reduce(
      (sum, l) => sum + Number(l.remainingBalance || 0),
      0,
    );

    let monthlyIncome = 0;
    try {
      const profile = await this.profileExternalAdapter.getProfile(userId);
      if (profile && !profile.degraded) {
        monthlyIncome = Number(profile.monthly_income || 0);
      }
    } catch {
      monthlyIncome = 0;
    }

    if (!monthlyIncome) {
      this.logger.warn(
        `No se pudo evaluar la capacidad de ${userId} (ingreso desconocido); se permite la solicitud.`,
      );
      return;
    }

    const multiplier = parseInt(process.env.LOAN_MAX_INCOME_MULTIPLIER || '12', 10);
    const maxExposure = monthlyIncome * multiplier;
    const projected = currentExposure + Number(requestedAmount);

    if (projected > maxExposure) {
      throw new ConflictException(
        `La solicitud supera tu capacidad de endeudamiento estimada. ` +
          `Exposición proyectada: ${projected.toFixed(2)}, máximo recomendado: ${maxExposure.toFixed(2)} ` +
          `(${multiplier}× ingreso mensual).`,
      );
    }
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

    this.transitionStatus(loan, 'activo');
    loan.interestRate = approvalData.interestRate;
    loan.termMonths = approvalData.termMonths;
    loan.installmentValue = approvalData.installmentValue;
    loan.paymentFrequency = approvalData.paymentFrequency as any;
    loan.approvedAt = new Date();

    const saved = await this.loanRepository.save(loan);
    await this.events.publish('LoanApproved', { loanId: saved.id, userId: saved.userId });
    return saved;
  }

  /**
   * ✅ NUEVO: Registra un pago manual desde el admin dashboard
   */
  async makeManualPayment(
    loanId: string,
    paymentData: { amount: number; paymentDate: string },
    idempotencyKey?: string,
  ): Promise<Payment> {
    const existing = await this.findIdempotentPayment(loanId, idempotencyKey);
    if (existing) return existing;

    const loan = await this.loanRepository.findOne({ where: { id: loanId } });

    if (!loan) {
      throw new NotFoundException(`Préstamo con ID ${loanId} no encontrado`);
    }

    if (loan.status !== 'activo' && loan.status !== 'aprobado') {
      throw new BadRequestException('El préstamo no está activo');
    }

    // `amount` es el TOTAL que paga el cliente. Asignación tipo entidad prestadora
    // (Solventa): el pago cubre PRIMERO el interés del periodo y el resto abona a
    // capital. Así un pago de 1.000.000 se registra como 1.000.000 (no se le suma
    // el interés encima): p.ej. 40.000 a interés + 960.000 a capital.
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const amount = round2(Number(paymentData.amount));
    const currentBalance = round2(Number(loan.remainingBalance));
    const periodInterest = round2(loan.calculateInterest());
    const maxPayable = round2(currentBalance + periodInterest); // liquidar todo

    if (amount <= 0) {
      throw new BadRequestException('El monto del pago debe ser mayor a cero');
    }
    if (amount > maxPayable) {
      throw new BadRequestException(
        `El pago (${amount}) no puede exceder el saldo + interés del periodo (${maxPayable}).`,
      );
    }

    // Interés primero, el resto a capital.
    const interestCharged = Math.min(periodInterest, amount);
    const capitalPayment = round2(amount - interestCharged);
    const remainingBalance = round2(currentBalance - capitalPayment);
    const amountPaid = amount;

    this.logger.log(
      `💰 Pago manual - Préstamo: ${loanId}, Total: ${amountPaid}, Interés: ${interestCharged}, Capital: ${capitalPayment}, Saldo: ${remainingBalance}`,
    );

    // Crear el registro de pago
    const payment = this.paymentRepository.create({
      loanId: loan.id,
      amountPaid,
      interestCharged,
      capitalPayment,
      remainingBalance,
      date: new Date(paymentData.paymentDate), // Fecha proporcionada por el admin
    });

    // Actualizar el préstamo
    loan.remainingBalance = remainingBalance;

    // Si se pagó todo el capital, marcar como pagado
    if (remainingBalance <= 0) {
      this.transitionStatus(loan, 'pagado');
      this.logger.log(`✅ Préstamo ${loanId} completamente pagado`);
    }

    await this.loanRepository.save(loan);
    const savedPayment = await this.paymentRepository.save(payment);
    await this.recordIdempotency(loanId, idempotencyKey, savedPayment.id);

    this.logger.log(`✅ Pago registrado exitosamente - ID: ${savedPayment.id}`);

    await this.events.publish('PaymentRegistered', {
      loanId,
      userId: loan.userId,
      amount: amountPaid,
      remainingBalance,
    });

    return savedPayment;
  }

  /**
   * Registra un pago (automático)
   */
  async makePayment(loanId: string, amount: number, idempotencyKey?: string): Promise<Payment> {
    const existing = await this.findIdempotentPayment(loanId, idempotencyKey);
    if (existing) return existing;

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
      this.transitionStatus(loan, 'pagado');
    }

    await this.loanRepository.save(loan);
    const savedPayment = await this.paymentRepository.save(payment);
    await this.recordIdempotency(loanId, idempotencyKey, savedPayment.id);

    await this.events.publish('PaymentRegistered', {
      loanId,
      userId: loan.userId,
      amount,
      remainingBalance,
    });

    return savedPayment;
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

    this.transitionStatus(loan, 'rechazado');
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