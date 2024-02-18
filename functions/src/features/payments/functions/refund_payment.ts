import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getMissingBodyRequiredParams } from "../../../global/utils/get_missing_body_required_source_params";

import {
  GlobalException,
  GlobalExceptionType,
} from "../../../global/exceptions/global_exception";
import { firestoreCollectionsConfig } from "../../../global/firebase_config/firebase_config";

import {
  DEFAULT_CURRENCY,
  UKASSA_PAYMENT_REFUND_DESCRIPTION,
  UKASSA_SECRET_KEY,
  UKASSA_SHOP_ID,
} from "../constants/constants";

import { getUsersRecordByUid } from "../../../global/utils/get_users_record_by_uid";
import { getOrdersRecordByRef } from "../../../global/utils/get_orders_record_by_ref";
import { getRefFromPath } from "../../../global/utils/get_reference_from_path";
import { OrderStatus } from "../../../global/enums/order_status";
import {
  PaymentsException,
  PaymentsExceptionType,
} from "../exceptions/payments_exception";
import { createUkassaRefund } from "../handlers/ukassa/create_ukassa_refund";

/**
 * required params:
 *  orderRefPath: string,
 */
export const refundPayment = onCall(
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
      });

      // -- check if request by parent

      const missedParams = getMissingBodyRequiredParams(request.data, [
        "orderRefPath",
      ]);

      if (missedParams.length > 0) {
        throw new GlobalException(
          `Required parameters were missed: ${missedParams.join(", ")}.`,
          GlobalExceptionType.RequiredParamsMissed,
          400
        );
      }

      const { orderRefPath } = request.data;

      // ? info : check if order exist
      const ordersRecord = await getOrdersRecordByRef(
        getRefFromPath(orderRefPath)
      );

      if (
        ordersRecord === null ||
        ordersRecord?.status === null ||
        ordersRecord?.payment_id === null
      ) {
        throw new GlobalException(
          `Order with ref ${orderRefPath} is not found or status is not paid.`,
          GlobalExceptionType.DocumentNotFound,
          404
        );
      }

      if (ordersRecord?.status === OrderStatus.Refunded) {
        logger.info({
          message: `Order with ref ${orderRefPath} is refunded.`,
          orderRefPath: orderRefPath,
        });
        throw new PaymentsException(
          `Order with ref ${orderRefPath} is refunded.`,
          PaymentsExceptionType.PaymentAlreadyRefunded,
          404
        );
      }

      const amountValue = ordersRecord?.amount!.toString();

      logger.info({
        message: `Amount value is ${amountValue}.`,
        amountValue: amountValue,
      });

      // const writeBatch = firestoreInstance.batch();

      // ? info: take money from client automatically
      const refund = await createUkassaRefund(
        process.env.UKASSA_SHOP_ID!,
        process.env.UKASSA_SECRET_KEY!,
        ordersRecord.payment_id,
        amountValue,
        DEFAULT_CURRENCY,
        ordersRecord.description ?? UKASSA_PAYMENT_REFUND_DESCRIPTION
      );

      // update payment in order

      if (refund === null) {
        ordersRecord.ref.update({ status: OrderStatus.RefundError });

        throw new PaymentsException(
          "Refund was not created.",
          PaymentsExceptionType.PaymentProviderError,
          500
        );
      } else {
        logger.info({
          message: "Payment waiting for refund.",
        });

        // ordersRecord.ref.update({ status: OrderStatus.Refunded });
      }

      logger.info({
        message: "Payment was refunded.",
      });

      return {
        status: 200,
        message: "Payment was refunded.",
      };
    } catch (error) {
      if (error instanceof PaymentsException) {
        logger.warn({
          error: error.message,
          type: error.type,
          status: error.status,
          ...error.body,
        });
        return {
          status: error.status,
          error: error.message,
          ...error.body,
        };
        return;
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
        status: 400,
        error: error,
        type: GlobalExceptionType.Unexpected,
      };
    }
  }
);
