import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { LoanService } from '../../../../application/services/loan.service';
import { RequestLoanDto } from '../../../dto/request-loan.dto';

@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post('request')
  async request(@Body() dto: RequestLoanDto) {
    return this.loanService.requestLoan(dto);
  }

  @Get('balance/:userId')
  async getBalance(@Param('userId') userId: string) {
    // Implementa lógica para sumar loans
    return { totalLoans: 0, totalPaid: 0 };
  }
}