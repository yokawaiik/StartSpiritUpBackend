import * as logger from "firebase-functions/logger";
import {
  GlobalException,
  GlobalExceptionType,
} from "../exceptions/global_exception";
import { UsersRecordMapper } from "../mappers/users_record_mapper";
import { UsersRecord } from "../models/users_record";

import { DocumentReference } from "firebase-admin/firestore";

export const getUsersRecordByRef = async (
  ref: DocumentReference
): Promise<UsersRecord | null> => {
  try {
    const usersDocument = await ref.get();

    logger.info({
      usersDocument: usersDocument,
    });

    if (!usersDocument.exists) {
      return null;
    }

    const usersRecord = UsersRecordMapper.fromDocument(usersDocument);

    return usersRecord;
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
