export class LoanType {
  id: string;
  name: string;
  description: string;

  constructor(id: string, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  static MONTHLY_INTEREST = new LoanType(
    'monthly_interest',
    'Interés Mensual con Abono a Capital',
    'Préstamo con interés mensual sobre la deuda total, posibilidad de abono a capital.'
  );

  static FIXED_INSTALLMENTS = new LoanType(
    'fixed_installments',
    'Cuotas Fijas',
    'Préstamo a cuotas fijas con cantidad definida de cuotas y frecuencia de pago.'
  );
}