import { IsString, IsNumber, IsPositive, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestLoanDto {
  @ApiProperty({
    description: 'ID del usuario que solicita el préstamo',
    example: 'user_123',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Monto solicitado para el préstamo',
    example: 5000,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Tipo de préstamo',
    example: 'monthly_interest',
    enum: ['monthly_interest', 'fixed_installments'],
  })
  @IsString()
  @IsIn(['monthly_interest', 'fixed_installments'])
  typeId: string;
}
