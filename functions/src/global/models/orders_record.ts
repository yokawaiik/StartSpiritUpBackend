/* eslint-disable camelcase */

import { DocumentReference, Timestamp } from "firebase-admin/firestore";
import { OrderStatus } from "../enums/order_status";

export class OrdersRecord {
  ref: DocumentReference;
  created_at: Timestamp | null;
  payment_id: string | null;
  created_by: DocumentReference | null;
  price: number;
  description: string;
  status: OrderStatus | null;
  confirmation_url: string | null;

  constructor(
    ref: DocumentReference,
    created_at: Timestamp | null,
    payment_id: string | null,
    created_by: DocumentReference | null,
    price: number,
    description: string,
    status: OrderStatus | null,
    confirmation_url: string | null
  ) {
    this.ref = ref;
    this.created_at = created_at;
    this.payment_id = payment_id;
    this.created_by = created_by;
    this.price = price;
    this.description = description;
    this.status = status;
    this.confirmation_url = confirmation_url;
  }
}
