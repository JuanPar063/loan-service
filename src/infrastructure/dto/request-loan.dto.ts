import { IsString, IsNumber, IsPositive, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoanType } from '../../domain/entities/loan.entity';

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
    example: LoanType.MONTHLY_INTEREST,
    enum: LoanType,
  })
  @IsEnum(LoanType)
  typeId: LoanType;
}
