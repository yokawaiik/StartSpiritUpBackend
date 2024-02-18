import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {
  GlobalException,
  GlobalExceptionType,
} from "../../../global/exceptions/global_exception";

import { firestoreCollectionsConfig } from "../../../global/firebase_config/firebase_config";

import {
  DEFAULT_CURRENCY,
  UKASSA_SECRET_KEY,
  UKASSA_SHOP_ID,
  USERS_PAYMENT_METHODS_COLLECTION,
} from "../constants/constants";
import {
  PaymentsException,
  PaymentsExceptionType,
} from "../exceptions/payments_exception";
import { UkassaEvents } from "../enums/ukassa_events";
import { OrderStatus } from "../../../global/enums/order_status";
import { captureUkassaPayment } from "../handlers/ukassa/capture_ukassa_payment";
import { getPaymentMethodsRecordByUserRefAndPaymentMethodId } from "../utils/get_payment_methods_record_by_user_ref_and_payment_method_id";
import { Timestamp } from "firebase-admin/firestore";
import { getOrdersRecordByPaymentId } from "../../../global/utils/get_orders_record_by_payment_id";

export const ukassaWebhook = onRequest(
  {
    maxInstances: 10,
    secrets: [UKASSA_SHOP_ID, UKASSA_SECRET_KEY],
  },
  async (request, response) => {
    try {
      logger.info({
        message: "Payment provider ukassa webhook started.",
        request: request,
      });

      // const [object, event] = request.body;
      const body = request.body;

      logger.info({
        message: `Event: ${body.event}.`,
      });

      if (body.event == UkassaEvents.WaitingForCapture) {
        const paymentId = body.object.id;
        // const paymentId = body.object.payment_id;

        // ? info : search order
        const ordersRecord = await getOrdersRecordByPaymentId(
          firestoreCollectionsConfig,
          paymentId
        );

        logger.info({
          message: `Order with uid is ${paymentId}.`,
          ordersRecord: ordersRecord,
        });

        if (
          ordersRecord === null ||
          ordersRecord?.amount === null ||
          ordersRecord?.payment_id === null
        ) {
          throw new GlobalException(
            `Order with uid ${paymentId} is not found or amount is null.`,
            GlobalExceptionType.DocumentNotFound,
            404
          );
        }

        if (
          body.object.status == "waiting_for_capture" &&
          ordersRecord.status !== OrderStatus.Paid
        ) {
          const amountValue = ordersRecord.amount!.toString();

          logger.info({
            message: "Amount value.",
            rawValue: ordersRecord.amount,
            handledValue: amountValue,
          });

          // ? info: take money from client
          const capturedPayment = await captureUkassaPayment(
            process.env.UKASSA_SHOP_ID!,
            process.env.UKASSA_SECRET_KEY!,
            ordersRecord.payment_id!,
            amountValue,
            DEFAULT_CURRENCY
          );

          if (capturedPayment === null) {
            await ordersRecord.ref.update({
              status: OrderStatus.Error,
            });

            throw new PaymentsException(
              "Payment was not created.",
              PaymentsExceptionType.PaymentProviderError
            );
          } else {
            // ? info: confirm payment
            await ordersRecord.ref.update({
              status: OrderStatus.Paid,
              refundable: body.object.refundable,
            });
          }

          const foundPaymentMethodDocument =
            await getPaymentMethodsRecordByUserRefAndPaymentMethodId(
              ordersRecord.buyer_ref!,
              body.object.payment_method.id
            );

          if (foundPaymentMethodDocument === null) {
            // ? save payment method

            await ordersRecord
              .buyer_ref!.collection(USERS_PAYMENT_METHODS_COLLECTION)
              .doc(body.object.payment_method.id)
              .set({
                id: body.object.payment_method.id,
                created_at: Timestamp.now(),
                created_by: ordersRecord.buyer_ref!,
                last4: body.object.payment_method.card.last4,
                type: body.object.payment_method.type,
              });
          }
        } else if (ordersRecord.status === OrderStatus.Paid) {
          logger.info({
            message: "Payment already captured.",
          });

          response.status(200).send("OK");
        }
      } else if (body.event == UkassaEvents.PaymentSucceeded) {
        const paymentId = body.object.id;

        // ? info : search order
        const ordersRecord = await getOrdersRecordByPaymentId(
          firestoreCollectionsConfig,
          paymentId
        );

        if (
          ordersRecord === null ||
          ordersRecord?.amount === null ||
          ordersRecord?.payment_id === null
        ) {
          throw new GlobalException(
            `Order with uid ${paymentId} is not found or amount is null.`,
            GlobalExceptionType.DocumentNotFound,
            404
          );
        }

        logger.info({
          message: `Order with uid is ${paymentId}.`,
          ordersRecord: ordersRecord,
        });

        await ordersRecord?.ref.update({ status: OrderStatus.Paid });

        response.status(200).send("OK");
      } else if (body.event == UkassaEvents.RefundSucceeded) {
        logger.info({
          message: "Refund succeeded.",
          body: body,
        });

        // const paymentId = body.object.id;
        const paymentId = body.object.payment_id;

        // ? info : search order
        const ordersRecord = await getOrdersRecordByPaymentId(
          firestoreCollectionsConfig,
          paymentId
        );

        if (ordersRecord === null) {
          logger.info({
            message: `Order with uid ${paymentId} is not found.`,
          });

          response.status(404).send("Not found");
          return;
        }

        if (ordersRecord?.status === OrderStatus.Refunded) {
          logger.info({
            message: `Order with uid ${paymentId} has already been refunded.`,
            ordersRecord: ordersRecord,
          });

          response.status(200).send("OK");
          return;
        }

        await ordersRecord?.ref.update({ status: OrderStatus.Refunded });
        logger.info({
          message: `Order with uid ${paymentId} has just been refunded.`,
        });

        return;
      }

      response.status(200).send("OK");
      return;
    } catch (error) {
      if (error instanceof PaymentsException) {
        logger.error({
          error: error.message,
          type: error.type,
          status: error.status,
          ...error.body,
        });
        response.status(error.status).send({
          error: error.message,
          ...error.body,
        });
        return;
      } else if (error instanceof GlobalException) {
        logger.error({
          error: error.message,
          type: error.type,
        });
        response.status(error.status).send({
          error: error.message,
          type: error.type,
        });
        return;
      }

      logger.error({
        error: error,
        type: GlobalExceptionType.Unexpected,
      });

      response.status(500).send({
        error: error,
        type: GlobalExceptionType.Unexpected,
      });
    }
  }
);
