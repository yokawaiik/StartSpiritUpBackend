/* eslint-disable camelcase */

import { DocumentReference, Timestamp } from "firebase-admin/firestore";
import { OrderStatus } from "../enums/order_status";

export class OrdersRecord {
  ref: DocumentReference;
  created_at: Timestamp | null;
  payment_id: string | null;
  buyer_ref: DocumentReference | null;
  seller_ref: DocumentReference | null;
  amount: number;
  description: string;
  status: OrderStatus | null;
  confirmation_url: string | null;
  refundable: boolean | null;

  constructor(
    ref: DocumentReference,
    created_at: Timestamp | null,
    payment_id: string | null,
    buyer_ref: DocumentReference | null,
    seller_ref: DocumentReference | null,
    amount: number,
    description: string,
    status: OrderStatus | null,
    confirmation_url: string | null,
    refundable: boolean | null
  ) {
    this.ref = ref;
    this.created_at = created_at;
    this.payment_id = payment_id;
    this.buyer_ref = buyer_ref;
    this.seller_ref = seller_ref;
    this.amount = amount;
    this.description = description;
    this.status = status;
    this.confirmation_url = confirmation_url;
    this.refundable = refundable;
  }
}
