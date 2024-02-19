/* eslint-disable camelcase */

import { DocumentReference, Timestamp } from "firebase-admin/firestore";
import { EventStatus } from "../enums/event_status";

export class EventsRecord {
  ref: DocumentReference;
  chat_ref: DocumentReference | null;
  date: Timestamp | null;
  duration: number | null;
  guide_ref: DocumentReference | null;
  order_ref: DocumentReference | null;
  service_ref: DocumentReference | null;
  status: EventStatus | null;
  user_ref: DocumentReference | null;

  constructor(
    ref: DocumentReference,
    chat_ref: DocumentReference | null,
    date: Timestamp | null,
    duration: number | null,
    guide_ref: DocumentReference | null,
    order_ref: DocumentReference | null,
    service_ref: DocumentReference | null,
    status: EventStatus | null,
    user_ref: DocumentReference | null
  ) {
    this.ref = ref;
    this.chat_ref = chat_ref;
    this.date = date;
    this.duration = duration;
    this.guide_ref = guide_ref;
    this.order_ref = order_ref;
    this.service_ref = service_ref;
    this.status = status;
    this.user_ref = user_ref;
  }
}
