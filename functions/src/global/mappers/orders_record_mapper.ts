import { OrdersRecord } from "../models/orders_record";

export class OrdersRecordMapper {
  public static fromDocument(
    documentData: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
  ): OrdersRecord {
    const data = documentData.data()!;

    return new OrdersRecord(
      documentData.ref,
      data["created_at"] ?? null,
      data["payment_id"] ?? null,
      data["buyer_ref"] ?? null,
      data["seller_ref"] ?? null,
      data["amount"] ?? null,
      data["description"] ?? null,
      data["status"] ?? null,
      data["confirmation_url"] ?? null
    );
  }
}
