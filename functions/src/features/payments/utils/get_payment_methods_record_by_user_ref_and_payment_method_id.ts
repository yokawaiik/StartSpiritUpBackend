import { DocumentReference } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v1";
import { PaymentMethodsRecord } from "../../../global/models/payment_methods_record";
import { PaymentMethodsRecordMapper } from "../../../global/mappers/payment_methods_record_mapper";
import { USERS_PAYMENT_METHODS_COLLECTION } from "../constants/constants";
import {
  PaymentsException,
  PaymentsExceptionType,
} from "../exceptions/payments_exception";

export const getPaymentMethodsRecordByUserRefAndPaymentMethodId = async (
  userRef: DocumentReference,
  paymentMethodId: string
): Promise<PaymentMethodsRecord | null> => {
  try {
    logger.info({
      message: "Get user payment methods doc.",
    });

    const paymentMethodsDoc = await userRef
      .collection(USERS_PAYMENT_METHODS_COLLECTION)
      // .where("id", "==", paymentMethodId)
      // .limit(1)
      .doc(paymentMethodId)
      .get();

    if (!paymentMethodsDoc.exists) {
      return null;
    }

    const paymentMethod =
      PaymentMethodsRecordMapper.fromDocument(paymentMethodsDoc);

    return paymentMethod;
  } catch (error) {
    logger.error({
      handler: "getPaymentMethodsRecordByUserRefAndPaymentMethodId",
      error,
      type: PaymentsExceptionType.Unexpected,
    });
    throw new PaymentsException(
      "Can't get payment method.",
      PaymentsExceptionType.CantGetPaymentMethod,
      500
    );
  }
};
