import { PaymentMethodsRecord } from "../models/payment_methods_record";

export class PaymentMethodsRecordMapper {
  public static fromDocument(
    documentData: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
  ): PaymentMethodsRecord {
    const data = documentData.data()!;

    return new PaymentMethodsRecord(
      documentData.ref,
      data["created_at"] ?? null,
      data["id"] ?? null,
      data["created_by"] ?? null,
      data["last4"] ?? null,
      data["type"] ?? null
    );
  }
}
