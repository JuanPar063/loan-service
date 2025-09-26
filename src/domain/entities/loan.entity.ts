export class Loan {
  id: string;
  userId: string;
  amount: number;
  interestRate: number;
  status: 'pending' | 'approved' | 'rejected';

  calculateInterest(): number {
    return this.amount * (this.interestRate / 100);
  }
}