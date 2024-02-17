export enum PaymentsExceptionType {
  Unexpected = "Unexpected",
  InitialProviderError = "Initial provider error.",
  PaymentProviderError = "Payment provider error.",
  CreatePaymentProvider = "Create payment provider.",
  CantGetPaymentMethod = "Cant get payment method.",
  PaymentAlreadyRefunded = "PaymentAlreadyRefunded"
}

export class PaymentsException extends Error {
  type: PaymentsExceptionType;
  body: any;
  status: number;

  constructor(message: string, type: PaymentsExceptionType, status?: number) {
    super(message);
    this.type = type;
    this.status = status ?? 400;
  }
}
