// loan-service/src/infrastructure/dto/manual-payment.dto.ts

import { IsNumber, IsPositive, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManualPaymentDto {
  @ApiProperty({
    description: 'Monto pagado a capital (debe ser menor o igual al saldo pendiente)',
    example: 500,
  })
  @IsNumber()
  @IsPositive()
  capitalPayment: number;

  @ApiProperty({
    description: 'Fecha del pago (formato ISO 8601)',
    example: '2025-01-15T10:30:00Z',
  })
  @IsDateString()
  paymentDate: string;
}