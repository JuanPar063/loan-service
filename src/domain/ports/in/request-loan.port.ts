import { Loan } from '../../entities/loan.entity';

export interface RequestLoanPort {
  requestLoan(loanData: { userId: string; amount: number; typeId: string }): Promise<Loan>;
}