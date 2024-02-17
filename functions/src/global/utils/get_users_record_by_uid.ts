import * as logger from "firebase-functions/logger";
import { FirestoreCollectionsConfig } from "../firebase_config/firestore_collections_config";
import {
  GlobalException,
  GlobalExceptionType,
} from "../exceptions/global_exception";
import { UsersRecordMapper } from "../mappers/users_record_mapper";
import { UsersRecord } from "../models/users_record";

export const getUsersRecordByUid = async (
  firestoreCollectionsConfig: FirestoreCollectionsConfig,
  uid: string
): Promise<UsersRecord | null> => {
  try {
    const userDocument = await firestoreCollectionsConfig.users.doc(uid).get();

    logger.info({
      userDocument: userDocument,
    });

    if (!userDocument) {
      return null;
    }

    const userAccount = UsersRecordMapper.fromDocument(userDocument);

    return userAccount;
  } catch (error) {
    logger.error({
      error: error,
      type: GlobalExceptionType.Unexpected,
    });

    throw new GlobalException(
      "Can't get document.",
      GlobalExceptionType.CantGetDocument,
      500
    );
  }
};
