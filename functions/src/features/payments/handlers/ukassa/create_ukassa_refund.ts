import { ICreateRefund, Refund, YooCheckout } from "@a2seven/yoo-checkout";

import * as logger from "firebase-functions/logger";
import { v4 as uuidv4 } from "uuid";

export const createUkassaRefund = async (
  shopId: string,
  secretKey: string,
  paymentId: string,
  value: string,
  currency: string,
  description: string
): Promise<Refund | null> => {
  try {
    const checkout = new YooCheckout({
      shopId: shopId,
      secretKey: secretKey,
    });

    logger.info({
      message: `Capture ukassa payment for payment id ${paymentId}.`,
    });

    const idempotenceKey = uuidv4();

    const createRefund: ICreateRefund = {
      payment_id: paymentId,
      amount: {
        value: value,
        currency: currency,
      },
      description: description,
    };

    const refund = await checkout.createRefund(createRefund, idempotenceKey);

    logger.info({
      message: "Success ukassa refund.",
      payment: refund,
    });

    return refund;
  } catch (error) {
    logger.info({
      handler: "createUkassaRefund",
      message: "Error ukassa refund.",
      error: error,
    });

    return null;
  }
};
