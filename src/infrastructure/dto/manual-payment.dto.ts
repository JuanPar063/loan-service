// loan-service/src/infrastructure/dto/manual-payment.dto.ts

import { IsNumber, IsPositive, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManualPaymentDto {
  @ApiProperty({
    description:
      'Monto TOTAL que paga el cliente. Cubre primero el interés del periodo y el resto abona a capital (no se suma interés encima).',
    example: 500000,
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Fecha del pago (formato ISO 8601)',
    example: '2025-01-15T10:30:00Z',
  })
  @IsDateString()
  paymentDate: string;
}