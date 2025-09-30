import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MakePaymentDto {
  @ApiProperty({
    description: 'Monto del pago a realizar',
    example: 200,
  })
  @IsNumber()
  @IsPositive()
  amount: number;
}
