// loan-service/src/infrastructure/adapters/in/loan.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { LoanService } from '../../../application/services/loan.service';
import { RequestLoanDto } from '../../dto/request-loan.dto';
import { ApproveLoanDto } from '../../dto/approve-loan.dto';
import { MakePaymentDto } from '../../dto/make-payment.dto';
import { ManualPaymentDto } from '../../dto/manual-payment.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('loans')
@ApiBearerAuth()
@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  // ===================== CONSULTAS ESPECÍFICAS =====================

  @Get('pending/search/:documentNumber')
  @ApiOperation({ summary: 'Buscar préstamos pendientes por documento' })
  @ApiParam({ name: 'documentNumber', type: String })
  async searchPendingByDocument(@Param('documentNumber') documentNumber: string) {
    return this.loanService.searchPendingByDocument(documentNumber);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Obtener préstamos pendientes de aprobación' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  async getPendingLoans(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.loanService.getPendingLoans(Number(page), Number(limit));
  }

  @Get('balance/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener balance de préstamos del usuario' })
  @ApiParam({ name: 'userId', type: String, example: 'user_123' })
  async getBalance(@Param('userId') userId: string) {
    return this.loanService.getLoanBalance(userId);
  }

  @Get('my/:userId')
  @ApiOperation({ summary: 'Obtener préstamos de un usuario' })
  @ApiParam({ name: 'userId', type: String, example: 'user_123' })
  async getMyLoans(@Param('userId') userId: string) {
    return this.loanService.getLoansByUser(userId);
  }

  // ===================== ACCIONES =====================

  @Post('request')
  @ApiOperation({ summary: 'Solicitar un préstamo' })
  async request(@Body() dto: RequestLoanDto) {
    return this.loanService.requestLoan(dto);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Aprobar un préstamo' })
  async approve(@Param('id') id: string, @Body() dto: ApproveLoanDto) {
    return this.loanService.approveLoan(id, dto);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Rechazar un préstamo' })
  async reject(@Param('id') id: string) {
    return this.loanService.rejectLoan(id);
  }

  @Post(':id/payments/manual')
  @ApiOperation({ summary: 'Registrar pago manual (Admin)' })
  async makeManualPayment(@Param('id') id: string, @Body() dto: ManualPaymentDto) {
    return this.loanService.makeManualPayment(id, dto);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Registrar un pago de préstamo' })
  async makePayment(@Param('id') id: string, @Body() dto: MakePaymentDto) {
    return this.loanService.makePayment(id, dto.amount);
  }

  // ===================== CONSULTAS GENERALES =====================

  @Get(':id/payments')
  @ApiOperation({ summary: 'Obtener pagos de un préstamo' })
  async getPayments(@Param('id') id: string) {
    return this.loanService.getPaymentsByLoan(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un préstamo por ID' })
  @ApiParam({ name: 'id', type: String, example: 'loan_001' })
  async getLoan(@Param('id') id: string) {
    return this.loanService.getLoanById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los préstamos' })
  async getAllLoans() {
    return this.loanService.getAllLoans();
  }
}
