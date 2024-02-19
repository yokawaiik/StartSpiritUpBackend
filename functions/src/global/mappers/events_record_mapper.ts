import { EventStatus } from "../enums/event_status";
import { EventsRecord } from "../models/events_record";

export class EventsRecordMapper {
  public static fromDocument(
    documentData: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
  ): EventsRecord {
    const data = documentData.data()!;

    return new EventsRecord(
      documentData.ref,
      data["chat_ref"] ?? null,
      data["date"] ?? null,
      data["duration"] ?? null,
      data["guide"] ?? null,
      data["order_ref"] ?? null,
      data["service_ref"] ?? null,
      data["status"] ?? EventStatus.Unexpected,
      data["user"] ?? null
    );
  }
}
