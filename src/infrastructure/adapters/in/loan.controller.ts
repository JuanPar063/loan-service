import { Controller, Post, Body, Get, Param, Put } from '@nestjs/common';
import { LoanService } from 'application/services/loan.service';
import { RequestLoanDto } from 'infrastructure/dto/request-loan.dto';
import { ApproveLoanDto } from 'infrastructure/dto/approve-loan.dto';
import { MakePaymentDto } from 'infrastructure/dto/make-payment.dto';

@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post('request')
  async request(@Body() dto: RequestLoanDto) {
    return this.loanService.requestLoan(dto);
  }

  @Get('my/:userId')
  async getMyLoans(@Param('userId') userId: string) {
    return this.loanService.getLoansByUser(userId);
  }

  @Get()
  async getAllLoans() {
    return this.loanService.getAllLoans();
  }

  @Get(':id')
  async getLoan(@Param('id') id: string) {
    return this.loanService.getLoanById(id);
  }

  @Put(':id/approve')
  async approve(@Param('id') id: string, @Body() dto: ApproveLoanDto) {
    return this.loanService.approveLoan(id, dto);
  }
  @Post(':id/payments')
  async makePayment(@Param('id') id: string, @Body() dto: MakePaymentDto) {
    return this.loanService.makePayment(id, dto.amount);
  }

  @Get(':id/payments')
  async getPayments(@Param('id') id: string) {
    return this.loanService.getPaymentsByLoan(id);
  }

  @Put(':id/reject')
  async reject(@Param('id') id: string) {
    return this.loanService.rejectLoan(id);
  }

  @Get('balance/:userId')
  async getBalance(@Param('userId') userId: string) {
    return this.loanService.getBalance(userId);
  }
}