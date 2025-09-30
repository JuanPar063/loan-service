import { IsNumber, IsPositive, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveLoanDto {
  @ApiProperty({
    description: 'Tasa de interés del préstamo (en porcentaje)',
    example: 5.5,
  })
  @IsNumber()
  @IsPositive()
  interestRate: number;

  @ApiProperty({
    description: 'Plazo del préstamo en meses',
    example: 12,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  termMonths?: number;

  @ApiProperty({
    description: 'Valor de cada cuota',
    example: 450,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  installmentValue?: number;

  @ApiProperty({
    description: 'Frecuencia de pago del préstamo',
    example: 'monthly',
    required: false,
    enum: ['daily', 'weekly', 'biweekly', 'monthly'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['daily', 'weekly', 'biweekly', 'monthly'])
  paymentFrequency?: string;
}
