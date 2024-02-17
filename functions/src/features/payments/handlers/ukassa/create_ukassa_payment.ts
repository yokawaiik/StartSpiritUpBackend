import { ICreatePayment, Payment, YooCheckout } from "@a2seven/yoo-checkout";

import * as logger from "firebase-functions/logger";
import { v4 as uuidv4 } from "uuid";
import { DocumentReference } from "firebase-admin/firestore";
import { UKASSA_CONFIRMATION_RETURN_URL } from "../../constants/constants";
import {
  PaymentsException,
  PaymentsExceptionType,
} from "../../exceptions/payments_exception";

export const createUkassaPayment = async (
  shopId: string,
  secretKey: string,
  value: string,
  currency: string,
  userReference: DocumentReference,
  description?: string | null,
  // if autopayment
  capture?: boolean | false,
  paymentMethodId?: string | null
): Promise<Payment | null> => {
  try {
    const checkout = new YooCheckout({
      shopId: shopId,
      secretKey: secretKey,
    });

    let createPayload: ICreatePayment;

    if (capture && paymentMethodId) {
      createPayload = {
        amount: {
          value: value, // example: "10.00",
          currency: currency, // "RUB",
        },
        payment_method_id: paymentMethodId, // if user has saved card id
        capture: capture,
        metadata: {
          user_reference_path: userReference.path,
          auto_payment: true,
        },
      };
    } else {
      createPayload = {
        amount: {
          value: value, // example: "10.00",
          currency: currency, // "RUB",
        },
        payment_method_data: {
          type: "bank_card",
        },
        save_payment_method: true,
        confirmation: {
          type: "redirect",
          return_url: UKASSA_CONFIRMATION_RETURN_URL,
        },
        metadata: {
          user_reference_path: userReference.path,
        },
      };
    }

    if (description) {
      createPayload.description = description;
    }

    const idempotenceKey = uuidv4();

    const payment = await checkout.createPayment(createPayload, idempotenceKey);

    return payment;
  } catch (error) {
    logger.info({
      handler: "createUkassaPayment",
      message: "Create ukassa payment error.",
      error: error,
    });

    throw new PaymentsException(
      "Create ukassa payment error.",
      PaymentsExceptionType.CreatePaymentProvider,
      500
    );
  }
};
