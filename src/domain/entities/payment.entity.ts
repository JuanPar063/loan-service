export class Payment {
  id: string;
  loanId: string;
  date: Date;
  amountPaid: number;
  interestCharged: number;
  capitalPayment: number;
  remainingBalance: number;

  constructor(
    id: string,
    loanId: string,
    date: Date,
    amountPaid: number,
    interestCharged: number,
    capitalPayment: number,
    remainingBalance: number
  ) {
    this.id = id;
    this.loanId = loanId;
    this.date = date;
    this.amountPaid = amountPaid;
    this.interestCharged = interestCharged;
    this.capitalPayment = capitalPayment;
    this.remainingBalance = remainingBalance;
  }
}