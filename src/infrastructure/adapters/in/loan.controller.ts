// loan-service/src/infrastructure/adapters/in/loan.controller.ts

import { Controller, Post, Body, Get, Param, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { LoanService } from '../../../application/services/loan.service';
import { RequestLoanDto } from '../../dto/request-loan.dto';
import { ApproveLoanDto } from '../../dto/approve-loan.dto';
import { MakePaymentDto } from '../../dto/make-payment.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('loans')
@ApiBearerAuth()
@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  /**
   * ✅ NUEVO: Obtiene el balance completo de préstamos del usuario
   */
  @Get('balance/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Obtener balance de préstamos del usuario',
    description: 'Retorna el balance completo incluyendo todos los préstamos, pagos realizados y montos pendientes'
  })
  @ApiParam({ name: 'userId', type: String, example: 'user_123' })
  @ApiOkResponse({
    description: 'Balance del usuario obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user_123' },
        totalLoans: { type: 'number', example: 3 },
        activeLoans: { type: 'number', example: 2 },
        totalBorrowed: { type: 'number', example: 15000 },
        totalPaid: { type: 'number', example: 5000 },
        totalPending: { type: 'number', example: 10000 },
        loans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              amount: { type: 'number' },
              interestRate: { type: 'number' },
              status: { type: 'string' },
              remainingBalance: { type: 'number' },
              totalPaid: { type: 'number' },
              payments: { type: 'array' },
            },
          },
        },
      },
    },
  })
  async getBalance(@Param('userId') userId: string) {
    return this.loanService.getLoanBalance(userId);
  }

  @Post('request')
  @ApiOperation({ summary: 'Solicitar un préstamo' })
  @ApiCreatedResponse({
    description: 'Préstamo solicitado exitosamente',
  })
  async request(@Body() dto: RequestLoanDto) {
    return this.loanService.requestLoan(dto);
  }

  @Get('my/:userId')
  @ApiOperation({ summary: 'Obtener préstamos de un usuario' })
  @ApiParam({ name: 'userId', type: String, example: 'user_123' })
  async getMyLoans(@Param('userId') userId: string) {
    return this.loanService.getLoansByUser(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los préstamos' })
  async getAllLoans() {
    return this.loanService.getAllLoans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un préstamo por ID' })
  @ApiParam({ name: 'id', type: String, example: 'loan_001' })
  async getLoan(@Param('id') id: string) {
    return this.loanService.getLoanById(id);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Aprobar un préstamo' })
  @ApiParam({ name: 'id', type: String, example: 'loan_001' })
  async approve(@Param('id') id: string, @Body() dto: ApproveLoanDto) {
    return this.loanService.approveLoan(id, dto);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Registrar un pago de préstamo' })
  @ApiParam({ name: 'id', type: String, example: 'loan_001' })
  @ApiCreatedResponse({
    description: 'Pago registrado exitosamente',
  })
  async makePayment(@Param('id') id: string, @Body() dto: MakePaymentDto) {
    return this.loanService.makePayment(id, dto.amount);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'Obtener pagos de un préstamo' })
  @ApiParam({ name: 'id', type: String, example: 'loan_001' })
  async getPayments(@Param('id') id: string) {
    return this.loanService.getPaymentsByLoan(id);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Rechazar un préstamo' })
  @ApiParam({ name: 'id', type: String, example: 'loan_001' })
  async reject(@Param('id') id: string) {
    return this.loanService.rejectLoan(id);
  }
}