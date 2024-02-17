import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import {
  GlobalException,
  GlobalExceptionType,
} from "../../../global/exceptions/global_exception";

import {
  firestoreCollectionsConfig,
  firestoreInstance,
} from "../../../global/firebase_config/firebase_config";

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
import { getOrdersRecordByUid } from "../../../global/utils/get_orders_record_by_uid";
import { OrderStatus } from "../../../global/enums/order_status";
import { captureUkassaPayment } from "../handlers/ukassa/capture_ukassa_payment";
import { getPaymentMethodsRecordByUserRefAndPaymentMethodId } from "../utils/get_payment_methods_record_by_user_ref_and_payment_method_id";
import { Timestamp } from "firebase-admin/firestore";

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

        // ? info : search order
        const ordersRecord = await getOrdersRecordByUid(
          firestoreCollectionsConfig,
          paymentId
        );

        logger.info({
          message: `Order with uid is ${paymentId}.`,
          ordersRecord: ordersRecord,
        });

        if (
          ordersRecord === null ||
          ordersRecord?.price === null ||
          ordersRecord?.payment_id === null
        ) {
          throw new GlobalException(
            `Order with uid ${paymentId} is not found or price is null.`,
            GlobalExceptionType.DocumentNotFound,
            404
          );
        }
        const writeBatch = firestoreInstance.batch();

        if (
          body.object.status == "waiting_for_capture" &&
          ordersRecord.status !== OrderStatus.Paid
        ) {
          const priceValue = ordersRecord.price!.toString();

          logger.info({
            message: "Price value.",
            rawValue: ordersRecord.price,
            handledValue: priceValue,
          });

          // ? info: take money from client
          const capturedPayment = await captureUkassaPayment(
            process.env.UKASSA_SHOP_ID!,
            process.env.UKASSA_SECRET_KEY!,
            ordersRecord.payment_id!,
            priceValue,
            DEFAULT_CURRENCY
          );

          if (capturedPayment === null) {
            writeBatch.update(ordersRecord.ref, {
              status: OrderStatus.Error,
            });

            await writeBatch.commit();

            throw new PaymentsException(
              "Payment was not created.",
              PaymentsExceptionType.PaymentProviderError
            );
          } else {
            // ? info: confirm payment
            writeBatch.update(ordersRecord.ref, {
              status: OrderStatus.Paid,
            });

            await writeBatch.commit();
          }

          const foundPaymentMethodDocument =
            getPaymentMethodsRecordByUserRefAndPaymentMethodId(
              ordersRecord.created_by!,
              body.object.payment_method.id
            );

          if (foundPaymentMethodDocument === null) {
            // ? save payment method

            const newPaymentMethodRef = ordersRecord
              .created_by!.collection(USERS_PAYMENT_METHODS_COLLECTION)
              .doc();

            writeBatch.create(newPaymentMethodRef, {
              ref: newPaymentMethodRef,
              id: body.object.payment_method.id,
              created_at: Timestamp.now(),
              created_by: ordersRecord.created_by!,
              last4: body.object.payment_method.card.last4,
              type: body.object.payment_method.type,
            });

            await writeBatch.commit();
          }
        }
      } else if (body.event == UkassaEvents.RefundSucceeded) {
        logger.info({
          message: "Refund succeeded.",
          body: body,
        });

        const paymentId = body.object.id;

        // ? info : search order
        const ordersRecord = await getOrdersRecordByUid(
          firestoreCollectionsConfig,
          paymentId
        );

        if (
          ordersRecord === null ||
          ordersRecord?.status === OrderStatus.Refunded
        ) {
          logger.info({
            message: `Order with uid ${paymentId} has already been refunded.`,
            ordersRecord: ordersRecord,
          });

          response.status(200).send("OK");
          return;
        }

        ordersRecord?.ref.update({ status: OrderStatus.Refunded });
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
