/* eslint-disable camelcase */

import { DocumentReference, Timestamp } from "firebase-admin/firestore";

export class PaymentMethodsRecord {
  ref: DocumentReference;
  created_at: Timestamp | null;
  id: string | null;
  created_by: DocumentReference | null;
  last4: string | null;
  type: string | null;

  constructor(
    ref: DocumentReference,
    created_at: Timestamp | null,
    id: string | null,
    created_by: DocumentReference | null,
    last4: string | null,
    type: string | null
  ) {
    this.ref = ref;
    this.created_at = created_at;
    this.id = id;
    this.created_by = created_by;
    this.last4 = last4;
    this.type = type;
  }
}
