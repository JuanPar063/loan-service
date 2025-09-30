import { IsString, IsNumber, IsPositive, IsIn } from 'class-validator';

export class RequestLoanDto {
  @IsString()
  userId: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsIn(['monthly_interest', 'fixed_installments'])
  typeId: string;
}