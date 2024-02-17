import { ICapturePayment, Payment, YooCheckout } from "@a2seven/yoo-checkout";

import * as logger from "firebase-functions/logger";
import { v4 as uuidv4 } from "uuid";

export const captureUkassaPayment = async (
  shopId: string,
  secretKey: string,
  paymentId: string,
  value: string,
  currency: string
): Promise<Payment | null> => {
  try {
    const checkout = new YooCheckout({
      shopId: shopId,
      secretKey: secretKey,
    });

    logger.info({
      message: `Capture ukassa payment for payment id ${paymentId}.`,
    });

    const idempotenceKey = uuidv4();

    const capturePayload: ICapturePayment = {
      amount: {
        value: value,
        currency: currency,
      },
    };

    const payment = await checkout.capturePayment(
      paymentId,
      capturePayload,
      idempotenceKey
    );

    logger.info({
      message: "Success capture ukassa payment.",
      payment: payment,
    });

    return payment;
  } catch (error) {
    logger.info({
      handler: "captureUkassaPayment",
      message: "Capture ukassa payment error.",
      error: error,
    });

    return null;
  }
};
