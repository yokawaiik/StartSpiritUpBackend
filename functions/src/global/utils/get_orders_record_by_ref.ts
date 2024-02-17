import * as logger from "firebase-functions/logger";
import {
  GlobalException,
  GlobalExceptionType,
} from "../exceptions/global_exception";

import { DocumentReference } from "firebase-admin/firestore";
import { OrdersRecordMapper } from "../mappers/orders_record_mapper";
import { OrdersRecord } from "../models/orders_record";

export const getOrdersRecordByRef = async (
  ref: DocumentReference
): Promise<OrdersRecord | null> => {
  try {
    const ordersDocument = await ref.get();

    logger.info({
      ordersDocument: ordersDocument,
    });

    if (!ordersDocument.exists) {
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
