import * as logger from "firebase-functions/logger";
import { FirestoreCollectionsConfig } from "../firebase_config/firestore_collections_config";
import {
  GlobalException,
  GlobalExceptionType,
} from "../exceptions/global_exception";

import { OrdersRecordMapper } from "../mappers/orders_record_mapper";
import { OrdersRecord } from "../models/orders_record";

export const getOrdersRecordByUid = async (
  firestoreCollectionsConfig: FirestoreCollectionsConfig,
  uid: string
): Promise<OrdersRecord | null> => {
  try {
    const ordersDocument = await firestoreCollectionsConfig.orders
      .doc(uid)
      .get();

    logger.info({
      ordersDocument: ordersDocument,
    });

    if (!ordersDocument) {
      return null;
    }

    const ordersRecord = OrdersRecordMapper.fromDocument(ordersDocument);

    return ordersRecord;
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
