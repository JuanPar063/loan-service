import { Controller, Post, Body, Get, Param, Put } from '@nestjs/common';
import { LoanService } from 'application/services/loan.service';
import { RequestLoanDto } from 'infrastructure/dto/request-loan.dto';
import { ApproveLoanDto } from 'infrastructure/dto/approve-loan.dto';
import { MakePaymentDto } from 'infrastructure/dto/make-payment.dto';
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

  @Post('request')
  @ApiOperation({ summary: 'Solicitar un préstamo' })
  @ApiCreatedResponse({
    description: 'Préstamo solicitado exitosamente',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'loan_001' },
        amount: { type: 'number', example: 5000 },
        status: { type: 'string', example: 'PENDING' },
      },
    },
  })
  async request(@Body() dto: RequestLoanDto) {
    return this.loanService.requestLoan(dto);
  }

  @Get('my/:userId')
  @ApiOperation({ summary: 'Obtener préstamos de un usuario' })
  @ApiParam({ name: 'userId', type: String, example: 'user_123' })
  @ApiOkResponse({
    description: 'Lista de préstamos del usuario',
    schema: { type: 'array', items: { type: 'object' } },
  })
  async getMyLoans(@Param('userId') userId: string) {
    return this.loanService.getLoansByUser(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los préstamos' })
  @ApiOkResponse({
    description: 'Lista de todos los préstamos',
    schema: { type: 'array', items: { type: 'object' } },
  })
  async getAllLoans() {
    return this.loanService.getAllLoans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un préstamo por ID' })
  @ApiParam({ name: 'id', type: String, example: 'loan_001' })
  @ApiOkResponse({
    description: 'Préstamo encontrado',
    schema: { type: 'object' },
  })
  async getLoan(@Param('id') id: string) {
    return this.loanService.getLoanById(id);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Aprobar un préstamo' })
  @ApiParam({ name: 'id', type: String, example: 'loan_001' })
  @ApiOkResponse({
    description: 'Préstamo aprobado',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'loan_001' },
        status: { type: 'string', example: 'APPROVED' },
      },
    },
  })
  async approve(@Param('id') id: string, @Body() dto: ApproveLoanDto) {
    return this.loanService.approveLoan(id, dto);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Registrar un pago de préstamo' })
  @ApiParam({ name: 'id', type: String, example: 'loan_001' })
  @ApiCreatedResponse({
    description: 'Pago registrado exitosamente',
    schema: {
      type: 'object',
      properties: {
        paymentId: { type: 'string', example: 'pay_123' },
        loanId: { type: 'string', example: 'loan_001' },
        amount: { type: 'number', example: 200 },
        createdAt: { type: 'string', example: '2025-09-29T12:34:56.000Z' },
      },
    },
  })
  async makePayment(@Param('id') id: string, @Body() dto: MakePaymentDto) {
    return this.loanService.makePayment(id, dto.amount);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'Obtener pagos de un préstamo' })
  @ApiParam({ name: 'id', type: String, example: 'loan_001' })
  @ApiOkResponse({
    description: 'Lista de pagos del préstamo',
    schema: { type: 'array', items: { type: 'object' } },
  })
  async getPayments(@Param('id') id: string) {
    return this.loanService.getPaymentsByLoan(id);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Rechazar un préstamo' })
  @ApiParam({ name: 'id', type: String, example: 'loan_001' })
  @ApiOkResponse({
    description: 'Préstamo rechazado',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'loan_001' },
        status: { type: 'string', example: 'REJECTED' },
      },
    },
  })
  async reject(@Param('id') id: string) {
    return this.loanService.rejectLoan(id);
  }

  @Get('balance/:userId')
  @ApiOperation({ summary: 'Obtener balance de un usuario' })
  @ApiParam({ name: 'userId', type: String, example: 'user_123' })
  @ApiOkResponse({
    description: 'Balance del usuario',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'user_123' },
        balance: { type: 'number', example: 1500 },
      },
    },
  })
  async getBalance(@Param('userId') userId: string) {
    return this.loanService.getBalance(userId);
  }
}
