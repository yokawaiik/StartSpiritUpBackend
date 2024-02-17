import { UsersRecord } from "../models/users_record";

export class UsersRecordMapper {
  public static fromDocument(
    documentData: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
  ): UsersRecord {
    const data = documentData.data()!;

    return new UsersRecord(
      documentData.ref,
      data["email"] ?? null,
      data["display_name"] ?? null,
      data["photo_url"] ?? null,
      data["uid"] ?? null,
      data["created_time"] ?? null,
      data["phone_number"] ?? null
    );
  }
}
