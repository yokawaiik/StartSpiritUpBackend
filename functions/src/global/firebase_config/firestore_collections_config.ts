/* eslint-disable camelcase */
import { CollectionReference } from "firebase-admin/firestore";

export class FirestoreCollectionsConfig {
  users: CollectionReference;
  orders: CollectionReference;
  payout_requests: CollectionReference;

  constructor(
    users: CollectionReference,
    orders: CollectionReference,
    payout_requests: CollectionReference
  ) {
    this.users = users;
    this.orders = orders;
    this.payout_requests = payout_requests;
  }
}
