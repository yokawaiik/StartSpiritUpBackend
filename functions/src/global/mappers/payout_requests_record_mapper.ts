import { PayoutRequestsRecord } from "../models/payout_requests_record";

export class PayoutRequestsRecordMapper {
  public static fromDocument(
    documentData: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
  ): PayoutRequestsRecord {
    const data = documentData.data()!;

    return new PayoutRequestsRecord(
      documentData.ref,
      data["created_at"] ?? null,
      data["created_by"] ?? null,
      data["status"] ?? null
    );
  }
}
