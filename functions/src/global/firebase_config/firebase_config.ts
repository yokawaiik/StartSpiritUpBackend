/* eslint-disable camelcase */

import * as admin from "firebase-admin";

import { getAuth } from "firebase-admin/auth";

import serviceAccount from "../../../../serviceAccountKey.json";
import { FirestoreCollectionsConfig } from "./firestore_collections_config";

const credentialCert = admin.credential.cert(serviceAccount as any);

const app = admin.initializeApp({
  credential: credentialCert,
  storageBucket: serviceAccount.storage_bucket,
});

const firebaseAuth = getAuth(app);

const firestoreInstance = admin.firestore();

const fcm = admin.messaging();

const firestoreCollectionsConfig = new FirestoreCollectionsConfig(
  firestoreInstance.collection("users"),
  firestoreInstance.collection("orders"),
  firestoreInstance.collection("purchases")
);

export { firebaseAuth, firestoreInstance, firestoreCollectionsConfig, fcm };
