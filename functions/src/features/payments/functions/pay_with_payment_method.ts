import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getMissingBodyRequiredParams } from "../../../global/utils/get_missing_body_required_source_params";

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
  UKASSA_PAYMENT_DESCRIPTION,
  UKASSA_SECRET_KEY,
  UKASSA_SHOP_ID,
} from "../constants/constants";

import { createUkassaPayment } from "../handlers/ukassa/create_ukassa_payment";
import { getUsersRecordByUid } from "../../../global/utils/get_users_record_by_uid";
import { getOrdersRecordByRef } from "../../../global/utils/get_orders_record_by_ref";
import { getRefFromPath } from "../../../global/utils/get_reference_from_path";
import { getPaymentMethodsRecordByRef } from "../../../global/utils/get_payment_methods_record_by_ref";
import { OrderStatus } from "../../../global/enums/order_status";
import {
  PaymentsException,
  PaymentsExceptionType,
} from "../exceptions/payments_exception";

/**
 * required params:
 *  orderRefPath: string,
 *  paymentMethodRefPath: string
 */
export const payWithPaymentMethod = onCall(
  {
    maxInstances: 10,
    secrets: [UKASSA_SHOP_ID, UKASSA_SECRET_KEY],
  },
  async (request) => {
    try {
      // -- boiler plate verifiction

      if (request.auth === undefined || request.auth?.uid === null) {
        logger.info({
          message: GlobalExceptionType.NotAuthorized,
          request: request,
        });

        return {
          status: 401,
          error: GlobalExceptionType.NotAuthorized,
        };
      }

      const uid = request.auth?.uid;

      // -- boiler plate verifiction
      // -- check if request by parent
      const usersRecord = await getUsersRecordByUid(
        firestoreCollectionsConfig,
        uid
      );

      if (usersRecord === null) {
        throw new GlobalException(
          `User with uid ${uid} is not found.`,
          GlobalExceptionType.NotAuthorized,
          401
        );
      }

      logger.info({
        message: `Request to initial payment with Ukassa user with uid: ${uid}.`,
        uid: uid,
        request: request,
      });

      // -- check if request by parent

      const missedParams = getMissingBodyRequiredParams(request.data, [
        "orderRefPath",
        "paymentMethodRefPath",
      ]);

      if (missedParams.length > 0) {
        throw new GlobalException(
          `Required parameters were missed: ${missedParams.join(", ")}.`,
          GlobalExceptionType.RequiredParamsMissed,
          400
        );
      }

      const { orderRefPath, paymentMethodRefPath } = request.data;

      // ? info : check if order exist
      const ordersRecord = await getOrdersRecordByRef(
        getRefFromPath(orderRefPath)
      );

      if (ordersRecord === null || ordersRecord?.amount === null) {
        throw new GlobalException(
          `Order with ref ${orderRefPath} is not found or amount is null.`,
          GlobalExceptionType.DocumentNotFound,
          404
        );
      }

      if (
        ordersRecord.status === OrderStatus.Paid ||
        ordersRecord.status === OrderStatus.Refunded
      ) {
        throw new GlobalException(
          `Order with ref ${orderRefPath} has already been paid or refunded.`,
          GlobalExceptionType.DocumentNotFound,
          403
        );
      }

      const amountValue = ordersRecord?.amount!.toString();

      logger.info({
        message: `Amount value is ${amountValue}.`,
        amountValue: amountValue,
      });

      const paymentMethodRef = getRefFromPath(paymentMethodRefPath);

      const paymentMethodsRecord = await getPaymentMethodsRecordByRef(
        paymentMethodRef
      );

      if (paymentMethodsRecord === null || paymentMethodsRecord?.id === null) {
        throw new GlobalException(
          `Payment method with ref ${paymentMethodRefPath} is not found or payment id is null.`,
          GlobalExceptionType.DocumentNotFound,
          404
        );
      }

      if (paymentMethodsRecord.created_by?.path !== usersRecord.ref.path) {
        throw new GlobalException(
          `Payment method with ref ${paymentMethodRefPath} does not belong to user with uid ${uid}.`,
          GlobalExceptionType.DocumentNotFound,
          403
        );
      }

      const writeBatch = firestoreInstance.batch();

      writeBatch.update(ordersRecord.ref, {
        status: OrderStatus.Pending,
      });

      // ? info: take money from client automatically
      const payment = await createUkassaPayment(
        process.env.UKASSA_SHOP_ID!,
        process.env.UKASSA_SECRET_KEY!,
        amountValue,
        DEFAULT_CURRENCY,
        ordersRecord.buyer_ref!,
        ordersRecord.description ?? UKASSA_PAYMENT_DESCRIPTION,
        true,
        paymentMethodsRecord.id
      );

      // update payment in order

      if (payment === null) {
        writeBatch.update(ordersRecord.ref, {
          status: OrderStatus.Error,
        });

        await writeBatch.commit();

        throw new PaymentsException(
          "Payment was not created.",
          PaymentsExceptionType.PaymentProviderError,
          500
        );
      } else {
        writeBatch.update(ordersRecord.ref, {
          status: OrderStatus.Pending,
          payment_id: payment.id,
        });

        await writeBatch.commit();
      }

      // ? info: confirm payment

      logger.info({
        message: "Item was bought.",
      });

      return {
        status: 200,
        message: "Item was bought.",
      };
    } catch (error) {
      if (error instanceof PaymentsException) {
        logger.warn({
          status: error.status,
          error: error.message,
          type: error.type,
          ...error.body,
        });
        return {
          status: error.status,
          error: error.message,
          ...error.body,
        };
      } else if (error instanceof GlobalException) {
        logger.warn({
          status: error.status,
          error: error.message,
          type: error.type,
        });
        return {
          status: error.status,
          error: error.message,
          type: error.type,
        };
      }

      logger.error({
        error: error,
        type: GlobalExceptionType.Unexpected,
      });

      return {
        status: 404,
        error: error,
        type: GlobalExceptionType.Unexpected,
      };
    }
  }
);
