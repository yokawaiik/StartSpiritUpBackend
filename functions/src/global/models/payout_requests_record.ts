/* eslint-disable camelcase */

import { DocumentReference, Timestamp } from "firebase-admin/firestore";
import { PayoutRequestStatus } from "../enums/payout_request_status";

export class PayoutRequestsRecord {
  ref: DocumentReference;
  created_at: Timestamp | null;
  created_by: DocumentReference | null;
  status: PayoutRequestStatus | null;

  constructor(
    ref: DocumentReference,
    created_at: Timestamp | null,
    created_by: DocumentReference | null,
    status: PayoutRequestStatus | null
  ) {
    this.ref = ref;
    this.created_at = created_at;
    this.created_by = created_by;
    this.status = status;
  }
}
