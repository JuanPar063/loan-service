import { IsNumber, IsPositive } from 'class-validator';

export class MakePaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;
}