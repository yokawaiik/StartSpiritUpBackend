import * as logger from "firebase-functions/logger";
import { FirestoreCollectionsConfig } from "../firebase_config/firestore_collections_config";
import {
  GlobalException,
  GlobalExceptionType,
} from "../exceptions/global_exception";

import { OrdersRecordMapper } from "../mappers/orders_record_mapper";
import { OrdersRecord } from "../models/orders_record";

export const getOrdersRecordByPaymentId = async (
  firestoreCollectionsConfig: FirestoreCollectionsConfig,
  id: string
): Promise<OrdersRecord | null> => {
  try {
    const ordersDocument = await firestoreCollectionsConfig.orders
      .where("payment_id", "==", id)
      .limit(1)
      .get();

    if (ordersDocument.empty) {
      return null;
    }

    logger.info({
      ordersDocument: ordersDocument,
    });

    const ordersRecord = OrdersRecordMapper.fromDocument(
      ordersDocument.docs[0]
    );

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
