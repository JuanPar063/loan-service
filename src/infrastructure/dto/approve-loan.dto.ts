import { IsNumber, IsPositive, IsOptional, IsString, IsIn } from 'class-validator';

export class ApproveLoanDto {
  @IsNumber()
  @IsPositive()
  interestRate: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  termMonths?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  installmentValue?: number;

  @IsOptional()
  @IsString()
  @IsIn(['daily', 'weekly', 'biweekly', 'monthly'])
  paymentFrequency?: string;
}