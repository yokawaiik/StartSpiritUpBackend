import * as logger from "firebase-functions/logger";
import {
  GlobalException,
  GlobalExceptionType,
} from "../exceptions/global_exception";

import { DocumentReference } from "firebase-admin/firestore";
import { PaymentMethodsRecordMapper } from "../mappers/payment_methods_record_mapper";
import { PaymentMethodsRecord } from "../models/payment_methods_record";

export const getPaymentMethodsRecordByRef = async (
  ref: DocumentReference
): Promise<PaymentMethodsRecord | null> => {
  try {
    logger.info({
      message: `Get document from payment methods collection by ref ${ref}.`,
      ref: ref,
    });

    const document = await ref.get();

    logger.info({
      paymentMethod: document,
    });

    if (!document.exists) {
      return null;
    }

    const record = PaymentMethodsRecordMapper.fromDocument(document);

    return record;
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
