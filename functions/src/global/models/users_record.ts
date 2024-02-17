/* eslint-disable camelcase */

import { DocumentReference, Timestamp } from "firebase-admin/firestore";

export enum UsersRecordtType {
  Admin = "admin",
  User = "user",
}

export class UsersRecord {
  ref: DocumentReference;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  uid: string | null;
  created_time: Timestamp | null;
  phone_number: string | null;

  constructor(
    ref: DocumentReference,
    email: string | null,
    display_name: string | null,
    photo_url: string | null,
    uid: string | null,
    created_time: Timestamp | null,
    phone_number: string | null
  ) {
    this.ref = ref;
    this.email = email;
    this.display_name = display_name;
    this.photo_url = photo_url;
    this.uid = uid;
    this.created_time = created_time;
    this.phone_number = phone_number;
  }
}
